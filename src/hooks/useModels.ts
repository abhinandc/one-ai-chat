import { useState, useEffect } from 'react';
import supabaseClient from '@/services/supabaseClient';

export interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export interface UseModelsResult {
  models: Model[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModels(userEmail?: string): UseModelsResult {
  const [models, setModels] = useState<Model[]>([]);
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
      setError(null);

      // Fetch models from employee_keys Edge Function (assigned by EdgeAdmin)
      const { data, error: fetchError } = await supabaseClient.functions.invoke('employee_keys', {
        body: { email: userEmail }
      });

      console.log('Employee Keys (useModels hook):', { data, error: fetchError });

      if (fetchError) {
        throw new Error(fetchError.message || 'Edge function error');
      }

      // Extract models from the employee_keys response
      let modelsList: string[] = [];

      if (data?.models && Array.isArray(data.models)) {
        modelsList = data.models;
      } else if (data?.keys && Array.isArray(data.keys)) {
        data.keys.forEach((key: any) => {
          const keyModels = key.models || key.models_json || [];
          modelsList.push(...keyModels);
        });
      } else if (Array.isArray(data)) {
        data.forEach((key: any) => {
          const keyModels = key.models || key.models_json || [];
          modelsList.push(...keyModels);
        });
      }

      // Dedupe models
      const uniqueModels = [...new Set(modelsList)];

      // Transform to Model format
      const transformedModels = uniqueModels.map<Model>((modelId: string) => ({
        id: modelId,
        object: 'model',
        created: Date.now() / 1000,
        owned_by: modelId.split('/')[0] || 'unknown',
      }));

      setModels(transformedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
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
