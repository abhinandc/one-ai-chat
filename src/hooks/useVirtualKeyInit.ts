import { useEffect, useState } from 'react';
import supabase from '@/services/supabaseClient';

export interface StoredCredential {
  api_key: string;
  full_endpoint: string;
  model_key: string;
  provider: string;
  auth_type: string;
  auth_header: string;
}

const CREDENTIALS_STORAGE_KEY = 'oneai_credentials';
const API_KEY_STORAGE_KEY = 'oneai_api_key';

/**
 * Get stored credentials from localStorage
 */
export function getStoredCredentials(): StoredCredential | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredCredential;
    }
  } catch (error) {
    console.warn('Unable to read credentials from localStorage:', error);
  }
  return null;
}

/**
 * Hook to auto-initialize the virtual API key from employee_keys edge function.
 * This ensures the user's assigned API key is stored in localStorage for API calls.
 */
export function useVirtualKeyInit(userEmail?: string) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyData, setKeyData] = useState<any>(null);

  useEffect(() => {
    const initializeKey = async () => {
      // Check if credentials already exist in localStorage
      const existingCredentials = getStoredCredentials();
      if (existingCredentials?.api_key && existingCredentials.api_key.length > 20) {
        setInitialized(true);
        setLoading(false);
        return;
      }

      if (!supabase || !userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call the employee_keys Edge Function to get user's assigned keys
        const { data, error: fetchError } = await supabase.functions.invoke('employee_keys', {
          body: { email: userEmail }
        });

        console.log('useVirtualKeyInit - employee_keys response:', JSON.stringify(data, null, 2));

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch employee keys');
        }

        setKeyData(data);

        // Priority 1: Check for credentials array (new response format with decrypted keys)
        // Response format: { valid: true, credentials: [{ api_key, full_endpoint, model_key, ... }] }
        console.log('Checking credentials:', { 
          hasCredentials: !!data?.credentials, 
          hasKeys: !!data?.keys,
          keysLength: data?.keys?.length,
          firstKey: data?.keys?.[0] ? { 
            hasApiKey: !!data.keys[0].api_key,
            hasMaskedKey: !!data.keys[0].masked_key,
            label: data.keys[0].label
          } : null
        });
        
        if (data?.credentials && Array.isArray(data.credentials) && data.credentials.length > 0) {
          const cred = data.credentials[0];
          
          if (cred.api_key && cred.api_key.length > 20 && !cred.api_key.includes('***') && !cred.api_key.includes('...')) {
            // Store full credential info for dynamic endpoint usage
            const storedCred: StoredCredential = {
              api_key: cred.api_key,
              full_endpoint: cred.full_endpoint || `${cred.endpoint_url}${cred.api_path}`,
              model_key: cred.model_key || cred.model_name,
              provider: cred.provider,
              auth_type: cred.auth_type || 'bearer',
              auth_header: cred.auth_header || 'Authorization',
            };
            
            localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(storedCred));
            localStorage.setItem(API_KEY_STORAGE_KEY, cred.api_key);
            
            console.log('Credentials auto-initialized from credentials array:', { 
              endpoint: storedCred.full_endpoint, 
              model: storedCred.model_key,
              provider: storedCred.provider 
            });
            setInitialized(true);
            return;
          }
        }

        // Priority 2: Check for keys array (current response format)
        // Response format: { keys: [{ api_key, models: [...], ... }] }
        if (data?.keys && Array.isArray(data.keys) && data.keys.length > 0) {
          const key = data.keys.find((k: any) => !k.disabled) || data.keys[0];
          
          // Check if the key has an actual api_key (not masked)
          const apiKey = key.api_key || key.key || key.token;
          
          if (apiKey && apiKey.length > 20 && !apiKey.includes('***') && !apiKey.includes('...')) {
            // Get the first model's endpoint info
            const firstModel = key.models?.[0];
            const endpoint = firstModel 
              ? `https://api.openai.com${firstModel.api_path || '/v1/chat/completions'}`
              : 'https://api.openai.com/v1/chat/completions';
            
            const storedCred: StoredCredential = {
              api_key: apiKey,
              full_endpoint: endpoint,
              model_key: firstModel?.name || 'gpt-4',
              provider: firstModel?.provider || 'openai',
              auth_type: 'bearer',
              auth_header: 'Authorization',
            };
            
            localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(storedCred));
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
            
            console.log('Credentials auto-initialized from keys array:', storedCred);
            setInitialized(true);
            return;
          } else {
            console.warn('Key found but no decrypted api_key. Your edge function needs to return the decrypted key, not masked_key.');
          }
        }

        // No valid credentials found
        console.warn('No valid credentials in employee_keys response. The edge function must return decrypted api_key, not masked_key.');
        setError('Edge function returns masked key only. Update employee_keys to return decrypted api_key.');
      } catch (err) {
        console.error('Failed to auto-initialize credentials:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize credentials');
      } finally {
        setLoading(false);
      }
    };

    initializeKey();
  }, [userEmail]);

  return { initialized, loading, error, keyData };
}
