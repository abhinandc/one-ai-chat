import { useEffect, useState } from 'react';
import supabaseClient from '@/services/supabaseClient';

import apiClientInstance, {
  type Model as ApiModel,
  OneEdgeClient,
  parseSSEStream,
  type Agent,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type GoogleUser,
} from '../lib/api';

// Re-export the low-level client primitives so UI code can import from a single module.
export {
  OneEdgeClient,
  parseSSEStream,
  type Agent,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type GoogleUser,
} from '../lib/api';

export interface ModelMetadata {
  provider?: string;
  description?: string;
  endpoint?: string;
  maxTokens?: number;
  raw?: Record<string, unknown> | null;
}

export type ModelWithMetadata = ApiModel & {
  metadata?: ModelMetadata;
};

export const apiClient = apiClientInstance;

export function useModels(userEmail?: string) {
  const [models, setModels] = useState<ModelWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    if (!supabaseClient) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    if (!userEmail) {
      setError('User email required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch models from employee_keys Edge Function (assigned by EdgeAdmin)
      const { data, error: fetchError } = await supabaseClient.functions.invoke('employee_keys', {
        body: { email: userEmail }
      });

      console.log('Employee Keys (useModels):', { data, error: fetchError });

      if (fetchError) {
        throw new Error(fetchError.message || 'Edge function error');
      }

      // Extract models from the employee_keys response
      // Response could be: { models: [...] } or { keys: [{ models: [...] }] } or { data: { models: [...] } }
      let modelsList: string[] = [];

      if (data?.models && Array.isArray(data.models)) {
        // Direct models array in response
        modelsList = data.models;
      } else if (data?.keys && Array.isArray(data.keys)) {
        // Models from keys array
        data.keys.forEach((key: any) => {
          const keyModels = key.models || key.models_json || [];
          modelsList.push(...keyModels);
        });
      } else if (Array.isArray(data)) {
        // Response is array of keys
        data.forEach((key: any) => {
          const keyModels = key.models || key.models_json || [];
          modelsList.push(...keyModels);
        });
      }

      // Dedupe models
      const uniqueModels = [...new Set(modelsList)];

      // Transform to the expected format
      const enriched = uniqueModels.map<ModelWithMetadata>((modelId: string) => ({
        id: modelId,
        object: 'model',
        created: Date.now() / 1000,
        owned_by: modelId.split('/')[0] || 'unknown',
        metadata: {
          provider: modelId.split('/')[0] || undefined,
        },
      }));

      setModels(enriched);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(message);
      setModels([]);
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchModels();
    }
  }, [userEmail]);

  return { models, loading, error, refetch: fetchModels };
}
export function useAgents(filters?: { env?: string; labels?: string; subject?: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAgents(filters);
      setAgents(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(message);
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const createAgent = async (agent: Partial<Agent>): Promise<Agent> => {
    const created = await apiClient.createAgent(agent);
    setAgents(prev => [created, ...prev]);
    return created;
  };

  const updateAgent = async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    const updated = await apiClient.updateAgent(id, agent);
    setAgents(prev => prev.map(item => (item.id === id ? updated : item)));
    return updated;
  };

  const deleteAgent = async (id: string): Promise<void> => {
    await apiClient.deleteAgent(id);
    setAgents(prev => prev.filter(item => item.id !== id));
  };

  const publishAgent = async (id: string, env: string, by: string): Promise<Agent> => {
    const published = await apiClient.publishAgent(id, env, by);
    setAgents(prev => prev.map(item => (item.id === id ? published : item)));
    return published;
  };

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    publishAgent,
  };
}

export default apiClient;





