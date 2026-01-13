import { supabase } from '@/integrations/supabase';
import { edgeFunctionService } from './edgeFunctionService';
import { edgeVaultLogger as logger } from '@/lib/logger';
import type {
  EdgeVaultCredential,
  EdgeVaultCredentialInsert,
  EdgeVaultCredentialUpdate,
  IntegrationType,
  CredentialStatus,
} from '@/integrations/supabase';

// Re-export types for convenience
export type { EdgeVaultCredential, IntegrationType, CredentialStatus };

export interface CreateCredentialInput {
  integration_type: IntegrationType;
  label: string;
  credentials: Record<string, unknown>;
}

/**
 * EdgeVaultService - Secure Credential Management
 *
 * SECURITY ARCHITECTURE:
 * ======================
 *
 * 1. ENCRYPTION METHOD:
 *    - Uses AES-256-GCM encryption via Supabase Edge Functions
 *    - Encryption key stored server-side only (EDGE_VAULT_ENCRYPTION_KEY)
 *    - 12-byte random IV generated per encryption operation
 *    - Authenticated encryption with automatic integrity checking
 *
 * 2. DATA FLOW:
 *    Client (plaintext) → Edge Function (encrypt with AES-256-GCM) → Database (encrypted)
 *    Database (encrypted) → Edge Function (decrypt + verify) → Client (plaintext)
 *
 * 3. SECURITY GUARANTEES:
 *    - Confidentiality: AES-256-GCM is industry-standard encryption
 *    - Integrity: GCM mode provides built-in authentication tag (HMAC-like)
 *    - Authentication: Only authenticated users can access their credentials (RLS + JWT)
 *    - Forward secrecy: Each encryption uses a unique random IV
 *
 * 4. MIGRATION FROM BASE64:
 *    - Legacy base64-encoded credentials are detected by pattern matching
 *    - On first access, they are re-encrypted with AES-256-GCM
 *    - Migration is transparent to the application
 *
 * 5. ERROR HANDLING:
 *    - All encryption/decryption failures are caught and logged
 *    - Failed operations throw descriptive errors (never silent failures)
 *    - Network errors are retried with exponential backoff
 *
 * WHY EDGE FUNCTION INSTEAD OF CLIENT-SIDE:
 * ==========================================
 * - Encryption key never exposed to client
 * - Centralized key rotation capability
 * - Consistent encryption across all clients
 * - Server-side audit logging of all operations
 * - Protection against compromised client code
 */
class EdgeVaultService {
  /**
   * Detect if a credential is using legacy base64 encoding.
   * Base64-encoded JSON typically starts with 'eyJ' ('{' in base64).
   * Proper AES-256-GCM encrypted data is longer and has different characteristics.
   */
  private isLegacyBase64(encrypted: string): boolean {
    try {
      // Legacy format check: starts with base64-encoded JSON pattern
      if (encrypted.startsWith('eyJ') && encrypted.length < 500) {
        // Try to decode as base64 JSON
        const decoded = atob(encrypted);
        JSON.parse(decoded);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Migrate legacy base64-encoded credential to AES-256-GCM encryption.
   * This happens transparently on first access.
   */
  private async migrateLegacyCredential(
    credentialId: string,
    userId: string,
    legacyEncrypted: string
  ): Promise<void> {
    try {
      logger.warn(`Migrating legacy credential to AES-256-GCM`, { credentialId });

      // Decode legacy base64
      const decoded = atob(legacyEncrypted);
      const credentials = JSON.parse(decoded);

      // Re-encrypt with proper AES-256-GCM via Edge Function
      const { encrypted } = await edgeFunctionService.encryptCredentials(credentials);

      // Update in database
      const updateData: EdgeVaultCredentialUpdate = {
        encrypted_credentials: encrypted,
      };

      const { error } = await supabase
        .from('edge_vault_credentials')
        .update(updateData)
        .eq('id', credentialId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to migrate credential: ${error.message}`);
      }

      logger.info(`Successfully migrated credential`, { credentialId });
    } catch (error) {
      logger.error(`Migration failed for credential`, error, { credentialId });
      throw new Error(
        `Failed to migrate legacy credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Encrypt credentials using AES-256-GCM via Edge Function.
   *
   * @throws {Error} If encryption fails or user is not authenticated
   */
  private async encryptCredentials(credentials: Record<string, unknown>): Promise<string> {
    try {
      if (Object.keys(credentials).length === 0) {
        throw new Error('Cannot encrypt empty credentials');
      }

      const result = await edgeFunctionService.encryptCredentials(credentials);

      if (!result.encrypted) {
        throw new Error('Encryption returned empty result');
      }

      return result.encrypted;
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error(
        `Failed to encrypt credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt credentials using AES-256-GCM via Edge Function.
   * Automatically handles legacy base64 migration.
   *
   * @throws {Error} If decryption fails, credential not found, or integrity check fails
   */
  private async decryptCredential(
    credentialId: string,
    userId: string
  ): Promise<Record<string, unknown>> {
    try {
      // First, fetch the credential to check if migration is needed
      const { data: credential, error: fetchError } = await supabase
        .from('edge_vault_credentials')
        .select('encrypted_credentials')
        .eq('id', credentialId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !credential) {
        throw new Error('Credential not found or access denied');
      }

      // Check if this is a legacy base64-encoded credential
      if (this.isLegacyBase64(credential.encrypted_credentials)) {
        logger.warn('Detected legacy credential, migrating...', { credentialId });
        await this.migrateLegacyCredential(credentialId, userId, credential.encrypted_credentials);

        // Fetch the newly encrypted credential
        const { data: migratedCredential, error: migratedError } = await supabase
          .from('edge_vault_credentials')
          .select('encrypted_credentials')
          .eq('id', credentialId)
          .eq('user_id', userId)
          .single();

        if (migratedError || !migratedCredential) {
          throw new Error('Failed to fetch migrated credential');
        }

        credential.encrypted_credentials = migratedCredential.encrypted_credentials;
      }

      // Decrypt via Edge Function (includes integrity verification via GCM auth tag)
      const result = await edgeFunctionService.decryptCredential(credentialId);

      if (!result.credentials || Object.keys(result.credentials).length === 0) {
        throw new Error('Decryption returned empty credentials');
      }

      return result.credentials;
    } catch (error) {
      logger.error('Decryption failed for credential', error, { credentialId });
      throw new Error(
        `Failed to decrypt credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all credentials for a user.
   * RLS policy ensures user can only see their own credentials.
   */
  async getCredentials(userId: string): Promise<EdgeVaultCredential[]> {
    const { data, error } = await supabase
      .from('edge_vault_credentials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch credentials', error);
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new credential with AES-256-GCM encryption.
   * RLS policy ensures user can only create credentials for themselves.
   *
   * @throws {Error} If validation fails, encryption fails, or database insert fails
   */
  async createCredential(
    input: CreateCredentialInput,
    userId: string
  ): Promise<EdgeVaultCredential> {
    try {
      // Validate input
      if (!input.integration_type) {
        throw new Error('Integration type is required');
      }
      if (!input.label || input.label.trim().length === 0) {
        throw new Error('Label is required');
      }
      if (!input.credentials || Object.keys(input.credentials).length === 0) {
        throw new Error('Credentials cannot be empty');
      }

      // Use Edge Function to store credential (handles encryption)
      const result = await edgeFunctionService.storeCredential(
        input.integration_type,
        input.label,
        input.credentials
      );

      if (!result.credential) {
        throw new Error('Failed to store credential');
      }

      return result.credential as EdgeVaultCredential;
    } catch (error) {
      logger.error('Failed to create credential', error);
      throw new Error(
        `Failed to create credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing credential with AES-256-GCM encryption.
   * RLS policy ensures user can only update their own credentials.
   *
   * @throws {Error} If validation fails, encryption fails, or database update fails
   */
  async updateCredential(
    credentialId: string,
    userId: string,
    updates: Partial<CreateCredentialInput>
  ): Promise<EdgeVaultCredential> {
    try {
      // Validate input
      if (!credentialId) {
        throw new Error('Credential ID is required');
      }
      if (updates.label !== undefined && updates.label.trim().length === 0) {
        throw new Error('Label cannot be empty');
      }
      if (updates.credentials !== undefined && Object.keys(updates.credentials).length === 0) {
        throw new Error('Credentials cannot be empty');
      }

      // Use Edge Function to update credential (handles encryption)
      const edgeUpdates: { label?: string; credentials?: Record<string, unknown> } = {};
      if (updates.label) {
        edgeUpdates.label = updates.label;
      }
      if (updates.credentials) {
        edgeUpdates.credentials = updates.credentials;
      }

      const result = await edgeFunctionService.updateCredential(credentialId, edgeUpdates);

      if (!result.credential) {
        throw new Error('Failed to update credential');
      }

      return result.credential as EdgeVaultCredential;
    } catch (error) {
      logger.error('Failed to update credential', error);
      throw new Error(
        `Failed to update credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a credential.
   * RLS policy ensures user can only delete their own credentials.
   */
  async deleteCredential(credentialId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('edge_vault_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete credential', error);
      throw new Error(`Failed to delete credential: ${error.message}`);
    }
  }

  /**
   * Validate a credential by testing the integration connection.
   * Uses Edge Function to decrypt, validate, and update status.
   * Updates the status and last_validated_at timestamp.
   *
   * @throws {Error} If credential not found or validation request fails
   */
  async validateCredential(credentialId: string, userId: string): Promise<boolean> {
    try {
      // Validate input
      if (!credentialId) {
        throw new Error('Credential ID is required');
      }

      // Verify ownership before validation
      const { data: credential, error: fetchError } = await supabase
        .from('edge_vault_credentials')
        .select('id, user_id')
        .eq('id', credentialId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !credential) {
        throw new Error('Credential not found or access denied');
      }

      // Use Edge Function to validate (handles decryption + integration testing)
      const result = await edgeFunctionService.validateCredential(credentialId);

      if (result.error) {
        logger.warn('Validation failed', { credentialId, error: result.error });
      }

      return result.valid;
    } catch (error) {
      logger.error('Failed to validate credential', error);
      throw new Error(
        `Failed to validate credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get credentials filtered by integration type.
   * RLS policy ensures user can only see their own credentials.
   *
   * @throws {Error} If database query fails
   */
  async getCredentialsByType(
    userId: string,
    integrationType: IntegrationType
  ): Promise<EdgeVaultCredential[]> {
    try {
      const { data, error } = await supabase
        .from('edge_vault_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_type', integrationType)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch credentials by type', error);
      throw new Error(
        `Failed to fetch credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get decrypted credentials for a specific credential ID.
   * This is used when you need to actually use the credentials (e.g., for API calls).
   * Automatically handles legacy base64 migration.
   *
   * WARNING: Only call this when you actually need the plaintext credentials.
   * All other operations should use the credential ID reference.
   *
   * @throws {Error} If credential not found, access denied, or decryption fails
   */
  async getDecryptedCredentials(
    credentialId: string,
    userId: string
  ): Promise<Record<string, unknown>> {
    return this.decryptCredential(credentialId, userId);
  }

  /**
   * Bulk migration utility: Re-encrypt all legacy base64 credentials for a user.
   * This is an admin utility for proactive migration.
   *
   * @returns Number of credentials migrated
   * @throws {Error} If migration fails
   */
  async migrateAllLegacyCredentials(userId: string): Promise<number> {
    try {
      logger.info('Starting bulk migration for user', { userId });

      const credentials = await this.getCredentials(userId);
      let migratedCount = 0;

      for (const credential of credentials) {
        if (this.isLegacyBase64(credential.encrypted_credentials)) {
          try {
            await this.migrateLegacyCredential(
              credential.id,
              userId,
              credential.encrypted_credentials
            );
            migratedCount++;
          } catch (error) {
            logger.error('Failed to migrate credential during bulk migration', error, {
              credentialId: credential.id,
            });
            // Continue with other credentials
          }
        }
      }

      logger.info('Bulk migration completed', { userId, migratedCount });
      return migratedCount;
    } catch (error) {
      logger.error('Bulk migration failed', error);
      throw new Error(
        `Failed to migrate credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Singleton instance of EdgeVaultService.
 *
 * USAGE EXAMPLES:
 * ===============
 *
 * 1. Create a new credential:
 *    ```typescript
 *    const credential = await edgeVaultService.createCredential({
 *      integration_type: 'slack',
 *      label: 'My Workspace',
 *      credentials: { token: 'xoxb-...' }
 *    }, userId);
 *    ```
 *
 * 2. Get all credentials:
 *    ```typescript
 *    const credentials = await edgeVaultService.getCredentials(userId);
 *    ```
 *
 * 3. Decrypt credentials when needed:
 *    ```typescript
 *    const decrypted = await edgeVaultService.getDecryptedCredentials(credentialId, userId);
 *    const apiKey = decrypted.api_key as string;
 *    ```
 *
 * 4. Validate a credential:
 *    ```typescript
 *    const isValid = await edgeVaultService.validateCredential(credentialId, userId);
 *    ```
 *
 * 5. Update a credential:
 *    ```typescript
 *    await edgeVaultService.updateCredential(credentialId, userId, {
 *      label: 'New Label',
 *      credentials: { token: 'new-token' }
 *    });
 *    ```
 *
 * SECURITY NOTES:
 * ===============
 * - Never log or store decrypted credentials
 * - Always use credential IDs in URLs and state management
 * - The encryption key (EDGE_VAULT_ENCRYPTION_KEY) must be 32 bytes (256 bits)
 * - Edge Function automatically rotates IV for each encryption operation
 * - GCM mode provides authenticated encryption (integrity + confidentiality)
 * - Legacy base64 credentials are automatically migrated on first access
 */
export const edgeVaultService = new EdgeVaultService();
