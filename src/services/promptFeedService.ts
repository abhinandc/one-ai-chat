/**
 * Prompt Feed Service
 *
 * Handles operations for external prompt community feeds including:
 * - CRUD operations for prompt_feeds table
 * - Syncing external prompts from API/webhook/RSS sources
 * - Storing fetched prompts in external_prompts table
 *
 * @module services/promptFeedService
 */

import { supabase } from '../integrations/supabase';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PromptFeed {
  id: string;
  name: string;
  description: string | null;
  source_type: 'api' | 'webhook' | 'rss';
  source_url: string;
  api_key_encrypted: string | null;
  auth_header: string | null;
  refresh_interval_minutes: number;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'error' | 'pending' | null;
  last_sync_error: string | null;
  prompts_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalPrompt {
  id: string;
  feed_id: string;
  external_id: string;
  title: string;
  content: string;
  description: string | null;
  author: string | null;
  author_url: string | null;
  source_url: string | null;
  category: string | null;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  likes_count: number;
  uses_count: number;
  fetched_at: string;
  updated_at: string;
}

export interface PromptFeedInsert {
  name: string;
  description?: string | null;
  source_type: 'api' | 'webhook' | 'rss';
  source_url: string;
  api_key_encrypted?: string | null;
  auth_header?: string | null;
  refresh_interval_minutes?: number;
  is_active?: boolean;
  created_by?: string | null;
}

export interface PromptFeedUpdate {
  name?: string;
  description?: string | null;
  source_type?: 'api' | 'webhook' | 'rss';
  source_url?: string;
  api_key_encrypted?: string | null;
  auth_header?: string | null;
  refresh_interval_minutes?: number;
  is_active?: boolean;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'error' | 'pending';
  last_sync_error?: string | null;
  prompts_count?: number;
}

export interface ExternalPromptInsert {
  feed_id: string;
  external_id: string;
  title: string;
  content: string;
  description?: string | null;
  author?: string | null;
  author_url?: string | null;
  source_url?: string | null;
  category?: string | null;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  likes_count?: number;
  uses_count?: number;
}

export interface SyncResult {
  success: boolean;
  prompts_fetched: number;
  prompts_added: number;
  prompts_updated: number;
  error: string | null;
}

// ============================================================================
// PROMPT FEED SERVICE CLASS
// ============================================================================

class PromptFeedService {
  /**
   * Get all prompt feeds
   * Admins see all, employees see only active feeds
   */
  async getFeeds(): Promise<PromptFeed[]> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch prompt feeds', error);
      throw new Error(`Failed to fetch prompt feeds: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single feed by ID
   */
  async getFeedById(feedId: string): Promise<PromptFeed | null> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .select('*')
      .eq('id', feedId)
      .single();

    if (error) {
      logger.error('Failed to fetch feed', error);
      throw new Error(`Failed to fetch feed: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new prompt feed (Admin only)
   */
  async createFeed(feed: PromptFeedInsert): Promise<PromptFeed> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .insert(feed)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create prompt feed', error);
      throw new Error(`Failed to create prompt feed: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing prompt feed (Admin only)
   */
  async updateFeed(feedId: string, updates: PromptFeedUpdate): Promise<PromptFeed> {
    const { data, error } = await supabase
      .from('prompt_feeds')
      .update(updates)
      .eq('id', feedId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update prompt feed', error);
      throw new Error(`Failed to update prompt feed: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a prompt feed (Admin only)
   * Also deletes associated external_prompts via CASCADE
   */
  async deleteFeed(feedId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_feeds')
      .delete()
      .eq('id', feedId);

    if (error) {
      logger.error('Failed to delete prompt feed', error);
      throw new Error(`Failed to delete prompt feed: ${error.message}`);
    }
  }

  /**
   * Test connection to a feed source
   * Makes a test request without storing data
   */
  async testConnection(feed: PromptFeedInsert): Promise<{ success: boolean; message: string; sample_data?: any }> {
    try {
      const result = await this.fetchFromSource(
        feed.source_type,
        feed.source_url,
        feed.api_key_encrypted,
        feed.auth_header
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          message: result.error || 'No data returned from source',
        };
      }

      return {
        success: true,
        message: `Successfully fetched ${result.data.length || 0} prompts`,
        sample_data: result.data.slice(0, 3), // Return first 3 as sample
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Manually trigger sync for a specific feed
   */
  async syncFeed(feedId: string): Promise<SyncResult> {
    const feed = await this.getFeedById(feedId);
    if (!feed) {
      return {
        success: false,
        prompts_fetched: 0,
        prompts_added: 0,
        prompts_updated: 0,
        error: 'Feed not found',
      };
    }

    // Update sync status to pending
    await this.updateFeed(feedId, {
      last_sync_status: 'pending',
      last_sync_error: null,
    });

    try {
      const result = await this.fetchFromSource(
        feed.source_type,
        feed.source_url,
        feed.api_key_encrypted,
        feed.auth_header
      );

      if (!result.success || !result.data) {
        await this.updateFeed(feedId, {
          last_sync_status: 'error',
          last_sync_error: result.error || 'Failed to fetch data',
          last_sync_at: new Date().toISOString(),
        });
        return {
          success: false,
          prompts_fetched: 0,
          prompts_added: 0,
          prompts_updated: 0,
          error: result.error || 'Failed to fetch data',
        };
      }

      // Store fetched prompts
      const { added, updated } = await this.storeExternalPrompts(feedId, result.data);

      // Update feed metadata
      await this.updateFeed(feedId, {
        last_sync_status: 'success',
        last_sync_error: null,
        last_sync_at: new Date().toISOString(),
        prompts_count: await this.getPromptsCount(feedId),
      });

      return {
        success: true,
        prompts_fetched: result.data.length,
        prompts_added: added,
        prompts_updated: updated,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      await this.updateFeed(feedId, {
        last_sync_status: 'error',
        last_sync_error: errorMessage,
        last_sync_at: new Date().toISOString(),
      });
      return {
        success: false,
        prompts_fetched: 0,
        prompts_added: 0,
        prompts_updated: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch prompts from external source
   */
  private async fetchFromSource(
    sourceType: 'api' | 'webhook' | 'rss',
    sourceUrl: string,
    apiKey?: string | null,
    authHeader?: string | null
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authHeader) {
        const [key, value] = authHeader.split(':');
        if (key && value) {
          headers[key.trim()] = value.trim();
        }
      } else if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(sourceUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('xml') || contentType?.includes('rss')) {
        const text = await response.text();
        data = this.parseRSSFeed(text);
      } else {
        return {
          success: false,
          error: 'Unsupported content type. Expected JSON or RSS/XML.',
        };
      }

      // Normalize data to array
      const prompts = Array.isArray(data) ? data : data.prompts || data.items || [data];

      return {
        success: true,
        data: prompts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch from source',
      };
    }
  }

  /**
   * Parse RSS feed XML to extract prompts
   */
  private parseRSSFeed(xmlText: string): any[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = xmlDoc.querySelectorAll('item');

      return Array.from(items).map((item) => ({
        title: item.querySelector('title')?.textContent || '',
        content: item.querySelector('description')?.textContent || '',
        description: item.querySelector('summary')?.textContent || null,
        source_url: item.querySelector('link')?.textContent || null,
        author: item.querySelector('author')?.textContent || item.querySelector('creator')?.textContent || null,
        category: item.querySelector('category')?.textContent || null,
        external_id: item.querySelector('guid')?.textContent || item.querySelector('link')?.textContent || `rss-${Date.now()}`,
      }));
    } catch (error) {
      logger.error('Failed to parse RSS feed', error);
      return [];
    }
  }

  /**
   * Store external prompts in database
   */
  private async storeExternalPrompts(feedId: string, prompts: any[]): Promise<{ added: number; updated: number }> {
    let added = 0;
    let updated = 0;

    for (const prompt of prompts) {
      try {
        const externalPrompt: ExternalPromptInsert = {
          feed_id: feedId,
          external_id: prompt.external_id || prompt.id || `prompt-${Date.now()}-${Math.random()}`,
          title: prompt.title || 'Untitled',
          content: prompt.content || prompt.description || '',
          description: prompt.description || prompt.summary || null,
          author: prompt.author || null,
          author_url: prompt.author_url || null,
          source_url: prompt.source_url || prompt.url || null,
          category: prompt.category || null,
          tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          difficulty: this.normalizeDifficulty(prompt.difficulty),
          likes_count: typeof prompt.likes === 'number' ? prompt.likes : 0,
          uses_count: typeof prompt.uses === 'number' ? prompt.uses : 0,
        };

        // Try to upsert (insert or update if exists)
        const { error } = await supabase
          .from('external_prompts')
          .upsert(externalPrompt, {
            onConflict: 'feed_id,external_id',
          });

        if (error) {
          logger.error('Failed to store prompt', error);
          continue;
        }

        // Check if it was an insert or update
        const { data: existing } = await supabase
          .from('external_prompts')
          .select('id')
          .eq('feed_id', feedId)
          .eq('external_id', externalPrompt.external_id)
          .single();

        if (existing) {
          updated++;
        } else {
          added++;
        }
      } catch (error) {
        logger.error('Error processing prompt', error);
      }
    }

    return { added, updated };
  }

  /**
   * Normalize difficulty values
   */
  private normalizeDifficulty(difficulty: any): 'beginner' | 'intermediate' | 'advanced' | null {
    if (!difficulty) return null;
    const normalized = difficulty.toString().toLowerCase();
    if (normalized.includes('beginner') || normalized.includes('easy')) return 'beginner';
    if (normalized.includes('intermediate') || normalized.includes('medium')) return 'intermediate';
    if (normalized.includes('advanced') || normalized.includes('hard')) return 'advanced';
    return null;
  }

  /**
   * Get count of prompts for a feed
   */
  private async getPromptsCount(feedId: string): Promise<number> {
    const { count, error } = await supabase
      .from('external_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feedId);

    if (error) {
      logger.error('Failed to count prompts', error);
      return 0;
    }

    return count || 0;
  }

  // ========================================================================
  // EXTERNAL PROMPTS OPERATIONS (Employee-facing)
  // ========================================================================

  /**
   * Get all external prompts across all active feeds
   */
  async getExternalPrompts(filters?: {
    feed_id?: string;
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ExternalPrompt[]> {
    let query = supabase
      .from('external_prompts')
      .select('*')
      .order('fetched_at', { ascending: false });

    if (filters?.feed_id) {
      query = query.eq('feed_id', filters.feed_id);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch external prompts', error);
      throw new Error(`Failed to fetch external prompts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single external prompt by ID
   */
  async getExternalPromptById(promptId: string): Promise<ExternalPrompt | null> {
    const { data, error } = await supabase
      .from('external_prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error) {
      logger.error('Failed to fetch external prompt', error);
      return null;
    }

    return data;
  }

  /**
   * Increment uses count for an external prompt
   */
  async incrementExternalPromptUses(promptId: string): Promise<void> {
    const { error } = await supabase
      .from('external_prompts')
      .update({ uses_count: supabase.rpc('increment_prompt_uses', { prompt_id: promptId }) })
      .eq('id', promptId);

    if (error) {
      logger.error('Failed to increment prompt uses', error);
    }
  }

  /**
   * Import an external prompt to user's personal library
   */
  async importToLibrary(promptId: string, userId: string): Promise<void> {
    const externalPrompt = await this.getExternalPromptById(promptId);
    if (!externalPrompt) {
      throw new Error('External prompt not found');
    }

    // Create a copy in prompt_templates
    const { error } = await supabase
      .from('prompt_templates')
      .insert({
        user_email: userId,
        title: `${externalPrompt.title} (imported)`,
        content: externalPrompt.content,
        description: externalPrompt.description || '',
        category: externalPrompt.category || 'General',
        tags: externalPrompt.tags,
        difficulty: externalPrompt.difficulty || 'beginner',
        is_public: false,
      });

    if (error) {
      logger.error('Failed to import prompt', error);
      throw new Error(`Failed to import prompt: ${error.message}`);
    }

    // Increment uses count
    await this.incrementExternalPromptUses(promptId);
  }
}

export const promptFeedService = new PromptFeedService();
