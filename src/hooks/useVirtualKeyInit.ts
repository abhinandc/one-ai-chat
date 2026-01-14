import { useEffect, useState } from 'react';
import supabase from '@/services/supabaseClient';

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
      // Check if key already exists in localStorage
      const existingKey = localStorage.getItem('oneai_api_key');
      if (existingKey && existingKey.length > 20 && !existingKey.includes('***')) {
        // Valid key already exists
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

        console.log('useVirtualKeyInit - employee_keys response:', data);

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch employee keys');
        }

        setKeyData(data);

        // Priority 1: Check for credentials array (new response format)
        // Response format: { valid: true, credentials: [{ api_key: "sk-..." }] }
        if (data?.credentials && Array.isArray(data.credentials) && data.credentials.length > 0) {
          const firstCredential = data.credentials[0];
          const apiKey = firstCredential.api_key;
          
          if (apiKey && apiKey.length > 20 && !apiKey.includes('***')) {
            localStorage.setItem('oneai_api_key', apiKey);
            console.log('Virtual API key auto-initialized from credentials');
            setInitialized(true);
            return;
          }
        }

        // Priority 2: Check for keys array (legacy format)
        const keys = data?.keys || data?.data || (Array.isArray(data) ? data : []);

        if (keys.length > 0) {
          const activeKey = keys.find((k: any) => !k.disabled) || keys[0];
          const keyValue = activeKey.key || activeKey.token || activeKey.api_key || activeKey.virtual_key;
          
          if (keyValue && keyValue.length > 20 && !keyValue.includes('***')) {
            localStorage.setItem('oneai_api_key', keyValue);
            console.log('Virtual API key auto-initialized from keys array');
            setInitialized(true);
            return;
          }
        }

        // No valid key found
        console.warn('No valid API key in employee_keys response:', data);
        setError('No valid API key found. Please set your key in ModelsHub.');
      } catch (err) {
        console.error('Failed to auto-initialize virtual key:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize API key');
      } finally {
        setLoading(false);
      }
    };

    initializeKey();
  }, [userEmail]);

  return { initialized, loading, error, keyData };
}
