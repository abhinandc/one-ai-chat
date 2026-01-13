import { useEffect, useState, useMemo } from 'react';
import supabaseClient from '@/services/supabaseClient';
import { logger } from '@/lib/logger';

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface DashboardMetrics {
  today: {
    messages: number;
    tokens: number;
    cost: number;
    activeTime: number; // minutes
  };
  thisWeek: {
    conversations: number;
    modelsUsed: string[];
    topModel: string | null;
    totalRequests: number;
  };
  trends: {
    daily: DailyUsage[];
    weeklyChange: number; // percentage change from last week
  };
  budget: {
    used: number;
    total: number | null;
    percentage: number;
  };
}

interface UseDashboardMetricsResult {
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultMetrics: DashboardMetrics = {
  today: {
    messages: 0,
    tokens: 0,
    cost: 0,
    activeTime: 0,
  },
  thisWeek: {
    conversations: 0,
    modelsUsed: [],
    topModel: null,
    totalRequests: 0,
  },
  trends: {
    daily: [],
    weeklyChange: 0,
  },
  budget: {
    used: 0,
    total: null,
    percentage: 0,
  },
};

export function useDashboardMetrics(email: string | null | undefined): UseDashboardMetricsResult {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!email || !supabaseClient) {
      setMetrics(defaultMetrics);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const startOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).toISOString();

      // Fetch today's usage
      const { data: todayUsage, error: todayError } = await supabaseClient
        .from('usage')
        .select('tokens_in, tokens_out, cost_usd')
        .eq('email', email)
        .gte('ts', startOfToday);

      if (todayError) {
        logger.warn('Error fetching today usage', { error: todayError.message });
      }

      // Fetch this week's conversations
      const { data: weekConversations, error: convError } = await supabaseClient
        .from('conversations')
        .select('id, updated_at')
        .eq('user_email', email)
        .gte('updated_at', startOfWeek);

      if (convError) {
        logger.warn('Error fetching conversations', { error: convError.message });
      }

      // Fetch this week's usage with model info
      const { data: weekUsage, error: weekError } = await supabaseClient
        .from('usage')
        .select('model, tokens_in, tokens_out, cost_usd, ts')
        .eq('email', email)
        .gte('ts', startOfWeek);

      if (weekError) {
        logger.warn('Error fetching week usage', { error: weekError.message });
      }

      // Fetch last week's usage for comparison
      const { data: lastWeekUsage, error: lastWeekError } = await supabaseClient
        .from('usage')
        .select('tokens_in, tokens_out, cost_usd')
        .eq('email', email)
        .gte('ts', startOfLastWeek)
        .lt('ts', startOfWeek);

      if (lastWeekError) {
        logger.warn('Error fetching last week usage', { error: lastWeekError.message });
      }

      // Fetch virtual keys for budget info
      const { data: virtualKeys, error: keysError } = await supabaseClient
        .from('virtual_keys')
        .select('budget_usd')
        .eq('email', email)
        .eq('disabled', false);

      if (keysError) {
        logger.warn('Error fetching virtual keys', { error: keysError.message });
      }

      // Process data
      const todayData = todayUsage || [];
      const todayTokens = todayData.reduce((sum, item) => sum + ((item.tokens_in || 0) + (item.tokens_out || 0)), 0);
      const todayCost = todayData.reduce((sum, item) => sum + (item.cost_usd || 0), 0);

      const weekData = weekUsage || [];
      const weekModels = [...new Set(weekData.map(item => item.model).filter(Boolean))];
      const modelCounts: Record<string, number> = {};
      weekData.forEach(item => {
        if (item.model) {
          modelCounts[item.model] = (modelCounts[item.model] || 0) + 1;
        }
      });
      const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Calculate daily trends for the past 7 days
      const dailyMap = new Map<string, DailyUsage>();
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { date: dateStr, requests: 0, tokens: 0, cost: 0 });
      }

      weekData.forEach(item => {
        const dateStr = item.ts?.split('T')[0];
        if (dateStr && dailyMap.has(dateStr)) {
          const existing = dailyMap.get(dateStr)!;
          existing.requests += 1;
          existing.tokens += (item.tokens_in || 0) + (item.tokens_out || 0);
          existing.cost += item.cost_usd || 0;
        }
      });

      const dailyTrends = Array.from(dailyMap.values()).reverse();

      // Calculate weekly change
      const thisWeekTotal = weekData.length;
      const lastWeekTotal = (lastWeekUsage || []).length;
      const weeklyChange = lastWeekTotal > 0
        ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
        : thisWeekTotal > 0 ? 100 : 0;

      // Calculate budget
      const totalBudget = (virtualKeys || []).reduce((sum, key) => {
        return sum + (key.budget_usd || 0);
      }, 0);

      const totalUsedCost = weekData.reduce((sum, item) => sum + (item.cost_usd || 0), 0);
      const budgetPercentage = totalBudget > 0
        ? Math.min(100, Math.round((totalUsedCost / totalBudget) * 100))
        : 0;

      setMetrics({
        today: {
          messages: todayData.length,
          tokens: todayTokens,
          cost: Math.round(todayCost * 1000) / 1000,
          activeTime: Math.round(todayData.length * 2), // Estimate 2 min per message
        },
        thisWeek: {
          conversations: (weekConversations || []).length,
          modelsUsed: weekModels,
          topModel,
          totalRequests: weekData.length,
        },
        trends: {
          daily: dailyTrends,
          weeklyChange,
        },
        budget: {
          used: Math.round(totalUsedCost * 1000) / 1000,
          total: totalBudget > 0 ? totalBudget : null,
          percentage: budgetPercentage,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(message);
      logger.error('Error fetching dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [email]);

  // Generate sparkline data from daily trends
  const sparklineData = useMemo(() => ({
    requests: metrics.trends.daily.map(d => d.requests),
    tokens: metrics.trends.daily.map(d => d.tokens),
    cost: metrics.trends.daily.map(d => d.cost),
  }), [metrics.trends.daily]);

  return {
    metrics: {
      ...metrics,
      trends: {
        ...metrics.trends,
        sparklineData,
      },
    } as DashboardMetrics & { trends: DashboardMetrics['trends'] & { sparklineData: typeof sparklineData } },
    loading,
    error,
    refetch: fetchMetrics,
  };
}
