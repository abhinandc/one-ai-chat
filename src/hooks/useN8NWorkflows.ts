import { useState, useEffect, useCallback } from 'react';
import { n8nService, N8NWorkflow } from '@/services/n8nService';

interface UseN8NWorkflowsResult {
  workflows: N8NWorkflow[];
  loading: boolean;
  error: string | null;
  hasCredentials: boolean;
  refetch: () => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
}

export function useN8NWorkflows(): UseN8NWorkflowsResult {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    const hasCreds = n8nService.hasCredentials();
    setHasCredentials(hasCreds);
    
    if (!hasCreds) {
      setWorkflows([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await n8nService.getWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    try {
      if (active) {
        await n8nService.activateWorkflow(id);
      } else {
        await n8nService.deactivateWorkflow(id);
      }
      await fetchWorkflows();
    } catch (err) {
      throw err;
    }
  }, [fetchWorkflows]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    hasCredentials,
    refetch: fetchWorkflows,
    toggleActive,
  };
}
