/**
 * EdgeVault Edge Function
 *
 * Handles secure credential storage and retrieval for integrations.
 * All credentials are encrypted using AES-256-GCM before storage.
 *
 * Endpoints:
 * - POST /encrypt - Encrypt credentials before storing
 * - POST /decrypt - Decrypt credentials for use
 * - POST /validate - Validate credentials by testing the integration
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { supabaseAdmin, getUserFromAuth } from '../_shared/supabase.ts';
import { encrypt, decrypt } from '../_shared/crypto.ts';

type IntegrationType = 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';

interface EncryptRequest {
  action: 'encrypt';
  credentials: Record<string, unknown>;
}

interface DecryptRequest {
  action: 'decrypt';
  credential_id: string;
}

interface ValidateRequest {
  action: 'validate';
  credential_id: string;
}

interface StoreRequest {
  action: 'store';
  integration_type: IntegrationType;
  label: string;
  credentials: Record<string, unknown>;
  expires_at?: string;
}

interface UpdateRequest {
  action: 'update';
  credential_id: string;
  updates: {
    label?: string;
    credentials?: Record<string, unknown>;
    expires_at?: string;
  };
}

type RequestBody = EncryptRequest | DecryptRequest | ValidateRequest | StoreRequest | UpdateRequest;

/**
 * Validate integration credentials by testing the connection.
 */
async function validateIntegration(
  integrationType: IntegrationType,
  credentials: Record<string, unknown>
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (integrationType) {
      case 'n8n': {
        const url = credentials.url as string;
        const apiKey = credentials.api_key as string;
        if (!url || !apiKey) {
          return { valid: false, error: 'Missing url or api_key' };
        }
        const apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const response = await fetch(`${apiUrl}/api/v1/workflows?limit=1`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          return { valid: true };
        }
        if (response.status === 401) {
          return { valid: false, error: 'Invalid API key' };
        }
        return { valid: false, error: `Connection failed: ${response.statusText}` };
      }

      case 'slack': {
        const token = credentials.token as string;
        if (!token) {
          return { valid: false, error: 'Missing token' };
        }
        const response = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        const data = await response.json();
        if (data.ok) {
          return { valid: true };
        }
        return { valid: false, error: data.error || 'Invalid token' };
      }

      case 'github': {
        const token = credentials.token as string;
        if (!token) {
          return { valid: false, error: 'Missing token' };
        }
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (response.ok) {
          return { valid: true };
        }
        if (response.status === 401) {
          return { valid: false, error: 'Invalid token' };
        }
        return { valid: false, error: `Validation failed: ${response.statusText}` };
      }

      case 'google':
      case 'jira':
      case 'notion':
      case 'custom':
        // For OAuth-based integrations, we just check that credentials exist
        // Full validation would require OAuth token refresh
        if (Object.keys(credentials).length === 0) {
          return { valid: false, error: 'No credentials provided' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Unknown integration type' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    return { valid: false, error: message };
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

    const body: RequestBody = await req.json();

    switch (body.action) {
      case 'encrypt': {
        // Simply encrypt credentials and return
        const encrypted = await encrypt(JSON.stringify(body.credentials));
        return jsonResponse({ encrypted });
      }

      case 'decrypt': {
        // Verify user owns the credential
        const { data: credential, error: fetchError } = await supabaseAdmin
          .from('edge_vault_credentials')
          .select('encrypted_credentials, user_id')
          .eq('id', body.credential_id)
          .single();

        if (fetchError || !credential) {
          return errorResponse('Credential not found', 404);
        }

        if (credential.user_id !== user.id) {
          return errorResponse('Unauthorized', 403);
        }

        const decrypted = await decrypt(credential.encrypted_credentials);
        return jsonResponse({ credentials: JSON.parse(decrypted) });
      }

      case 'validate': {
        // Fetch and validate credential
        const { data: credential, error: fetchError } = await supabaseAdmin
          .from('edge_vault_credentials')
          .select('*')
          .eq('id', body.credential_id)
          .single();

        if (fetchError || !credential) {
          return errorResponse('Credential not found', 404);
        }

        if (credential.user_id !== user.id) {
          return errorResponse('Unauthorized', 403);
        }

        // Decrypt credentials
        const decrypted = await decrypt(credential.encrypted_credentials);
        const creds = JSON.parse(decrypted);

        // Validate the integration
        const result = await validateIntegration(
          credential.integration_type as IntegrationType,
          creds
        );

        // Update credential status
        await supabaseAdmin
          .from('edge_vault_credentials')
          .update({
            status: result.valid ? 'active' : 'error',
            last_validated_at: new Date().toISOString(),
          })
          .eq('id', body.credential_id);

        return jsonResponse({
          valid: result.valid,
          error: result.error,
        });
      }

      case 'store': {
        // Encrypt and store new credential
        const encrypted = await encrypt(JSON.stringify(body.credentials));

        const { data: stored, error: storeError } = await supabaseAdmin
          .from('edge_vault_credentials')
          .insert({
            user_id: user.id,
            integration_type: body.integration_type,
            label: body.label,
            encrypted_credentials: encrypted,
            status: 'active',
            expires_at: body.expires_at,
          })
          .select()
          .single();

        if (storeError) {
          return errorResponse(`Failed to store credential: ${storeError.message}`, 500);
        }

        return jsonResponse({ credential: stored });
      }

      case 'update': {
        // Verify ownership
        const { data: existing, error: fetchError } = await supabaseAdmin
          .from('edge_vault_credentials')
          .select('user_id')
          .eq('id', body.credential_id)
          .single();

        if (fetchError || !existing) {
          return errorResponse('Credential not found', 404);
        }

        if (existing.user_id !== user.id) {
          return errorResponse('Unauthorized', 403);
        }

        const updates: Record<string, unknown> = {};

        if (body.updates.label) {
          updates.label = body.updates.label;
        }

        if (body.updates.credentials) {
          updates.encrypted_credentials = await encrypt(
            JSON.stringify(body.updates.credentials)
          );
        }

        if (body.updates.expires_at) {
          updates.expires_at = body.updates.expires_at;
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('edge_vault_credentials')
          .update(updates)
          .eq('id', body.credential_id)
          .select()
          .single();

        if (updateError) {
          return errorResponse(`Failed to update credential: ${updateError.message}`, 500);
        }

        return jsonResponse({ credential: updated });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('EdgeVault error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
