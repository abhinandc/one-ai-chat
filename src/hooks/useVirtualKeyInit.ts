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

        // Extract keys from response
        const keys = data?.keys || data?.data || (Array.isArray(data) ? data : []);
        setKeyData(keys);

        if (keys.length > 0) {
          // Get the first active key
          const activeKey = keys.find((k: any) => !k.disabled) || keys[0];
          
          // Try to get the actual API key - check multiple fields
          // Priority: key > token > api_key > virtual_key
          const keyValue = activeKey.key || activeKey.token || activeKey.api_key || activeKey.virtual_key;
          
          if (keyValue && keyValue.length > 20 && !keyValue.includes('***')) {
            localStorage.setItem('oneai_api_key', keyValue);
            console.log('Virtual API key auto-initialized from employee_keys');
            setInitialized(true);
          } else {
            // If no valid key in response, check if there's a stored user-provided key
            console.warn('No valid API key in employee_keys response. Keys returned:', 
              keys.map((k: any) => ({ 
                hasKey: !!k.key, 
                hasToken: !!k.token,
                hasMasked: !!k.masked_key,
                label: k.label || k.key_alias 
              }))
            );
            setError('No valid API key found. Please set your key in ModelsHub.');
          }
        } else {
          setError('No API keys assigned to your account');
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

  return { initialized, loading, error, keyData };
}
