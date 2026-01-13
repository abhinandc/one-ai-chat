import supabaseClient from './supabaseClient';
import { logger } from '@/lib/logger';

export interface UsageMetrics {
  user_email: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  requests_today: number;
  tokens_today: number;
  cost_today: number;
  top_models: Array<{
    model: string;
    requests: number;
    tokens: number;
  }>;
  daily_usage: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export interface ActivityEvent {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: any;
  timestamp: string;
}

class AnalyticsService {
  async getUsageMetrics(userEmail: string): Promise<UsageMetrics> {
    try {
      const { data, error } = await supabaseClient.rpc('get_user_usage_metrics', {
        p_user_email: userEmail
      });

      if (error) throw error;
      return data || {
        user_email: userEmail,
        total_requests: 0,
        total_tokens: 0,
        total_cost: 0,
        requests_today: 0,
        tokens_today: 0,
        cost_today: 0,
        top_models: [],
        daily_usage: []
      };
    } catch (error) {
      logger.error('Failed to fetch usage metrics', error);
      return {
        user_email: userEmail,
        total_requests: 0,
        total_tokens: 0,
        total_cost: 0,
        requests_today: 0,
        tokens_today: 0,
        cost_today: 0,
        top_models: [],
        daily_usage: []
      };
    }
  }

  async trackEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('activity_events')
        .insert({
          ...event,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to track event', error);
    }
  }

  async getActivityFeed(userEmail: string, limit: number = 10): Promise<ActivityEvent[]> {
    const { data, error } = await supabaseClient
      .from('activity_events')
      .select('*')
      .eq('user_email', userEmail)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async recordAPICall(userEmail: string, model: string, tokens: number, cost: number): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('api_usage_logs')
        .insert({
          user_email: userEmail,
          model,
          tokens_used: tokens,
          cost_usd: cost,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to record API call', error);
    }
  }

  async getDashboardStats(userEmail: string) {
    try {
      const { data, error } = await supabaseClient.rpc('get_dashboard_stats', {
        p_user_email: userEmail
      });

      if (error) throw error;
      return data || {
        total_conversations: 0,
        total_automations: 0,
        total_prompts: 0,
        total_agents: 0,
        requests_today: 0,
        cost_today: 0
      };
    } catch (error) {
      logger.error('Failed to fetch dashboard stats', error);
      return {
        total_conversations: 0,
        total_automations: 0,
        total_prompts: 0,
        total_agents: 0,
        requests_today: 0,
        cost_today: 0
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
