import { useState, useEffect } from 'react';
import { promptService, PromptTemplate } from '../services/promptService';

export function usePrompts(userEmail?: string) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);

  const fetchPrompts = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [promptsData, likedData] = await Promise.all([
        promptService.getPrompts(userEmail),
        promptService.getUserLikedPrompts(userEmail)
      ]);
      
      setPrompts(promptsData);
      setLikedPrompts(likedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [userEmail]);

  const createPrompt = async (prompt: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'uses_count'>): Promise<PromptTemplate> => {
    if (!userEmail) throw new Error('User email required');
    
    const created = await promptService.createPrompt(prompt);
    await fetchPrompts(); // Refresh list
    return created;
  };

  const likePrompt = async (promptId: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await promptService.likePrompt(promptId, userEmail);
    await fetchPrompts(); // Refresh to update counts
  };

  const deletePrompt = async (promptId: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await promptService.deletePrompt(promptId, userEmail);
    await fetchPrompts(); // Refresh list
  };

  const usePrompt = async (promptId: string): Promise<void> => {
    await promptService.incrementUses(promptId);
    await fetchPrompts(); // Refresh to update counts
  };

  return {
    prompts,
    loading,
    error,
    likedPrompts,
    createPrompt,
    likePrompt,
    deletePrompt,
    usePrompt,
    refetch: fetchPrompts,
  };
}
