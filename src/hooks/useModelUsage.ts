import { useEffect, useState, useMemo } from 'react';
import supabaseClient from '@/services/supabaseClient';
import { logger } from '@/lib/logger';

interface ModelUsage {
  model: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  lastUsed: string | null;
}

interface UseModelUsageResult {
  usage: ModelUsage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useModelUsage(email: string | null | undefined): UseModelUsageResult {
  const [usage, setUsage] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!email || !supabaseClient) {
      setUsage([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch usage data grouped by model
      const { data, error: fetchError } = await supabaseClient
        .from('usage')
        .select('model, tokens_in, tokens_out, cost_usd, latency_ms, status, ts')
        .eq('email', email)
        .order('ts', { ascending: false });

      if (fetchError) {
        logger.warn('Error fetching model usage', { error: fetchError.message });
        setError(fetchError.message);
        setUsage([]);
        return;
      }

      // Group and aggregate by model
      const modelMap = new Map<string, {
        requests: number;
        tokens: number;
        cost: number;
        latencies: number[];
        successes: number;
        lastUsed: string | null;
      }>();

      (data || []).forEach((item) => {
        if (!item.model) return;

        const existing = modelMap.get(item.model) || {
          requests: 0,
          tokens: 0,
          cost: 0,
          latencies: [],
          successes: 0,
          lastUsed: null,
        };

        existing.requests += 1;
        existing.tokens += (item.tokens_in || 0) + (item.tokens_out || 0);
        existing.cost += item.cost_usd || 0;
        if (item.latency_ms) existing.latencies.push(item.latency_ms);
        if (item.status === 'success') existing.successes += 1;
        if (!existing.lastUsed && item.ts) {
          existing.lastUsed = item.ts;
        }

        modelMap.set(item.model, existing);
      });

      // Convert to array with calculated metrics
      const usageData: ModelUsage[] = Array.from(modelMap.entries()).map(([model, stats]) => ({
        model,
        totalRequests: stats.requests,
        totalTokens: stats.tokens,
        totalCost: Math.round(stats.cost * 1000) / 1000,
        avgLatency: stats.latencies.length > 0
          ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
          : 0,
        successRate: stats.requests > 0
          ? Math.round((stats.successes / stats.requests) * 100)
          : 100,
        lastUsed: stats.lastUsed,
      }));

      // Sort by total requests descending
      usageData.sort((a, b) => b.totalRequests - a.totalRequests);

      setUsage(usageData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch model usage';
      setError(message);
      logger.error('Error fetching model usage', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [email]);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}
