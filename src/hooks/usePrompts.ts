import { useState, useEffect } from 'react';
import { promptService, PromptTemplate } from '../services/promptService';

export interface UsePromptsResult {
  prompts: PromptTemplate[];
  loading: boolean;
  error: string | null;
  savePrompt: (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PromptTemplate>;
  updatePrompt: (id: string, updates: Partial<PromptTemplate>) => Promise<PromptTemplate>;
  deletePrompt: (id: string) => Promise<void>;
  sharePrompt: (id: string) => Promise<string>;
  refetch: () => Promise<void>;
}

export function usePrompts(userEmail?: string): UsePromptsResult {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promptService.getPrompts(userEmail || '');
      setPrompts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompts';
      setError(errorMessage);
      console.error('Failed to fetch prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPrompt = await promptService.savePrompt(prompt);
      await fetchPrompts();
      return newPrompt;
    } catch (error) {
      console.error('Failed to save prompt:', error);
      throw error;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<PromptTemplate>) => {
    try {
      const updatedPrompt = await promptService.updatePrompt(id, updates);
      await fetchPrompts();
      return updatedPrompt;
    } catch (error) {
      console.error('Failed to update prompt:', error);
      throw error;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      await promptService.deletePrompt(id);
      await fetchPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw error;
    }
  };

  const sharePrompt = async (id: string) => {
    try {
      const shareUrl = await promptService.sharePrompt(id);
      await fetchPrompts();
      return shareUrl;
    } catch (error) {
      console.error('Failed to share prompt:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchPrompts();
    }
  }, [userEmail]);

  return {
    prompts,
    loading,
    error,
    savePrompt,
    updatePrompt,
    deletePrompt,
    sharePrompt,
    refetch: fetchPrompts,
  };
}
