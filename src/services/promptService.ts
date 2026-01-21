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
  shared_with_emails?: string[];
  created_at: string;
  updated_at: string;
}

export interface ExternalPrompt {
  id: string;
  feed_id: string;
  external_id: string;
  title: string;
  description: string | null;
  content: string;
  author: string | null;
  source_url: string | null;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity_score: number;
  fetched_at: string;
  created_at: string;
}

export interface PromptFeed {
  id: string;
  name: string;
  description: string | null;
  source_type: 'api' | 'webhook' | 'rss' | 'manual';
  is_active: boolean;
  last_sync_at: string | null;
  sync_count: number;
}

export interface PromptShare {
  id: string;
  prompt_id: string;
  shared_by: string;
  shared_with: string;
  can_edit: boolean;
  created_at: string;
}

class PromptService {
  // =============================================
  // User Prompts
  // =============================================

  async getPrompts(userEmail: string): Promise<PromptTemplate[]> {
    if (!supabaseClient) {
      console.warn('PromptService: Supabase client not configured');
      return [];
    }

    const { data, error } = await supabaseClient
      .from('prompt_templates')
      .select('*')
      .or(`user_email.eq.${userEmail},is_public.eq.true,shared_with_emails.cs.{${userEmail}}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createPrompt(prompt: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'uses_count'>): Promise<PromptTemplate> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabaseClient
      .from('prompt_templates')
      .insert({ ...prompt, likes_count: 0, uses_count: 0 })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePrompt(
    promptId: string,
    userEmail: string,
    updates: Partial<Pick<PromptTemplate, 'title' | 'description' | 'content' | 'category' | 'tags' | 'is_public' | 'difficulty'>>
  ): Promise<PromptTemplate> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabaseClient
      .from('prompt_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePrompt(id: string, userEmail: string): Promise<void> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { error } = await supabaseClient
      .from('prompt_templates')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);

    if (error) throw error;
  }

  async likePrompt(promptId: string, userEmail: string): Promise<void> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

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

  async incrementUsage(promptId: string): Promise<void> {
    if (!supabaseClient) return;

    await supabaseClient.rpc('increment_prompt_uses', { prompt_id: promptId }).catch(() => {
      // Silently fail if the RPC doesn't exist
    });
  }

  // =============================================
  // Sharing
  // =============================================

  async sharePrompt(promptId: string, ownerEmail: string, shareWithEmail: string, canEdit = false): Promise<boolean> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabaseClient.rpc('share_prompt', {
      p_prompt_id: promptId,
      p_owner_email: ownerEmail,
      p_share_with_email: shareWithEmail,
      p_can_edit: canEdit
    });

    if (error) throw error;
    return data as boolean;
  }

  async unsharePrompt(promptId: string, ownerEmail: string, unshareEmail: string): Promise<boolean> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabaseClient.rpc('unshare_prompt', {
      p_prompt_id: promptId,
      p_owner_email: ownerEmail,
      p_unshare_email: unshareEmail
    });

    if (error) throw error;
    return data as boolean;
  }

  async getPromptShares(promptId: string, ownerEmail: string): Promise<PromptShare[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('prompt_shares')
      .select('*')
      .eq('prompt_id', promptId)
      .eq('shared_by', ownerEmail);

    if (error) throw error;
    return data || [];
  }

  async togglePublic(promptId: string, userEmail: string, isPublic: boolean): Promise<PromptTemplate> {
    return this.updatePrompt(promptId, userEmail, { is_public: isPublic });
  }

  // =============================================
  // External Prompts & Feeds
  // =============================================

  async getPromptFeeds(): Promise<PromptFeed[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('prompt_feeds')
      .select('id, name, description, source_type, is_active, last_sync_at, sync_count')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching prompt feeds:', error);
      return [];
    }
    return data || [];
  }

  async getExternalPrompts(options?: {
    feedId?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExternalPrompt[]> {
    if (!supabaseClient) {
      return [];
    }

    let query = supabaseClient
      .from('external_prompts')
      .select('*')
      .order('popularity_score', { ascending: false });

    if (options?.feedId) {
      query = query.eq('feed_id', options.feedId);
    }
    if (options?.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching external prompts:', error);
      return [];
    }
    return data || [];
  }

  async importExternalPrompt(userEmail: string, externalPromptId: string): Promise<string | null> {
    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    const { data, error } = await supabaseClient.rpc('import_external_prompt', {
      p_user_email: userEmail,
      p_external_prompt_id: externalPromptId
    });

    if (error) throw error;
    return data as string | null;
  }

  // =============================================
  // User's Liked Prompts
  // =============================================

  async getUserLikedPrompts(userEmail: string): Promise<string[]> {
    if (!supabaseClient) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from('prompt_likes')
      .select('prompt_id')
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error fetching liked prompts:', error);
      return [];
    }
    return data?.map(d => d.prompt_id) || [];
  }

  // =============================================
  // Daily Picks (Deterministic daily selection)
  // =============================================

  /**
   * Get daily featured prompts that refresh every day
   * Uses a deterministic selection based on the current date
   * so all users see the same picks on the same day
   */
  async getDailyPrompts(count: number = 6): Promise<ExternalPrompt[]> {
    if (!supabaseClient) {
      return [];
    }

    // Get today's date as a seed (YYYY-MM-DD format)
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Simple hash function to get a deterministic number from the date
    const hashCode = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };

    const seed = hashCode(dateStr);

    // Fetch more prompts than needed so we can select from them
    const { data, error } = await supabaseClient
      .from('external_prompts')
      .select('*')
      .order('popularity_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching daily prompts:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Use the seed to deterministically shuffle and pick prompts
    const shuffled = [...data].sort((a, b) => {
      const aHash = hashCode(a.id + dateStr);
      const bHash = hashCode(b.id + dateStr);
      return aHash - bHash;
    });

    // Return the first 'count' prompts from the shuffled list
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get the date string for the current daily picks
   */
  getDailyPicksDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
}

export const promptService = new PromptService();
