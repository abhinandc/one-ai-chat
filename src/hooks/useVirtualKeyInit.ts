import { useEffect, useState } from 'react';
import supabase from '@/services/supabaseClient';

export interface StoredCredential {
  api_key: string;
  full_endpoint: string;
  api_path: string;
  model_key: string;
  provider: string;
  auth_type: string;
  auth_header: string;
}

const CREDENTIALS_STORAGE_KEY = 'oneai_credentials';
const ALL_CREDENTIALS_KEY = 'oneai_all_credentials';
const API_KEY_STORAGE_KEY = 'oneai_api_key';

/**
 * Get stored credentials from localStorage (default/first credential)
 */
export function getStoredCredentials(): StoredCredential | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredCredential;
    }
  } catch {
    // Silently fail - don't expose errors
  }
  return null;
}

/**
 * Get all stored credentials (for multi-model support)
 */
export function getAllStoredCredentials(): StoredCredential[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ALL_CREDENTIALS_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredCredential[];
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Get credential for a specific model
 */
export function getCredentialForModel(modelName: string): StoredCredential | null {
  const allCreds = getAllStoredCredentials();
  return allCreds.find(c => c.model_key === modelName) || getStoredCredentials();
}

/**
 * Hook to auto-initialize the virtual API key from employee_keys edge function.
 */
export function useVirtualKeyInit(userEmail?: string, forceRefresh?: boolean) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyData, setKeyData] = useState<{ success?: boolean; credentialsCount?: number } | null>(null);

  const fetchCredentials = async (bypassCache = false) => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    // Check if credentials already exist in localStorage for this user
    const existingCredentials = getStoredCredentials();
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('oneai_credentials_email') : null;
    
    // Only use cached credentials if they match current user, are valid, and we're not forcing refresh
    if (!bypassCache && 
        existingCredentials?.api_key && 
        existingCredentials.api_key.length > 20 && 
        storedEmail === userEmail) {
      setInitialized(true);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('employee_keys', {
        body: { email: userEmail }
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch employee keys');
      }

      setKeyData({ success: data?.success, credentialsCount: data?.credentials?.length || 0 });

      // Check for credentials array
      if (data?.credentials && Array.isArray(data.credentials) && data.credentials.length > 0) {
        const allCreds: StoredCredential[] = data.credentials
          .filter((cred: any) => cred.api_key && cred.api_key.length > 20 && !cred.api_key.includes('***'))
          .map((cred: any) => ({
            api_key: cred.api_key,
            full_endpoint: cred.full_endpoint || `${cred.endpoint_url}${cred.api_path || '/v1/chat/completions'}`,
            api_path: cred.api_path || '/v1/chat/completions',
            model_key: cred.model_key || cred.model_name,
            provider: cred.provider,
            auth_type: cred.auth_type || 'bearer',
            auth_header: cred.auth_header || 'Authorization',
          }));

        if (allCreds.length > 0) {
          localStorage.setItem(ALL_CREDENTIALS_KEY, JSON.stringify(allCreds));
          const defaultCred = allCreds[0];
          localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(defaultCred));
          localStorage.setItem(API_KEY_STORAGE_KEY, defaultCred.api_key);
          localStorage.setItem('oneai_credentials_email', userEmail);
          setInitialized(true);
          setLoading(false);
          return;
        }
      }

      // Fallback: Check keys array
      if (data?.keys && Array.isArray(data.keys) && data.keys.length > 0) {
        const key = data.keys.find((k: any) => !k.disabled) || data.keys[0];
        const apiKey = key.api_key || key.key || key.token;
        
        if (apiKey && apiKey.length > 20 && !apiKey.includes('***')) {
          const firstModel = key.models?.[0];
          const endpoint = firstModel 
            ? `${firstModel.endpoint_url || 'https://api.openai.com'}${firstModel.api_path || '/v1/chat/completions'}`
            : 'https://api.openai.com/v1/chat/completions';
          
          const storedCred: StoredCredential = {
            api_key: apiKey,
            full_endpoint: endpoint,
            api_path: firstModel?.api_path || '/v1/chat/completions',
            model_key: firstModel?.name || 'gpt-4',
            provider: firstModel?.provider || 'openai',
            auth_type: 'bearer',
            auth_header: 'Authorization',
          };
          
          localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(storedCred));
          localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
          localStorage.setItem('oneai_credentials_email', userEmail);
          setInitialized(true);
          setLoading(false);
          return;
        }
      }

      setError('No valid API credentials found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials(forceRefresh);
  }, [userEmail, forceRefresh]);

  // Function to clear cache and refetch
  const refreshCredentials = async () => {
    // Clear localStorage cache
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    localStorage.removeItem(ALL_CREDENTIALS_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem('oneai_credentials_email');
    
    await fetchCredentials(true);
  };

  return { initialized, loading, error, keyData, refreshCredentials };
}

/**
 * Clear all cached credentials (useful when switching users or keys)
 */
export function clearCredentialsCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  localStorage.removeItem(ALL_CREDENTIALS_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem('oneai_credentials_email');
}
