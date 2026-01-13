import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase';
import type { VirtualKey as VirtualKeyType, Usage } from '@/integrations/supabase';

interface BaseState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const buildInitial = <T,>(fallback: T): BaseState<T> => ({
  data: fallback,
  loading: true,
  error: null,
});

export interface Guardrail {
  id: string;
  name: string;
  enabled: boolean;
  action?: string;
  patterns?: string[];
  config: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PassThroughEndpoint {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  headers: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsageSummary {
  totalRequests: number;
  totalCost: number;
}

export interface VirtualKey {
  id: string;
  label: string;
  email: string;
  models: string[];
  models_json: string[];
  budget_usd: number | null;
  expiresAt?: string | null;
  expires_at?: string | null;
  disabled: boolean;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  email: string;
  action: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Hook to fetch guardrails (EdgeAdmin feature).
 * Note: This table may not exist in all deployments.
 */
export const useGuardrails = () => {
  const [state, setState] = useState<BaseState<Guardrail[]>>(buildInitial<Guardrail[]>([]));

  useEffect(() => {
    supabase
      .from('guardrails')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          // Table may not exist - don't treat as error
          setState({ data: [], loading: false, error: null });
          return;
        }

        const guardrails = (data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          name: item.name as string,
          enabled: item.enabled as boolean,
          action: (item.config_json as Record<string, unknown>)?.action as string | undefined,
          patterns: Array.isArray((item.config_json as Record<string, unknown>)?.patterns)
            ? (item.config_json as Record<string, string[]>).patterns
            : [],
          config: (item.config_json as Record<string, unknown>) ?? null,
          createdAt: item.created_at as string | undefined,
          updatedAt: item.updated_at as string | undefined,
        }));

        setState({ data: guardrails, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, []);

  return state;
};

/**
 * Hook to fetch pass-through endpoints (EdgeAdmin feature).
 * Note: This table may not exist in all deployments.
 */
export const usePassThroughEndpoints = () => {
  const [state, setState] = useState<BaseState<PassThroughEndpoint[]>>(buildInitial<PassThroughEndpoint[]>([]));

  useEffect(() => {
    supabase
      .from('pass_through_endpoints')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          // Table may not exist - don't treat as error
          setState({ data: [], loading: false, error: null });
          return;
        }

        const endpoints = (data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          name: item.name as string,
          url: item.url as string,
          enabled: item.enabled as boolean,
          headers: (item.headers_json as Record<string, string>) ?? null,
          createdAt: item.created_at as string | undefined,
          updatedAt: item.updated_at as string | undefined,
        }));

        setState({ data: endpoints, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, []);

  return state;
};

/**
 * Hook to fetch virtual keys for a user.
 * Virtual keys are managed by EdgeAdmin and grant access to AI models.
 */
export const useVirtualKeys = (email?: string | null) => {
  const [state, setState] = useState<BaseState<VirtualKey[]>>(buildInitial<VirtualKey[]>([]));

  useEffect(() => {
    if (!email) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    supabase
      .from('virtual_keys')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setState({ data: [], loading: false, error: error.message });
          return;
        }

        const keys = (data || []).map((item) => {
          const modelsJson = item.models_json;
          const models = Array.isArray(modelsJson) ? modelsJson as string[] : [];

          return {
            id: item.id,
            label: item.label,
            email: item.email,
            models,
            models_json: models,
            budget_usd: typeof item.budget_usd === 'number' ? item.budget_usd : null,
            expiresAt: item.expires_at,
            expires_at: item.expires_at,
            disabled: Boolean(item.disabled),
            created_at: item.created_at || new Date().toISOString(),
          };
        });

        setState({ data: keys, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, [email]);

  return state;
};

/**
 * Hook to fetch usage summary for a user.
 * Returns total requests and total cost.
 */
export const useUsageSummary = (email?: string | null) => {
  const [state, setState] = useState<BaseState<UsageSummary>>(
    buildInitial<UsageSummary>({ totalRequests: 0, totalCost: 0 })
  );

  useEffect(() => {
    if (!email) {
      setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: null });
      return;
    }

    supabase
      .from('usage')
      .select('cost_usd', { count: 'exact', head: false })
      .eq('email', email)
      .then(({ data, error, count }) => {
        if (error) {
          setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: error.message });
          return;
        }

        const totalCost = (data || []).reduce((sum, item) => sum + (item.cost_usd ?? 0), 0);
        setState({
          data: { totalRequests: count ?? (data?.length ?? 0), totalCost },
          loading: false,
          error: null,
        });
      })
      .catch((err: Error) => {
        setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: err.message });
      });
  }, [email]);

  return state;
};

/**
 * Hook to fetch activity feed for a user.
 * Note: This table may not exist in all deployments.
 */
export const useActivityFeed = (email?: string | null, limit = 10) => {
  const [state, setState] = useState<BaseState<ActivityEvent[]>>(buildInitial<ActivityEvent[]>([]));

  useEffect(() => {
    if (!email) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    supabase
      .from('user_agent_activity')
      .select('*')
      .eq('email', email)
      .order('ts', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) {
          // Table may not exist - don't treat as error
          setState({ data: [], loading: false, error: null });
          return;
        }

        const events = (data || []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          email: item.email as string,
          action: item.action as string,
          timestamp: item.ts as string,
          metadata: (item.meta_json as Record<string, unknown>) ?? null,
        }));

        setState({ data: events, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, [email, limit]);

  return state;
};

/**
 * Hook to fetch detailed usage data for a user.
 * Returns recent usage records with model and cost information.
 */
export const useUsageDetails = (email?: string | null, limit = 50) => {
  const [state, setState] = useState<BaseState<Usage[]>>(buildInitial<Usage[]>([]));

  useEffect(() => {
    if (!email) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    supabase
      .from('usage')
      .select('*')
      .eq('email', email)
      .order('ts', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) {
          setState({ data: [], loading: false, error: error.message });
          return;
        }

        setState({ data: data || [], loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, [email, limit]);

  return state;
};
