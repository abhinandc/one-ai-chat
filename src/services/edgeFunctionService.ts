/**
 * Edge Function Service
 *
 * Provides a unified interface for calling Supabase Edge Functions.
 * Handles authentication, error handling, and type-safe responses.
 *
 * @module services/edgeFunctionService
 */

import { supabase, supabaseUrl } from '@/integrations/supabase';

// Edge function base URL
const EDGE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;

/**
 * Generic response type from edge functions
 */
export interface EdgeFunctionResponse<T = unknown> {
  data?: T;
  error?: string;
}

/**
 * Edge Vault types
 */
export interface EdgeVaultEncryptRequest {
  action: 'encrypt';
  credentials: Record<string, unknown>;
}

export interface EdgeVaultDecryptRequest {
  action: 'decrypt';
  credential_id: string;
}

export interface EdgeVaultValidateRequest {
  action: 'validate';
  credential_id: string;
}

export interface EdgeVaultStoreRequest {
  action: 'store';
  integration_type: 'google' | 'slack' | 'jira' | 'n8n' | 'github' | 'notion' | 'custom';
  label: string;
  credentials: Record<string, unknown>;
  expires_at?: string;
}

export interface EdgeVaultUpdateRequest {
  action: 'update';
  credential_id: string;
  updates: {
    label?: string;
    credentials?: Record<string, unknown>;
    expires_at?: string;
  };
}

export type EdgeVaultRequest =
  | EdgeVaultEncryptRequest
  | EdgeVaultDecryptRequest
  | EdgeVaultValidateRequest
  | EdgeVaultStoreRequest
  | EdgeVaultUpdateRequest;

/**
 * N8N Sync types
 */
export interface N8nConnectRequest {
  action: 'connect';
  instance_url: string;
  api_key: string;
  webhook_url?: string;
}

export interface N8nSyncRequest {
  action: 'sync';
}

export interface N8nDisconnectRequest {
  action: 'disconnect';
}

export interface N8nGetConfigRequest {
  action: 'get_config';
}

export type N8nSyncRequestType =
  | N8nConnectRequest
  | N8nSyncRequest
  | N8nDisconnectRequest
  | N8nGetConfigRequest;

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
}

export interface N8nConfig {
  id: string;
  user_id: string;
  instance_url: string;
  webhook_url: string | null;
  is_connected: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending';
  last_sync_at: string | null;
  workflows_count: number;
  metadata: { workflows?: N8nWorkflow[] };
  created_at: string;
  updated_at: string;
}

/**
 * Process Automation types
 */
export interface AutomationExecuteRequest {
  action: 'execute';
  automation_id: string;
  input_data?: Record<string, unknown>;
}

export interface AutomationTriggerRequest {
  action: 'trigger';
  automation_id: string;
  trigger_data?: Record<string, unknown>;
}

export interface AutomationTestRequest {
  action: 'test';
  automation_id: string;
  input_data?: Record<string, unknown>;
}

export type AutomationRequest =
  | AutomationExecuteRequest
  | AutomationTriggerRequest
  | AutomationTestRequest;

export interface AutomationStepResult {
  step: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface AutomationExecutionResult {
  success: boolean;
  execution_id?: string;
  results?: AutomationStepResult[];
  error?: string;
  is_test?: boolean;
}

/**
 * Prompt Feed Sync types
 */
export interface PromptFeedSyncRequest {
  action: 'sync';
  feed_id: string;
}

export interface PromptFeedSyncAllRequest {
  action: 'sync_all';
}

export interface PromptFeedTestRequest {
  action: 'test';
  source_type: 'api' | 'webhook' | 'rss';
  source_url: string;
  api_key?: string;
  auth_header?: string;
}

export type PromptFeedRequest =
  | PromptFeedSyncRequest
  | PromptFeedSyncAllRequest
  | PromptFeedTestRequest;

/**
 * Edge Function Service class
 */
class EdgeFunctionService {
  /**
   * Get the current auth token from Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  /**
   * Call an edge function with the given payload
   */
  private async callFunction<TRequest, TResponse>(
    functionName: string,
    payload: TRequest
  ): Promise<TResponse> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Edge function error: ${response.statusText}`);
    }

    return data;
  }

  // =========================================================================
  // Edge Vault Methods
  // =========================================================================

  /**
   * Encrypt credentials (for client-side encryption before storage)
   */
  async encryptCredentials(
    credentials: Record<string, unknown>
  ): Promise<{ encrypted: string }> {
    return this.callFunction<EdgeVaultEncryptRequest, { encrypted: string }>(
      'edge-vault',
      { action: 'encrypt', credentials }
    );
  }

  /**
   * Decrypt a credential by ID
   */
  async decryptCredential(
    credentialId: string
  ): Promise<{ credentials: Record<string, unknown> }> {
    return this.callFunction<EdgeVaultDecryptRequest, { credentials: Record<string, unknown> }>(
      'edge-vault',
      { action: 'decrypt', credential_id: credentialId }
    );
  }

  /**
   * Validate a credential by testing the integration connection
   */
  async validateCredential(
    credentialId: string
  ): Promise<{ valid: boolean; error?: string }> {
    return this.callFunction<EdgeVaultValidateRequest, { valid: boolean; error?: string }>(
      'edge-vault',
      { action: 'validate', credential_id: credentialId }
    );
  }

  /**
   * Store a new credential with encryption
   */
  async storeCredential(
    integrationType: EdgeVaultStoreRequest['integration_type'],
    label: string,
    credentials: Record<string, unknown>,
    expiresAt?: string
  ): Promise<{ credential: unknown }> {
    return this.callFunction<EdgeVaultStoreRequest, { credential: unknown }>(
      'edge-vault',
      {
        action: 'store',
        integration_type: integrationType,
        label,
        credentials,
        expires_at: expiresAt,
      }
    );
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    credentialId: string,
    updates: EdgeVaultUpdateRequest['updates']
  ): Promise<{ credential: unknown }> {
    return this.callFunction<EdgeVaultUpdateRequest, { credential: unknown }>(
      'edge-vault',
      {
        action: 'update',
        credential_id: credentialId,
        updates,
      }
    );
  }

  // =========================================================================
  // N8N Sync Methods
  // =========================================================================

  /**
   * Connect to an n8n instance
   */
  async connectN8n(
    instanceUrl: string,
    apiKey: string,
    webhookUrl?: string
  ): Promise<{
    success: boolean;
    error?: string;
    config?: N8nConfig;
    workflows_count?: number;
  }> {
    return this.callFunction<N8nConnectRequest, {
      success: boolean;
      error?: string;
      config?: N8nConfig;
      workflows_count?: number;
    }>('n8n-sync', {
      action: 'connect',
      instance_url: instanceUrl,
      api_key: apiKey,
      webhook_url: webhookUrl,
    });
  }

  /**
   * Sync workflows from the connected n8n instance
   */
  async syncN8nWorkflows(): Promise<{
    success: boolean;
    workflows_count?: number;
    workflows?: N8nWorkflow[];
    error?: string;
  }> {
    return this.callFunction<N8nSyncRequest, {
      success: boolean;
      workflows_count?: number;
      workflows?: N8nWorkflow[];
      error?: string;
    }>('n8n-sync', { action: 'sync' });
  }

  /**
   * Disconnect from n8n
   */
  async disconnectN8n(): Promise<{ success: boolean }> {
    return this.callFunction<N8nDisconnectRequest, { success: boolean }>(
      'n8n-sync',
      { action: 'disconnect' }
    );
  }

  /**
   * Get the current n8n configuration
   */
  async getN8nConfig(): Promise<{ config: N8nConfig | null }> {
    return this.callFunction<N8nGetConfigRequest, { config: N8nConfig | null }>(
      'n8n-sync',
      { action: 'get_config' }
    );
  }

  // =========================================================================
  // Process Automation Methods
  // =========================================================================

  /**
   * Execute an automation
   */
  async executeAutomation(
    automationId: string,
    inputData?: Record<string, unknown>
  ): Promise<AutomationExecutionResult> {
    return this.callFunction<AutomationExecuteRequest, AutomationExecutionResult>(
      'process-automation',
      {
        action: 'execute',
        automation_id: automationId,
        input_data: inputData,
      }
    );
  }

  /**
   * Trigger an automation via webhook
   */
  async triggerAutomation(
    automationId: string,
    triggerData?: Record<string, unknown>
  ): Promise<AutomationExecutionResult> {
    return this.callFunction<AutomationTriggerRequest, AutomationExecutionResult>(
      'process-automation',
      {
        action: 'trigger',
        automation_id: automationId,
        trigger_data: triggerData,
      }
    );
  }

  /**
   * Test run an automation (dry run)
   */
  async testAutomation(
    automationId: string,
    inputData?: Record<string, unknown>
  ): Promise<AutomationExecutionResult> {
    return this.callFunction<AutomationTestRequest, AutomationExecutionResult>(
      'process-automation',
      {
        action: 'test',
        automation_id: automationId,
        input_data: inputData,
      }
    );
  }

  // =========================================================================
  // Prompt Feed Sync Methods
  // =========================================================================

  /**
   * Sync a specific prompt feed (admin only)
   */
  async syncPromptFeed(feedId: string): Promise<{
    success: boolean;
    prompts_fetched: number;
    prompts_new: number;
    error?: string;
  }> {
    return this.callFunction<PromptFeedSyncRequest, {
      success: boolean;
      prompts_fetched: number;
      prompts_new: number;
      error?: string;
    }>('prompt-feed-sync', {
      action: 'sync',
      feed_id: feedId,
    });
  }

  /**
   * Sync all active prompt feeds (admin only)
   */
  async syncAllPromptFeeds(): Promise<{
    success: boolean;
    feeds_synced: number;
    results: Array<{
      feed_id: string;
      success: boolean;
      prompts_fetched: number;
      prompts_new: number;
      error?: string;
    }>;
  }> {
    return this.callFunction<PromptFeedSyncAllRequest, {
      success: boolean;
      feeds_synced: number;
      results: Array<{
        feed_id: string;
        success: boolean;
        prompts_fetched: number;
        prompts_new: number;
        error?: string;
      }>;
    }>('prompt-feed-sync', { action: 'sync_all' });
  }

  /**
   * Test a prompt feed configuration (admin only)
   */
  async testPromptFeed(
    sourceType: 'api' | 'webhook' | 'rss',
    sourceUrl: string,
    apiKey?: string,
    authHeader?: string
  ): Promise<{
    success: boolean;
    prompts_found?: number;
    sample_prompts?: Array<{
      external_id: string;
      title: string;
      content: string;
    }>;
    error?: string;
    message?: string;
  }> {
    return this.callFunction<PromptFeedTestRequest, {
      success: boolean;
      prompts_found?: number;
      sample_prompts?: Array<{
        external_id: string;
        title: string;
        content: string;
      }>;
      error?: string;
      message?: string;
    }>('prompt-feed-sync', {
      action: 'test',
      source_type: sourceType,
      source_url: sourceUrl,
      api_key: apiKey,
      auth_header: authHeader,
    });
  }
}

export const edgeFunctionService = new EdgeFunctionService();
