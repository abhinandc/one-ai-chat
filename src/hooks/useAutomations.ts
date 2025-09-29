import { useState, useEffect } from 'react';
import { automationService, Automation, AutomationExecution } from '../services/automationService';

export interface UseAutomationsResult {
  automations: Automation[];
  loading: boolean;
  error: string | null;
  executeAutomation: (id: string, input?: any) => Promise<AutomationExecution>;
  pauseAutomation: (id: string) => Promise<void>;
  resumeAutomation: (id: string) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  createAutomation: (automation: Partial<Automation>) => Promise<Automation>;
  refetch: () => Promise<void>;
}

export function useAutomations(): UseAutomationsResult {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await automationService.getAutomations();
      setAutomations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch automations';
      setError(errorMessage);
      console.error('Failed to fetch automations:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeAutomation = async (id: string, input: any = {}) => {
    try {
      const execution = await automationService.executeAutomation(id, input);
      // Refresh automations to update metrics
      await fetchAutomations();
      return execution;
    } catch (error) {
      console.error('Failed to execute automation:', error);
      throw error;
    }
  };

  const pauseAutomation = async (id: string) => {
    try {
      await automationService.pauseAutomation(id);
      await fetchAutomations();
    } catch (error) {
      console.error('Failed to pause automation:', error);
      throw error;
    }
  };

  const resumeAutomation = async (id: string) => {
    try {
      await automationService.resumeAutomation(id);
      await fetchAutomations();
    } catch (error) {
      console.error('Failed to resume automation:', error);
      throw error;
    }
  };

  const deleteAutomation = async (id: string) => {
    try {
      await automationService.deleteAutomation(id);
      await fetchAutomations();
    } catch (error) {
      console.error('Failed to delete automation:', error);
      throw error;
    }
  };

  const createAutomation = async (automation: Partial<Automation>) => {
    try {
      const newAutomation = await automationService.createAutomation(automation);
      await fetchAutomations();
      return newAutomation;
    } catch (error) {
      console.error('Failed to create automation:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  return {
    automations,
    loading,
    error,
    executeAutomation,
    pauseAutomation,
    resumeAutomation,
    deleteAutomation,
    createAutomation,
    refetch: fetchAutomations,
  };
}
