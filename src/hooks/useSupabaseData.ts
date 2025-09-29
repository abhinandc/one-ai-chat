import { useEffect, useState } from 'react';
import supabaseClient from '@/services/supabaseClient';

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
  budgetUsd: number | null;
  expiresAt?: string | null;
  disabled: boolean;
}

export interface ActivityEvent {
  id: string;
  email: string;
  action: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export const useGuardrails = () => {
  const [state, setState] = useState<BaseState<Guardrail[]>>(buildInitial<Guardrail[]>([]));

  useEffect(() => {
    const supabase = supabaseClient;
    if (!supabase) {
      setState({ data: [], loading: false, error: 'Supabase client not configured' });
      return;
    }

    supabase
      .from('guardrails')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setState({ data: [], loading: false, error: error.message });
          return;
        }

        const guardrails = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          enabled: item.enabled,
          action: item.config_json?.action,
          patterns: Array.isArray(item.config_json?.patterns) ? item.config_json.patterns : [],
          config: item.config_json ?? null,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setState({ data: guardrails, loading: false, error: null });
      })
      .catch((err) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, []);

  return state;
};

export const usePassThroughEndpoints = () => {
  const [state, setState] = useState<BaseState<PassThroughEndpoint[]>>(buildInitial<PassThroughEndpoint[]>([]));

  useEffect(() => {
    const supabase = supabaseClient;
    if (!supabase) {
      setState({ data: [], loading: false, error: 'Supabase client not configured' });
      return;
    }

    supabase
      .from('pass_through_endpoints')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setState({ data: [], loading: false, error: error.message });
          return;
        }

        const endpoints = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          enabled: item.enabled,
          headers: item.headers_json ?? null,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setState({ data: endpoints, loading: false, error: null });
      })
      .catch((err) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, []);

  return state;
};

export const useVirtualKeys = (email?: string | null) => {
  const [state, setState] = useState<BaseState<VirtualKey[]>>(buildInitial<VirtualKey[]>([]));

  useEffect(() => {
    if (!email) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    const supabase = supabaseClient;
    if (!supabase) {
      setState({ data: [], loading: false, error: 'Supabase client not configured' });
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

        const keys = (data || []).map((item) => ({
          id: item.id,
          label: item.label,
          email: item.email,
          models: Array.isArray(item.models_json) ? item.models_json : [],
          budgetUsd: typeof item.budget_usd === 'number' ? item.budget_usd : null,
          expiresAt: item.expires_at,
          disabled: Boolean(item.disabled),
        }));

        setState({ data: keys, loading: false, error: null });
      })
      .catch((err) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, [email]);

  return state;
};

export const useUsageSummary = (email?: string | null) => {
  const [state, setState] = useState<BaseState<UsageSummary>>(buildInitial<UsageSummary>({ totalRequests: 0, totalCost: 0 }));

  useEffect(() => {
    if (!email) {
      setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: null });
      return;
    }

    const supabase = supabaseClient;
    if (!supabase) {
      setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: 'Supabase client not configured' });
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
        setState({ data: { totalRequests: count ?? (data?.length ?? 0), totalCost }, loading: false, error: null });
      })
      .catch((err) => {
        setState({ data: { totalRequests: 0, totalCost: 0 }, loading: false, error: err.message });
      });
  }, [email]);

  return state;
};

export const useActivityFeed = (email?: string | null, limit = 10) => {
  const [state, setState] = useState<BaseState<ActivityEvent[]>>(buildInitial<ActivityEvent[]>([]));

  useEffect(() => {
    if (!email) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    const supabase = supabaseClient;
    if (!supabase) {
      setState({ data: [], loading: false, error: 'Supabase client not configured' });
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
          setState({ data: [], loading: false, error: error.message });
          return;
        }

        const events = (data || []).map((item) => ({
          id: item.id,
          email: item.email,
          action: item.action,
          timestamp: item.ts,
          metadata: item.meta_json ?? null,
        }));

        setState({ data: events, loading: false, error: null });
      })
      .catch((err) => {
        setState({ data: [], loading: false, error: err.message });
      });
  }, [email, limit]);

  return state;
};
