/**
 * N8N Sync Edge Function
 *
 * Handles synchronization of n8n workflows with the OneEdge platform.
 * Stores n8n configuration securely and syncs workflow metadata.
 *
 * Endpoints:
 * - POST /connect - Test and save n8n connection
 * - POST /sync - Sync workflows from n8n instance
 * - POST /disconnect - Remove n8n configuration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { supabaseAdmin, getUserFromAuth } from '../_shared/supabase.ts';
import { encrypt, decrypt } from '../_shared/crypto.ts';

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}

interface ConnectRequest {
  action: 'connect';
  instance_url: string;
  api_key: string;
  webhook_url?: string;
}

interface SyncRequest {
  action: 'sync';
}

interface DisconnectRequest {
  action: 'disconnect';
}

interface GetConfigRequest {
  action: 'get_config';
}

type RequestBody = ConnectRequest | SyncRequest | DisconnectRequest | GetConfigRequest;

/**
 * Test connection to n8n instance.
 */
async function testN8NConnection(
  instanceUrl: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let url = instanceUrl.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (!url.includes('/api/v1')) {
      url = `${url}/api/v1`;
    }

    const response = await fetch(`${url}/workflows?limit=1`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }

    return { success: false, error: `Connection failed: ${response.statusText}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect';
    return { success: false, error: message };
  }
}

/**
 * Fetch all workflows from n8n instance.
 */
async function fetchN8NWorkflows(
  instanceUrl: string,
  apiKey: string
): Promise<N8NWorkflow[]> {
  let url = instanceUrl.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.includes('/api/v1')) {
    url = `${url}/api/v1`;
  }

  const response = await fetch(`${url}/workflows`, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflows: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
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

    const body: RequestBody = await req.json();

    switch (body.action) {
      case 'connect': {
        // Test connection first
        const testResult = await testN8NConnection(body.instance_url, body.api_key);
        if (!testResult.success) {
          return jsonResponse({
            success: false,
            error: testResult.error,
          });
        }

        // Encrypt the API key
        const encryptedApiKey = await encrypt(body.api_key);

        // Upsert the configuration
        const { data: config, error: upsertError } = await supabaseAdmin
          .from('n8n_configurations')
          .upsert({
            user_id: user.id,
            instance_url: body.instance_url,
            api_key_encrypted: encryptedApiKey,
            webhook_url: body.webhook_url,
            is_connected: true,
            connection_status: 'connected',
            last_sync_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (upsertError) {
          return errorResponse(`Failed to save configuration: ${upsertError.message}`, 500);
        }

        // Sync workflows immediately after connecting
        const workflows = await fetchN8NWorkflows(body.instance_url, body.api_key);

        // Update workflow count
        await supabaseAdmin
          .from('n8n_configurations')
          .update({
            workflows_count: workflows.length,
            metadata: { workflows: workflows.map(w => ({ id: w.id, name: w.name, active: w.active })) },
          })
          .eq('user_id', user.id);

        return jsonResponse({
          success: true,
          config: {
            ...config,
            api_key_encrypted: undefined, // Don't expose encrypted key
          },
          workflows_count: workflows.length,
        });
      }

      case 'sync': {
        // Get user's n8n configuration
        const { data: config, error: fetchError } = await supabaseAdmin
          .from('n8n_configurations')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError || !config) {
          return errorResponse('N8N not configured', 404);
        }

        // Decrypt API key
        const apiKey = await decrypt(config.api_key_encrypted);

        // Fetch workflows
        const workflows = await fetchN8NWorkflows(config.instance_url, apiKey);

        // Update configuration with new data
        await supabaseAdmin
          .from('n8n_configurations')
          .update({
            workflows_count: workflows.length,
            last_sync_at: new Date().toISOString(),
            connection_status: 'connected',
            metadata: { workflows: workflows.map(w => ({ id: w.id, name: w.name, active: w.active })) },
          })
          .eq('user_id', user.id);

        return jsonResponse({
          success: true,
          workflows_count: workflows.length,
          workflows: workflows,
        });
      }

      case 'disconnect': {
        // Delete the configuration
        const { error: deleteError } = await supabaseAdmin
          .from('n8n_configurations')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          return errorResponse(`Failed to disconnect: ${deleteError.message}`, 500);
        }

        return jsonResponse({ success: true });
      }

      case 'get_config': {
        // Get user's n8n configuration without the encrypted key
        const { data: config, error: fetchError } = await supabaseAdmin
          .from('n8n_configurations')
          .select('id, user_id, instance_url, webhook_url, is_connected, connection_status, last_sync_at, workflows_count, metadata, created_at, updated_at')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No configuration found
            return jsonResponse({ config: null });
          }
          return errorResponse(`Failed to get configuration: ${fetchError.message}`, 500);
        }

        return jsonResponse({ config });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('N8N sync error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
