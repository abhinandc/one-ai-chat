import { useState, useEffect } from 'react';
import apiClient, { Model } from '../lib/api';

export interface UseModelsResult {
  models: Model[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModels(): UseModelsResult {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getModels();
      setModels(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
}

// Transform API models to UI format
export function transformModelForUI(apiModel: Model) {
  return {
    id: apiModel.id,
    name: apiModel.id,
    provider: apiModel.owned_by || 'Unknown',
    description: `Model: ${apiModel.id}`,
    tags: ['llm'],
    stars: 0,
    downloads: 'N/A',
    size: 'Unknown',
    type: 'text' as const,
    pricing: 'free' as const,
    featured: false,
  };
}
