import supabaseClient from './supabaseClient';

export interface PromptTemplate {
  id: string;
  user_email: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  is_public: boolean;
  likes_count: number;
  uses_count: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

class PromptService {
  async getPrompts(userEmail: string): Promise<PromptTemplate[]> {
    const { data, error } = await supabaseClient
      .from('prompt_templates')
      .select('*')
      .or(`user_email.eq.${userEmail},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createPrompt(prompt: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'uses_count'>): Promise<PromptTemplate> {
    const { data, error } = await supabaseClient
      .from('prompt_templates')
      .insert({ ...prompt, likes_count: 0, uses_count: 0 })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async likePrompt(promptId: string, userEmail: string): Promise<void> {
    const { data: existing } = await supabaseClient
      .from('prompt_likes')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('user_email', userEmail)
      .single();

    if (existing) {
      await supabaseClient.from('prompt_likes').delete().eq('prompt_id', promptId).eq('user_email', userEmail);
      await supabaseClient.rpc('decrement_prompt_likes', { prompt_id: promptId });
    } else {
      await supabaseClient.from('prompt_likes').insert({ prompt_id: promptId, user_email: userEmail });
      await supabaseClient.rpc('increment_prompt_likes', { prompt_id: promptId });
    }
  }

  async deletePrompt(id: string, userEmail: string): Promise<void> {
    const { error } = await supabaseClient
      .from('prompt_templates')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    if (error) throw error;
  }
}

export const promptService = new PromptService();
