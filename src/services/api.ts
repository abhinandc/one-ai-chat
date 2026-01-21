import { useEffect, useState } from 'react';

import apiClientInstance, {
  type Model as ApiModel,
  OneEdgeClient,
  parseSSEStream,
  type Agent,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ChatMessage,
  type ContentPart,
  type TextContentPart,
  type ImageContentPart,
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
  type ChatMessageAttachment,
  type ContentPart,
  type TextContentPart,
  type ImageContentPart,
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





