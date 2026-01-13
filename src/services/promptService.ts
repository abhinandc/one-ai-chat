import { supabase } from '@/integrations/supabase';
import { logger } from '@/lib/logger';
import type {
  PromptTemplate,
  PromptLike,
  DifficultyLevel,
} from '@/integrations/supabase';

// Re-export types for convenience
export type { PromptTemplate, PromptLike, DifficultyLevel };

export interface CreatePromptInput {
  user_email: string;
  title: string;
  description?: string;
  content: string;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  difficulty?: DifficultyLevel;
}

class PromptService {
  /**
   * Get all prompts visible to a user.
   * Includes user's own prompts and all public prompts.
   */
  async getPrompts(userEmail: string): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .or(`user_email.eq.${userEmail},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch prompts', error);
      throw new Error(`Failed to fetch prompts: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Get a single prompt by ID.
   */
  async getPrompt(promptId: string): Promise<PromptTemplate | null> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', promptId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      logger.error('Failed to fetch prompt', error);
      throw new Error(`Failed to fetch prompt: ${error.message}`);
    }
    return data;
  }

  /**
   * Create a new prompt.
   */
  async createPrompt(prompt: CreatePromptInput): Promise<PromptTemplate> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        user_email: prompt.user_email,
        title: prompt.title,
        description: prompt.description || null,
        content: prompt.content,
        category: prompt.category || null,
        tags: prompt.tags || [],
        is_public: prompt.is_public ?? false,
        difficulty: prompt.difficulty || null,
        likes_count: 0,
        uses_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create prompt', error);
      throw new Error(`Failed to create prompt: ${error.message}`);
    }
    return data;
  }

  /**
   * Update an existing prompt.
   */
  async updatePrompt(
    promptId: string,
    userEmail: string,
    updates: Partial<CreatePromptInput>
  ): Promise<PromptTemplate> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update prompt', error);
      throw new Error(`Failed to update prompt: ${error.message}`);
    }
    return data;
  }

  /**
   * Toggle like on a prompt.
   * If already liked, unlikes it. Otherwise, likes it.
   */
  async likePrompt(promptId: string, userEmail: string): Promise<boolean> {
    // Check if already liked
    const { data: existing } = await supabase
      .from('prompt_likes')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('user_email', userEmail)
      .single();

    if (existing) {
      // Unlike: remove the like and decrement count
      const { error: deleteError } = await supabase
        .from('prompt_likes')
        .delete()
        .eq('prompt_id', promptId)
        .eq('user_email', userEmail);

      if (deleteError) {
        logger.error('Failed to remove like', deleteError);
        throw new Error(`Failed to unlike prompt: ${deleteError.message}`);
      }

      await supabase.rpc('decrement_prompt_likes', { prompt_id: promptId });
      return false; // No longer liked
    } else {
      // Like: add the like and increment count
      const { error: insertError } = await supabase
        .from('prompt_likes')
        .insert({ prompt_id: promptId, user_email: userEmail });

      if (insertError) {
        logger.error('Failed to add like', insertError);
        throw new Error(`Failed to like prompt: ${insertError.message}`);
      }

      await supabase.rpc('increment_prompt_likes', { prompt_id: promptId });
      return true; // Now liked
    }
  }

  /**
   * Check if a user has liked a prompt.
   */
  async hasLiked(promptId: string, userEmail: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('prompt_likes')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('user_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to check like status', error);
    }

    return !!data;
  }

  /**
   * Increment the usage count when a prompt is used.
   */
  async recordUsage(promptId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_prompt_uses', { prompt_id: promptId });

    if (error) {
      logger.error('Failed to record prompt usage', error);
    }
  }

  /**
   * Delete a prompt.
   */
  async deletePrompt(promptId: string, userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', promptId)
      .eq('user_email', userEmail);

    if (error) {
      logger.error('Failed to delete prompt', error);
      throw new Error(`Failed to delete prompt: ${error.message}`);
    }
  }

  /**
   * Get prompts by category.
   */
  async getPromptsByCategory(category: string): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('category', category)
      .eq('is_public', true)
      .order('likes_count', { ascending: false });

    if (error) {
      logger.error('Failed to fetch prompts by category', error);
      throw new Error(`Failed to fetch prompts: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Search prompts by title or content.
   */
  async searchPrompts(query: string, userEmail: string): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .or(`user_email.eq.${userEmail},is_public.eq.true`)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,description.ilike.%${query}%`)
      .order('likes_count', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Failed to search prompts', error);
      throw new Error(`Failed to search prompts: ${error.message}`);
    }
    return data || [];
  }
}

export const promptService = new PromptService();
