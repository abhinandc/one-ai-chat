import { useState, useEffect } from 'react';
import { automationService, Automation, AutomationExecution } from '../services/automationService';

export interface UseAutomationsResult {
  automations: Automation[];
  loading: boolean;
  error: string | null;
  createAutomation: (automation: Partial<Automation> & { name: string; description: string }) => Promise<Automation>;
  createFromTemplate: (templateId: string, config: { name?: string; description?: string; credentialId?: string; model?: string }) => Promise<Automation>;
  executeAutomation: (id: string, input: any) => Promise<AutomationExecution>;
  deleteAutomation: (id: string) => Promise<void>;
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

  const createAutomation = async (automation: Partial<Automation> & { name: string; description: string }): Promise<Automation> => {
    if (!userEmail) throw new Error('User email required');

    const fullAutomation = {
      name: automation.name,
      description: automation.description,
      agent_id: automation.agent_id || '',
      trigger_config: automation.trigger_config || { type: 'manual' as const, config: {} },
      enabled: automation.enabled ?? true,
      credential_id: automation.credential_id,
      model: automation.model,
      template_id: automation.template_id,
    };

    const created = await automationService.createAutomation(fullAutomation, userEmail);
    await fetchAutomations();
    return created;
  };

  const createFromTemplate = async (
    templateId: string,
    config: { name?: string; description?: string; credentialId?: string; model?: string }
  ): Promise<Automation> => {
    if (!userEmail) throw new Error('User email required');

    const created = await automationService.createFromTemplate(templateId, config, userEmail);
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
    loading,
    error,
    createAutomation,
    createFromTemplate,
    executeAutomation,
    deleteAutomation,
    refetch: fetchAutomations,
  };
}
