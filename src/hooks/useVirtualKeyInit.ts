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

  useEffect(() => {
    const initializeKey = async () => {
      // Check if key already exists in localStorage
      const existingKey = localStorage.getItem('oneai_api_key');
      if (existingKey) {
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

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch employee keys');
        }

        // Extract keys from response
        const keys = data?.keys || data?.data || (Array.isArray(data) ? data : []);

        if (keys.length > 0) {
          // Get the first active key
          const activeKey = keys.find((k: any) => !k.disabled) || keys[0];
          
          // Extract the key value
          const keyValue = activeKey.masked_key || activeKey.key || activeKey.token || activeKey.key_hash;
          
          if (keyValue) {
            localStorage.setItem('oneai_api_key', keyValue);
            console.log('Virtual API key auto-initialized from employee_keys');
            setInitialized(true);
          }
        }
      } catch (err) {
        console.error('Failed to auto-initialize virtual key:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize API key');
      } finally {
        setLoading(false);
      }
    };

    initializeKey();
  }, [userEmail]);

  return { initialized, loading, error };
}
