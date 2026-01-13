import { useState, useEffect, useCallback } from 'react';
import {
  edgeVaultService,
  EdgeVaultCredential,
  CreateCredentialInput,
  IntegrationType,
} from '@/services/edgeVaultService';

export interface UseEdgeVaultResult {
  credentials: EdgeVaultCredential[];
  loading: boolean;
  error: string | null;
  createCredential: (input: CreateCredentialInput) => Promise<EdgeVaultCredential>;
  updateCredential: (
    credentialId: string,
    updates: Partial<CreateCredentialInput>
  ) => Promise<EdgeVaultCredential>;
  deleteCredential: (credentialId: string) => Promise<void>;
  validateCredential: (credentialId: string) => Promise<boolean>;
  getCredentialsByType: (integrationType: IntegrationType) => EdgeVaultCredential[];
  refetch: () => Promise<void>;
}

export function useEdgeVault(userId?: string): UseEdgeVaultResult {
  const [credentials, setCredentials] = useState<EdgeVaultCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    if (!userId) {
      setCredentials([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await edgeVaultService.getCredentials(userId);
      setCredentials(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch credentials';
      setError(errorMessage);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const createCredential = async (
    input: CreateCredentialInput
  ): Promise<EdgeVaultCredential> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const created = await edgeVaultService.createCredential(input, userId);
    await fetchCredentials();
    return created;
  };

  const updateCredential = async (
    credentialId: string,
    updates: Partial<CreateCredentialInput>
  ): Promise<EdgeVaultCredential> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updated = await edgeVaultService.updateCredential(
      credentialId,
      userId,
      updates
    );
    await fetchCredentials();
    return updated;
  };

  const deleteCredential = async (credentialId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await edgeVaultService.deleteCredential(credentialId, userId);
    await fetchCredentials();
  };

  const validateCredential = async (credentialId: string): Promise<boolean> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const isValid = await edgeVaultService.validateCredential(credentialId, userId);
    await fetchCredentials();
    return isValid;
  };

  const getCredentialsByType = (integrationType: IntegrationType): EdgeVaultCredential[] => {
    return credentials.filter((c) => c.integration_type === integrationType);
  };

  return {
    credentials,
    loading,
    error,
    createCredential,
    updateCredential,
    deleteCredential,
    validateCredential,
    getCredentialsByType,
    refetch: fetchCredentials,
  };
}
