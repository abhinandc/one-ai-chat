import supabaseClient from './supabaseClient';

export interface N8NConfig {
  id: string;
  instance_url: string;
  api_key_encrypted: string;
  webhook_url: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  workflow_count: number;
}

// Simple encryption/decryption for API key storage
// In production, use a proper encryption service
const encryptKey = (key: string): string => {
  // Base64 encode with a simple transformation
  return btoa(key.split('').reverse().join(''));
};

const decryptKey = (encrypted: string): string => {
  try {
    return atob(encrypted).split('').reverse().join('');
  } catch {
    return encrypted;
  }
};

class N8NConfigService {
  private localStorageKey = 'n8n_config';

  /**
   * Get N8N configuration - checks Supabase first, then localStorage
   */
  async getConfig(userEmail: string): Promise<N8NConfig | null> {
    // Try Supabase first
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.rpc('get_n8n_config', {
          p_user_email: userEmail
        });

        if (!error && data && data.length > 0) {
          const config = data[0];
          return {
            ...config,
            api_key_encrypted: decryptKey(config.api_key_encrypted)
          };
        }
      } catch (e) {
        console.warn('Failed to get N8N config from Supabase:', e);
      }
    }

    // Fall back to localStorage
    const localConfig = this.getLocalConfig();
    if (localConfig) {
      // Migrate to Supabase if available
      if (supabaseClient && userEmail) {
        this.saveConfig(userEmail, localConfig.instance_url, localConfig.api_key_encrypted, localConfig.webhook_url);
      }
      return localConfig;
    }

    return null;
  }

  /**
   * Save N8N configuration to Supabase and localStorage
   */
  async saveConfig(
    userEmail: string,
    instanceUrl: string,
    apiKey: string,
    webhookUrl?: string | null
  ): Promise<boolean> {
    const encryptedKey = encryptKey(apiKey);

    // Save to Supabase
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.rpc('save_n8n_config', {
          p_user_email: userEmail,
          p_instance_url: instanceUrl,
          p_api_key_encrypted: encryptedKey,
          p_webhook_url: webhookUrl || null
        });

        if (error) {
          console.error('Failed to save N8N config to Supabase:', error);
        }
      } catch (e) {
        console.error('Error saving N8N config:', e);
      }
    }

    // Also save to localStorage for offline access
    this.setLocalConfig({
      id: 'local',
      instance_url: instanceUrl,
      api_key_encrypted: apiKey, // Store unencrypted in localStorage
      webhook_url: webhookUrl || null,
      is_connected: true,
      last_sync_at: new Date().toISOString(),
      workflow_count: 0
    });

    return true;
  }

  /**
   * Remove N8N configuration
   */
  async removeConfig(userEmail: string): Promise<boolean> {
    // Remove from Supabase
    if (supabaseClient) {
      try {
        await supabaseClient
          .from('n8n_configurations')
          .delete()
          .eq('user_email', userEmail);
      } catch (e) {
        console.error('Error removing N8N config:', e);
      }
    }

    // Remove from localStorage
    this.removeLocalConfig();
    return true;
  }

  /**
   * Update sync status after fetching workflows
   */
  async updateSyncStatus(userEmail: string, workflowCount: number): Promise<void> {
    if (supabaseClient) {
      try {
        await supabaseClient.rpc('update_n8n_sync', {
          p_user_email: userEmail,
          p_workflow_count: workflowCount
        });
      } catch (e) {
        console.warn('Failed to update N8N sync status:', e);
      }
    }

    // Update localStorage
    const localConfig = this.getLocalConfig();
    if (localConfig) {
      this.setLocalConfig({
        ...localConfig,
        workflow_count: workflowCount,
        last_sync_at: new Date().toISOString()
      });
    }
  }

  /**
   * Check if configuration exists
   */
  async hasConfig(userEmail: string): Promise<boolean> {
    const config = await this.getConfig(userEmail);
    return config !== null;
  }

  // localStorage helpers
  private getLocalConfig(): N8NConfig | null {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return null;
  }

  private setLocalConfig(config: N8NConfig): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(config));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }

  private removeLocalConfig(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  }
}

export const n8nConfigService = new N8NConfigService();
