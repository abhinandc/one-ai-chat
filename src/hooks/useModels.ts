import { useState, useEffect } from 'react';
import supabaseClient from '@/services/supabaseClient';

export interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  api_path?: string;
}

export interface UseModelsResult {
  models: Model[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModels(userEmail?: string): UseModelsResult {
  // Check localStorage synchronously for instant load
  const cachedModels = (() => {
    try {
      const allCredsStr = typeof window !== 'undefined' ? localStorage.getItem('oneai_all_credentials') : null;
      if (allCredsStr) {
        const allCreds = JSON.parse(allCredsStr);
        if (Array.isArray(allCreds) && allCreds.length > 0) {
          return allCreds.map<Model>((cred: any) => ({
            id: cred.model_key,
            object: 'model',
            created: Date.now() / 1000,
            owned_by: cred.provider || 'unknown',
            api_path: cred.api_path,
          }));
        }
      }
    } catch {
      // Silently fail
    }
    return [];
  })();

  const [models, setModels] = useState<Model[]>(cachedModels);
  const [loading, setLoading] = useState(cachedModels.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get models from localStorage (set by useVirtualKeyInit)
      const allCredsStr = localStorage.getItem('oneai_all_credentials');
      if (allCredsStr) {
        try {
          const allCreds = JSON.parse(allCredsStr);
          if (Array.isArray(allCreds) && allCreds.length > 0) {
            const transformedModels = allCreds.map<Model>((cred: any) => ({
              id: cred.model_key,
              object: 'model',
              created: Date.now() / 1000,
              owned_by: cred.provider || 'unknown',
              // Use the api_path from stored credentials - NOT hardcoded
              api_path: cred.api_path,
            }));
            setModels(transformedModels);
            setLoading(false);
            return;
          }
        } catch {
          // Silently continue to fallback
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

      if (fetchError) {
        throw new Error(fetchError.message || 'Edge function error');
      }

      // Extract models from the employee_keys response
      let modelsList: string[] = [];

      // Prefer credentials array which has decrypted keys
      if (data?.credentials && Array.isArray(data.credentials)) {
        modelsList = data.credentials.map((c: any) => c.model_key).filter(Boolean);
      } else if (data?.all_models && Array.isArray(data.all_models)) {
        modelsList = data.all_models.map((m: any) => m.name || m.id).filter(Boolean);
      } else if (data?.keys && Array.isArray(data.keys)) {
        data.keys.forEach((key: any) => {
          const keyModels = key.models || key.models_json || [];
          keyModels.forEach((m: any) => {
            const modelName = typeof m === 'string' ? m : (m.name || m.id);
            if (modelName) modelsList.push(modelName);
          });
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
      // Silently fail - don't expose errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch models when we have a userEmail and no models loaded yet
    if (userEmail && models.length === 0) {
      fetchModels();
    }
  }, [userEmail, models.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also check localStorage periodically in case credentials were loaded by another hook
  useEffect(() => {
    if (models.length > 0 || !userEmail) return;

    // Check if localStorage now has credentials (set by useVirtualKeyInit)
    const checkStorage = () => {
      const allCredsStr = localStorage.getItem('oneai_all_credentials');
      if (allCredsStr) {
        try {
          const allCreds = JSON.parse(allCredsStr);
          if (Array.isArray(allCreds) && allCreds.length > 0) {
            const transformedModels = allCreds.map<Model>((cred: any) => ({
              id: cred.model_key,
              object: 'model',
              created: Date.now() / 1000,
              owned_by: cred.provider || 'unknown',
              api_path: cred.api_path,
            }));
            setModels(transformedModels);
            setLoading(false);
          }
        } catch {
          // Silently continue
        }
      }
    };

    // Check immediately and after a short delay (in case credentials are being loaded)
    checkStorage();
    const timeout = setTimeout(checkStorage, 500);
    return () => clearTimeout(timeout);
  }, [userEmail, models.length]);

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
