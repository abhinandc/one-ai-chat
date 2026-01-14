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
    try {
      setLoading(true);

      // First try to get models from localStorage (set by useVirtualKeyInit)
      const allCredsStr = localStorage.getItem('oneai_all_credentials');
      if (allCredsStr) {
        const allCreds = JSON.parse(allCredsStr);
        if (Array.isArray(allCreds) && allCreds.length > 0) {
          const enriched = allCreds.map<ModelWithMetadata>((cred: any) => ({
            id: cred.model_key,
            object: 'model',
            created: Date.now() / 1000,
            owned_by: cred.provider || 'unknown',
            metadata: {
              provider: cred.provider,
              description: cred.model_key,
              endpoint: cred.full_endpoint,
              maxTokens: 4096,
              raw: cred,
            },
          }));
          setModels(enriched);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Fallback: fetch from edge function if not in localStorage
      if (!supabaseClient || !userEmail) {
        setError('Credentials not loaded yet');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabaseClient.functions.invoke('employee_keys', {
        body: { email: userEmail }
      });

      console.log('useModels - employee_keys response:', { data, error: fetchError });

      if (fetchError) {
        throw new Error(fetchError.message || 'Edge function error');
      }

      // Extract models from the employee_keys response
      const modelObjects: any[] = [];

      // First check credentials array (has full model info)
      if (data?.credentials && Array.isArray(data.credentials)) {
        data.credentials.forEach((cred: any) => {
          if (cred.model_key && !modelObjects.find(m => m.name === cred.model_key)) {
            modelObjects.push({
              id: cred.model_id || cred.model_key,
              name: cred.model_key,
              display_name: cred.model_name || cred.model_key,
              provider: cred.provider,
              kind: cred.kind || 'chat',
              mode: cred.mode || 'chat',
              endpoint: cred.full_endpoint,
              api_path: cred.api_path,
            });
          }
        });
      }

      // Then check keys array
      if (data?.keys && Array.isArray(data.keys)) {
        data.keys.forEach((key: any) => {
          const keyModels = key.models || [];
          keyModels.forEach((m: any) => {
            if (typeof m === 'object' && m.name) {
              if (!modelObjects.find(existing => existing.name === m.name)) {
                modelObjects.push(m);
              }
            } else if (typeof m === 'string') {
              if (!modelObjects.find(existing => existing.name === m)) {
                modelObjects.push({ id: m, name: m });
              }
            }
          });
        });
      }

      const enriched = modelObjects.map<ModelWithMetadata>((model: any) => ({
        id: model.name || model.id,
        object: 'model',
        created: Date.now() / 1000,
        owned_by: model.provider || 'unknown',
        metadata: {
          provider: model.provider,
          description: model.display_name,
          endpoint: model.endpoint || model.full_endpoint,
          maxTokens: model.max_tokens,
          raw: model,
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
    // Small delay to wait for useVirtualKeyInit to populate localStorage
    const timer = setTimeout(() => {
      fetchModels();
    }, 100);
    return () => clearTimeout(timer);
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





