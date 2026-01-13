import { useState, useEffect } from 'react';
import { promptService, PromptTemplate } from '../services/promptService';
import supabaseClient from '../services/supabaseClient';

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
        getUserLikedPrompts(userEmail)
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

  // Helper function to get user's liked prompts
  const getUserLikedPrompts = async (email: string): Promise<string[]> => {
    try {
      const { data, error } = await supabaseClient
        .from('prompt_likes')
        .select('prompt_id')
        .eq('user_email', email);
      
      if (error) throw error;
      return (data || []).map(item => item.prompt_id);
    } catch (err) {
      console.error('Failed to fetch liked prompts:', err);
      return [];
    }
  };

  // Helper function to increment uses
  const incrementUses = async (promptId: string): Promise<void> => {
    try {
      await supabaseClient.rpc('increment_prompt_uses', { prompt_id: promptId });
    } catch (err) {
      console.error('Failed to increment uses:', err);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [userEmail]);

  const createPrompt = async (prompt: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'uses_count'>): Promise<PromptTemplate> => {
    if (!userEmail) throw new Error('User email required');
    
    const created = await promptService.createPrompt(prompt);
    await fetchPrompts();
    return created;
  };

  const likePrompt = async (promptId: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await promptService.likePrompt(promptId, userEmail);
    await fetchPrompts();
  };

  const deletePrompt = async (promptId: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    await promptService.deletePrompt(promptId, userEmail);
    await fetchPrompts();
  };

  const usePrompt = async (promptId: string): Promise<void> => {
    await incrementUses(promptId);
    await fetchPrompts();
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
