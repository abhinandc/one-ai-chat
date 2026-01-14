import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface DepartmentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  natural_language_example: string | null;
  trigger_channel_slug: string | null;
  action_channel_slug: string | null;
  department_id: string | null;
  complexity: string | null;
  estimated_time: string | null;
  required_integrations: string[] | null;
  steps: any[];
  is_featured: boolean;
  use_count: number;
  department?: Department;
}

export interface DepartmentAutomation {
  id: string;
  name: string;
  description: string | null;
  natural_language_rule: string;
  department_id: string | null;
  trigger_channel_id: string | null;
  action_channel_id: string | null;
  is_automated: boolean;
  is_enabled: boolean;
  priority: string | null;
  approval_required: boolean;
  approvers: string[];
  schedule_cron: string | null;
  conditions: any[];
  actions: any[];
  variables: Record<string, any>;
  run_count: number;
  last_run_status: string | null;
  last_run_at: string | null;
  trigger_count: number;
  created_at: string;
  user_email: string;
  department?: Department;
  trigger_channel?: { name: string; icon: string | null; slug: string } | null;
  action_channel?: { name: string; icon: string | null; slug: string } | null;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('departments')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setDepartments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch departments'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, loading, error, refetch: fetchDepartments };
}

export function useDepartmentTemplates(departmentId?: string | null) {
  const [templates, setTemplates] = useState<DepartmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query dynamically to avoid type issues
      const baseQuery = supabase
        .from('workflow_templates')
        .select('*, department:departments(*)')
        .order('is_featured', { ascending: false })
        .order('use_count', { ascending: false });

      const { data, error } = departmentId 
        ? await baseQuery.eq('department_id', departmentId)
        : await baseQuery;
        
      if (error) throw error;
      
      setTemplates((data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        natural_language_example: t.natural_language_example,
        trigger_channel_slug: t.trigger_channel_slug,
        action_channel_slug: t.action_channel_slug,
        department_id: t.department_id,
        complexity: t.complexity,
        estimated_time: t.estimated_time,
        required_integrations: t.required_integrations || [],
        steps: Array.isArray(t.steps) ? t.steps : [],
        is_featured: t.is_featured ?? false,
        use_count: t.use_count ?? 0,
        department: t.department,
      })));
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, refetch: fetchTemplates };
}

export function useDepartmentAutomations(userEmail: string | null, departmentId?: string | null) {
  const [automations, setAutomations] = useState<DepartmentAutomation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = useCallback(async () => {
    if (!userEmail) {
      setAutomations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const baseQuery = supabase
        .from('automation_rules')
        .select(`
          *,
          department:departments(*),
          trigger_channel:integration_channels!automation_rules_trigger_channel_id_fkey(name, icon, slug),
          action_channel:integration_channels!automation_rules_action_channel_id_fkey(name, icon, slug)
        `)
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      const { data, error } = departmentId
        ? await baseQuery.eq('department_id', departmentId)
        : await baseQuery;

      if (error) throw error;

      setAutomations((data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        natural_language_rule: a.natural_language_rule,
        department_id: a.department_id,
        trigger_channel_id: a.trigger_channel_id,
        action_channel_id: a.action_channel_id,
        is_automated: a.is_automated ?? true,
        is_enabled: a.is_enabled ?? true,
        priority: a.priority,
        approval_required: a.approval_required ?? false,
        approvers: a.approvers || [],
        schedule_cron: a.schedule_cron,
        conditions: Array.isArray(a.conditions) ? a.conditions : [],
        actions: Array.isArray(a.actions) ? a.actions : [],
        variables: typeof a.variables === 'object' && a.variables ? a.variables : {},
        run_count: a.run_count ?? 0,
        last_run_status: a.last_run_status,
        last_run_at: a.last_run_at,
        trigger_count: a.trigger_count ?? 0,
        created_at: a.created_at,
        user_email: a.user_email,
        department: a.department,
        trigger_channel: a.trigger_channel,
        action_channel: a.action_channel,
      })));
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, departmentId]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const createAutomation = async (automation: Partial<DepartmentAutomation>) => {
    if (!userEmail) return { error: new Error('No user'), data: null };

    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        name: automation.name || 'Untitled Automation',
        description: automation.description || null,
        natural_language_rule: automation.natural_language_rule || '',
        department_id: automation.department_id || null,
        trigger_channel_id: automation.trigger_channel_id || null,
        action_channel_id: automation.action_channel_id || null,
        is_automated: automation.is_automated ?? true,
        is_enabled: automation.is_enabled ?? true,
        priority: automation.priority || 'medium',
        approval_required: automation.approval_required ?? false,
        approvers: automation.approvers || [],
        schedule_cron: automation.schedule_cron || null,
        conditions: automation.conditions || [],
        actions: automation.actions || [],
        variables: automation.variables || {},
        user_email: userEmail,
      })
      .select()
      .single();

    if (!error) {
      fetchAutomations();
    }

    return { data, error };
  };

  const updateAutomation = async (id: string, updates: Partial<DepartmentAutomation>) => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;
    if (updates.is_automated !== undefined) updateData.is_automated = updates.is_automated;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.department_id !== undefined) updateData.department_id = updates.department_id;
    
    const { data, error } = await supabase
      .from('automation_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      fetchAutomations();
    }

    return { data, error };
  };

  const toggleAutomation = async (id: string, enabled: boolean) => {
    return updateAutomation(id, { is_enabled: enabled });
  };

  const deleteAutomation = async (id: string) => {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchAutomations();
    }

    return { error };
  };

  return {
    automations,
    loading,
    refetch: fetchAutomations,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
  };
}
