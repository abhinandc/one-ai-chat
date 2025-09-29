import { useState, useEffect } from 'react';
import supabaseClient from '@/services/supabaseClient';

export interface VirtualKey {
  id: string;
  key_hash: string;
  label: string;
  email: string;
  team_id?: string;
  models_json: string[];
  budget_usd: number;
  expires_at?: string;
  rpm: number;
  rpd: number;
  tpm: number;
  tpd: number;
  created_at: string;
  disabled: boolean;
  tags_json: string[];
  masked_key?: string;
  admin_virtual_key_id?: string;
}

export function useVirtualKeys(userEmail?: string) {
  const [virtualKeys, setVirtualKeys] = useState<VirtualKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVirtualKeys = async () => {
    if (!userEmail) {
      setVirtualKeys([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        ?.from('virtual_keys')
        .select('*')
        .eq('email', userEmail)
        .eq('disabled', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVirtualKeys(data || []);
    } catch (err) {
      console.error('Failed to fetch virtual keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch virtual keys');
      setVirtualKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualKeys();
  }, [userEmail]);

  return {
    virtualKeys,
    loading,
    error,
    refetch: fetchVirtualKeys
  };
}
