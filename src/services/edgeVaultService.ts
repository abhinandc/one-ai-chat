import supabase from './supabaseClient';

export type IntegrationType = 'google' | 'slack' | 'jira' | 'n8n' | 'custom';
export type CredentialStatus = 'active' | 'expired' | 'error';

export interface EdgeVaultCredential {
  id: string;
  user_id: string;
  integration_type: IntegrationType;
  label: string;
  encrypted_credentials: string;
  status: CredentialStatus;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialInput {
  integration_type: IntegrationType;
  label: string;
  credentials: Record<string, unknown>;
}

export interface UpdateCredentialInput {
  label?: string;
  credentials?: Record<string, unknown>;
}

// Integration type metadata for UI display
export const INTEGRATION_METADATA: Record<IntegrationType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  fields: { key: string; label: string; type: 'text' | 'password' | 'url'; placeholder: string; required: boolean }[];
}> = {
  google: {
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Drive, Sheets',
    icon: 'Mail',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'OAuth client ID', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'OAuth client secret', required: true },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', placeholder: 'OAuth refresh token', required: true },
    ]
  },
  slack: {
    name: 'Slack',
    description: 'Channels, messages, notifications',
    icon: 'MessageSquare',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true },
      { key: 'signing_secret', label: 'Signing Secret', type: 'password', placeholder: 'Signing secret', required: false },
    ]
  },
  jira: {
    name: 'Jira',
    description: 'Issues, projects, sprints',
    icon: 'Bug',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    fields: [
      { key: 'domain', label: 'Jira Domain', type: 'url', placeholder: 'https://your-org.atlassian.net', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'your@email.com', required: true },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Jira API token', required: true },
    ]
  },
  n8n: {
    name: 'n8n',
    description: 'Workflow automation',
    icon: 'Workflow',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    fields: [
      { key: 'url', label: 'Instance URL', type: 'url', placeholder: 'https://your-n8n.example.com', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'n8n API key', required: true },
    ]
  },
  custom: {
    name: 'Custom Integration',
    description: 'Custom API or webhook',
    icon: 'Settings',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    fields: [
      { key: 'url', label: 'API URL', type: 'url', placeholder: 'https://api.example.com', required: false },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'API key or token', required: false },
      { key: 'custom_data', label: 'Custom Data (JSON)', type: 'text', placeholder: '{"key": "value"}', required: false },
    ]
  }
};

class EdgeVaultService {
  /**
   * Get all credentials for a user (without decrypted data)
   */
  async getCredentials(userId: string): Promise<EdgeVaultCredential[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch credentials:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get a single credential by ID
   */
  async getCredential(credentialId: string, userId: string): Promise<EdgeVaultCredential | null> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to fetch credential:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Create a new credential with encryption
   */
  async createCredential(input: CreateCredentialInput, userId: string): Promise<EdgeVaultCredential> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Encrypt credentials via Edge Function
    const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('edge-vault', {
      body: {
        action: 'encrypt',
        credentials: input.credentials
      }
    });

    if (encryptError || !encryptResult?.encrypted) {
      console.error('Encryption failed:', encryptError);
      throw new Error('Failed to encrypt credentials');
    }

    // Store in database
    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .insert({
        user_id: userId,
        integration_type: input.integration_type,
        label: input.label,
        encrypted_credentials: encryptResult.encrypted,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create credential:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update a credential
   */
  async updateCredential(credentialId: string, userId: string, input: UpdateCredentialInput): Promise<EdgeVaultCredential> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (input.label) {
      updates.label = input.label;
    }

    if (input.credentials) {
      // Encrypt new credentials via Edge Function
      const { data: encryptResult, error: encryptError } = await supabase.functions.invoke('edge-vault', {
        body: {
          action: 'encrypt',
          credentials: input.credentials
        }
      });

      if (encryptError || !encryptResult?.encrypted) {
        console.error('Encryption failed:', encryptError);
        throw new Error('Failed to encrypt credentials');
      }

      updates.encrypted_credentials = encryptResult.encrypted;
    }

    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .update(updates)
      .eq('id', credentialId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update credential:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('edge_vault_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete credential:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Get decrypted credentials (only when needed)
   */
  async getDecryptedCredentials(credentialId: string, userId: string): Promise<Record<string, unknown>> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // First get the credential to verify ownership
    const credential = await this.getCredential(credentialId, userId);
    if (!credential) {
      throw new Error('Credential not found or access denied');
    }

    // Decrypt via Edge Function
    const { data: decryptResult, error: decryptError } = await supabase.functions.invoke('edge-vault', {
      body: {
        action: 'decrypt',
        encrypted: credential.encrypted_credentials
      }
    });

    if (decryptError || !decryptResult?.credentials) {
      console.error('Decryption failed:', decryptError);
      throw new Error('Failed to decrypt credentials');
    }

    return decryptResult.credentials;
  }

  /**
   * Validate a credential by testing the connection
   */
  async validateCredential(credentialId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const credential = await this.getCredential(credentialId, userId);
    if (!credential) {
      throw new Error('Credential not found');
    }

    try {
      // Validate via Edge Function
      const { data: validateResult, error: validateError } = await supabase.functions.invoke('edge-vault', {
        body: {
          action: 'validate',
          credential_id: credentialId,
          integration_type: credential.integration_type
        }
      });

      if (validateError) {
        console.error('Validation error:', validateError);
        return false;
      }

      const isValid = validateResult?.valid === true;

      // Update status and last_validated_at
      await supabase
        .from('edge_vault_credentials')
        .update({
          status: isValid ? 'active' : 'error',
          last_validated_at: new Date().toISOString()
        })
        .eq('id', credentialId)
        .eq('user_id', userId);

      return isValid;
    } catch (error) {
      console.error('Validation failed:', error);

      // Update status to error
      await supabase
        .from('edge_vault_credentials')
        .update({
          status: 'error',
          last_validated_at: new Date().toISOString()
        })
        .eq('id', credentialId)
        .eq('user_id', userId);

      return false;
    }
  }

  /**
   * Get credentials by integration type
   */
  async getCredentialsByType(userId: string, integrationType: IntegrationType): Promise<EdgeVaultCredential[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', integrationType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch credentials by type:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
}

export const edgeVaultService = new EdgeVaultService();
