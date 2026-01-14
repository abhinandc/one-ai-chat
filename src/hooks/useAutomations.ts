import { useState, useEffect } from 'react';
import { automationService, Automation, AutomationExecution, AutomationTemplate } from '../services/automationService';

export interface UseAutomationsResult {
  automations: Automation[];
  templates: AutomationTemplate[];
  loading: boolean;
  error: string | null;
  createAutomation: (automation: Partial<Automation> & { name: string; description: string }) => Promise<Automation>;
  executeAutomation: (id: string, input: any) => Promise<AutomationExecution>;
  deleteAutomation: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAutomations(userEmail?: string): UseAutomationsResult {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch templates (available to all users)
      const templatesData = await automationService.getTemplates();
      setTemplates(templatesData);

      // Fetch user automations if logged in
      if (userEmail) {
        const data = await automationService.getAutomations(userEmail);
        setAutomations(data);
      } else {
        setAutomations([]);
      }
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

  const createAutomation = async (automation: Partial<Automation> & { name: string; description: string }): Promise<Automation> => {
    if (!userEmail) throw new Error('User email required');
    
    const fullAutomation = {
      name: automation.name,
      description: automation.description,
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
    await fetchAutomations(); // Refresh to update stats
    return execution;
  };

  const deleteAutomation = async (id: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await automationService.deleteAutomation(id, userEmail);
    await fetchAutomations(); // Refresh list
  };

  return {
    automations,
    templates,
    loading,
    error,
    createAutomation,
    executeAutomation,
    deleteAutomation,
    refetch: fetchAutomations,
  };
}
