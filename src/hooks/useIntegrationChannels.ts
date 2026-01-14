import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IntegrationChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string;
  auth_type: string | null;
  is_active: boolean;
}

export interface UserIntegration {
  id: string;
  user_email: string;
  channel_id: string;
  status: string;
  channel?: IntegrationChannel;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  natural_language_example: string | null;
  trigger_channel_slug: string | null;
  action_channel_slug: string | null;
  is_featured: boolean;
  use_count: number;
}

export interface AutomationRule {
  id: string;
  user_email: string;
  name: string;
  description: string | null;
  natural_language_rule: string;
  trigger_channel_id: string | null;
  action_channel_id: string | null;
  is_automated: boolean;
  is_enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  trigger_channel?: IntegrationChannel;
  action_channel?: IntegrationChannel;
}

export function useIntegrationChannels() {
  const [channels, setChannels] = useState<IntegrationChannel[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('integration_channels')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;
      setChannels(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('is_featured', { ascending: false });

      if (fetchError) throw fetchError;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchChannels(), fetchTemplates()]);
      setLoading(false);
    };
    init();
  }, [fetchChannels, fetchTemplates]);

  return { channels, templates, loading, error, refetch: fetchChannels };
}

export function useUserIntegrations(userEmail: string | null) {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setIntegrations([]);
      setLoading(false);
      return;
    }

    const fetchIntegrations = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_integrations')
        .select('*, channel:integration_channels(*)')
        .eq('user_email', userEmail);

      setIntegrations(data || []);
      setLoading(false);
    };

    fetchIntegrations();
  }, [userEmail]);

  const connectIntegration = async (channelId: string) => {
    if (!userEmail) return;

    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_email: userEmail,
        channel_id: channelId,
        status: 'connected'
      });

    if (!error) {
      const { data } = await supabase
        .from('user_integrations')
        .select('*, channel:integration_channels(*)')
        .eq('user_email', userEmail);
      setIntegrations(data || []);
    }

    return error;
  };

  const disconnectIntegration = async (integrationId: string) => {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integrationId);

    if (!error) {
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
    }

    return error;
  };

  return { integrations, loading, connectIntegration, disconnectIntegration };
}

export function useAutomationRules(userEmail: string | null) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!userEmail) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('automation_rules')
      .select(`
        *,
        trigger_channel:integration_channels!automation_rules_trigger_channel_id_fkey(*),
        action_channel:integration_channels!automation_rules_action_channel_id_fkey(*)
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    setRules(data || []);
    setLoading(false);
  }, [userEmail]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const createRule = async (rule: {
    name: string;
    description?: string | null;
    natural_language_rule: string;
    trigger_channel_id?: string | null;
    action_channel_id?: string | null;
    is_automated?: boolean;
    is_enabled?: boolean;
  }) => {
    if (!userEmail) return { error: new Error('No user'), data: null };

    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        name: rule.name,
        description: rule.description || null,
        natural_language_rule: rule.natural_language_rule,
        trigger_channel_id: rule.trigger_channel_id || null,
        action_channel_id: rule.action_channel_id || null,
        is_automated: rule.is_automated ?? true,
        is_enabled: rule.is_enabled ?? true,
        user_email: userEmail,
      })
      .select()
      .single();

    if (!error) {
      fetchRules();
    }

    return { data, error };
  };

  const updateRule = async (id: string, updates: Partial<AutomationRule>) => {
    const { error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', id);

    if (!error) {
      fetchRules();
    }

    return { error };
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (!error) {
      setRules(prev => prev.filter(r => r.id !== id));
    }

    return { error };
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    return updateRule(id, { is_enabled: enabled });
  };

  return { rules, loading, createRule, updateRule, deleteRule, toggleRule, refetch: fetchRules };
}
