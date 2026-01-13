/**
 * Prompt Feed Sync Edge Function
 *
 * Handles synchronization of external prompt feeds.
 * Admin-only functionality for fetching and storing prompts from external sources.
 *
 * Endpoints:
 * - POST /sync - Sync a specific feed
 * - POST /sync-all - Sync all active feeds
 * - POST /test - Test a feed configuration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { supabaseAdmin, getUserFromAuth } from '../_shared/supabase.ts';
import { decrypt } from '../_shared/crypto.ts';

type SourceType = 'api' | 'webhook' | 'rss';

interface ExternalPrompt {
  external_id: string;
  title: string;
  content: string;
  description?: string;
  author?: string;
  author_url?: string;
  source_url?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface SyncRequest {
  action: 'sync';
  feed_id: string;
}

interface SyncAllRequest {
  action: 'sync_all';
}

interface TestRequest {
  action: 'test';
  source_type: SourceType;
  source_url: string;
  api_key?: string;
  auth_header?: string;
}

type RequestBody = SyncRequest | SyncAllRequest | TestRequest;

/**
 * Check if user is an admin.
 */
async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('is_oneedge_admin', { check_user_id: userId });

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data ?? false;
}

/**
 * Fetch prompts from an API endpoint.
 */
async function fetchFromApi(
  url: string,
  apiKey?: string,
  authHeader?: string
): Promise<ExternalPrompt[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Try to normalize the response to our expected format
  if (Array.isArray(data)) {
    return data.map(normalizePrompt);
  } else if (data.prompts && Array.isArray(data.prompts)) {
    return data.prompts.map(normalizePrompt);
  } else if (data.data && Array.isArray(data.data)) {
    return data.data.map(normalizePrompt);
  }

  throw new Error('Unexpected API response format');
}

/**
 * Parse RSS feed and extract prompts.
 */
async function fetchFromRss(url: string): Promise<ExternalPrompt[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.statusText}`);
  }

  const xml = await response.text();

  // Simple RSS parsing (in production, use a proper XML parser)
  const prompts: ExternalPrompt[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
  const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
  const linkRegex = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/;
  const guidRegex = /<guid[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/guid>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(titleRegex)?.[1] || 'Untitled';
    const description = item.match(descRegex)?.[1] || '';
    const link = item.match(linkRegex)?.[1] || '';
    const guid = item.match(guidRegex)?.[1] || link || `rss-${Date.now()}-${prompts.length}`;

    prompts.push({
      external_id: guid,
      title: title.trim(),
      content: description.trim(),
      source_url: link,
    });
  }

  return prompts;
}

/**
 * Normalize a prompt from various formats to our expected format.
 */
function normalizePrompt(data: Record<string, unknown>): ExternalPrompt {
  return {
    external_id: String(data.id || data.external_id || data.guid || `ext-${Date.now()}`),
    title: String(data.title || data.name || 'Untitled'),
    content: String(data.content || data.prompt || data.text || data.body || ''),
    description: data.description ? String(data.description) : undefined,
    author: data.author ? String(data.author) : undefined,
    author_url: data.author_url ? String(data.author_url) : undefined,
    source_url: data.source_url || data.url || data.link ? String(data.source_url || data.url || data.link) : undefined,
    category: data.category ? String(data.category) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(String(data.difficulty))
      ? String(data.difficulty) as 'beginner' | 'intermediate' | 'advanced'
      : undefined,
  };
}

/**
 * Sync a single feed.
 */
async function syncFeed(feedId: string): Promise<{
  success: boolean;
  prompts_fetched: number;
  prompts_new: number;
  error?: string;
}> {
  // Get the feed configuration
  const { data: feed, error: fetchError } = await supabaseAdmin
    .from('prompt_feeds')
    .select('*')
    .eq('id', feedId)
    .single();

  if (fetchError || !feed) {
    return { success: false, prompts_fetched: 0, prompts_new: 0, error: 'Feed not found' };
  }

  try {
    // Decrypt API key if present
    let apiKey: string | undefined;
    if (feed.api_key_encrypted) {
      apiKey = await decrypt(feed.api_key_encrypted);
    }

    // Fetch prompts based on source type
    let prompts: ExternalPrompt[];

    switch (feed.source_type) {
      case 'api':
        prompts = await fetchFromApi(feed.source_url, apiKey, feed.auth_header);
        break;
      case 'rss':
        prompts = await fetchFromRss(feed.source_url);
        break;
      case 'webhook':
        // Webhooks push to us, so nothing to fetch
        prompts = [];
        break;
      default:
        throw new Error('Unknown source type');
    }

    // Upsert prompts
    let newCount = 0;
    for (const prompt of prompts) {
      const { error: upsertError } = await supabaseAdmin
        .from('external_prompts')
        .upsert(
          {
            feed_id: feedId,
            external_id: prompt.external_id,
            title: prompt.title,
            content: prompt.content,
            description: prompt.description,
            author: prompt.author,
            author_url: prompt.author_url,
            source_url: prompt.source_url,
            category: prompt.category,
            tags: prompt.tags || [],
            difficulty: prompt.difficulty,
          },
          {
            onConflict: 'feed_id,external_id',
            ignoreDuplicates: false,
          }
        );

      if (!upsertError) {
        newCount++;
      }
    }

    // Update feed status
    await supabaseAdmin
      .from('prompt_feeds')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_error: null,
        prompts_count: prompts.length,
      })
      .eq('id', feedId);

    return {
      success: true,
      prompts_fetched: prompts.length,
      prompts_new: newCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed';

    // Update feed with error status
    await supabaseAdmin
      .from('prompt_feeds')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'error',
        last_sync_error: errorMessage,
      })
      .eq('id', feedId);

    return {
      success: false,
      prompts_fetched: 0,
      prompts_new: 0,
      error: errorMessage,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const cors = handleCors(req);
  if (cors) return cors;

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user is admin
    if (!(await isAdmin(user.id))) {
      return errorResponse('Admin access required', 403);
    }

    const body: RequestBody = await req.json();

    switch (body.action) {
      case 'sync': {
        const result = await syncFeed(body.feed_id);
        return jsonResponse(result);
      }

      case 'sync_all': {
        // Get all active feeds
        const { data: feeds, error: fetchError } = await supabaseAdmin
          .from('prompt_feeds')
          .select('id')
          .eq('is_active', true);

        if (fetchError) {
          return errorResponse(`Failed to fetch feeds: ${fetchError.message}`, 500);
        }

        const results = [];
        for (const feed of feeds || []) {
          const result = await syncFeed(feed.id);
          results.push({ feed_id: feed.id, ...result });
        }

        return jsonResponse({
          success: true,
          feeds_synced: results.length,
          results,
        });
      }

      case 'test': {
        try {
          let prompts: ExternalPrompt[];

          switch (body.source_type) {
            case 'api':
              prompts = await fetchFromApi(body.source_url, body.api_key, body.auth_header);
              break;
            case 'rss':
              prompts = await fetchFromRss(body.source_url);
              break;
            case 'webhook':
              // Cannot test webhooks
              return jsonResponse({
                success: true,
                message: 'Webhook endpoints receive data pushed to them',
                sample_prompts: [],
              });
            default:
              throw new Error('Unknown source type');
          }

          return jsonResponse({
            success: true,
            prompts_found: prompts.length,
            sample_prompts: prompts.slice(0, 3), // Return first 3 as samples
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Test failed';
          return jsonResponse({
            success: false,
            error: message,
          });
        }
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Prompt feed sync error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
