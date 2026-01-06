import { useState, useEffect } from 'react';
import { automationService, Automation, AutomationExecution } from '../services/automationService';
import supabaseClient from '../services/supabaseClient';

export interface UseAutomationsResult {
  automations: Automation[];
  loading: boolean;
  error: string | null;
  createAutomation: (automation: Partial<Automation>) => Promise<Automation>;
  executeAutomation: (id: string, input: any) => Promise<AutomationExecution>;
  deleteAutomation: (id: string) => Promise<void>;
  pauseAutomation: (id: string) => Promise<void>;
  resumeAutomation: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAutomations(userEmail?: string): UseAutomationsResult {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = async () => {
    if (!userEmail) {
      setAutomations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await automationService.getAutomations(userEmail);
      setAutomations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch automations');
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, [userEmail]);

  const createAutomation = async (automation: Partial<Automation>): Promise<Automation> => {
    if (!userEmail) throw new Error('User email required');
    
    // Build the full automation object with required fields
    const fullAutomation = {
      user_email: userEmail,
      name: automation.name || 'Untitled Automation',
      description: automation.description || '',
      agent_id: automation.agent_id || '',
      trigger_config: automation.trigger_config || { type: 'manual' as const, config: {} },
      enabled: automation.enabled ?? true,
    };
    
    const created = await automationService.createAutomation(fullAutomation, userEmail);
    await fetchAutomations();
    return created;
  };

  const executeAutomation = async (id: string, input: any): Promise<AutomationExecution> => {
    if (!userEmail) throw new Error('User email required');
    
    const execution = await automationService.executeAutomation(id, input, userEmail);
    await fetchAutomations();
    return execution;
  };

  const deleteAutomation = async (id: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    const { error } = await supabaseClient
      .from('automations')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    await fetchAutomations();
  };

  const pauseAutomation = async (id: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    const { error } = await supabaseClient
      .from('automations')
      .update({ enabled: false })
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    await fetchAutomations();
  };

  const resumeAutomation = async (id: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    const { error } = await supabaseClient
      .from('automations')
      .update({ enabled: true })
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    await fetchAutomations();
  };

  return {
    automations,
    loading,
    error,
    createAutomation,
    executeAutomation,
    deleteAutomation,
    pauseAutomation,
    resumeAutomation,
    refetch: fetchAutomations,
  };
}
