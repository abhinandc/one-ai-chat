import supabaseClient from './supabaseClient';

export interface PlaygroundSession {
  id: string;
  name: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  prompt: string;
  response: string | null;
  streaming_enabled: boolean;
  is_favorite: boolean;
  tags: string[];
  tokens_used: number;
  response_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface PlaygroundSettings {
  default_model: string | null;
  default_temperature: number;
  default_max_tokens: number;
  default_top_p: number;
  default_streaming: boolean;
  auto_save_sessions: boolean;
}

class PlaygroundService {
  /**
   * Get recent playground sessions for a user
   */
  async getSessions(
    userEmail: string,
    options?: { limit?: number; offset?: number; favoritesOnly?: boolean }
  ): Promise<PlaygroundSession[]> {
    if (!supabaseClient) {
      console.warn('PlaygroundService: Supabase client not configured');
      return [];
    }

    const { data, error } = await supabaseClient.rpc('get_playground_sessions', {
      p_user_email: userEmail,
      p_limit: options?.limit || 20,
      p_offset: options?.offset || 0,
      p_favorites_only: options?.favoritesOnly || false
    });

    if (error) {
      console.error('Error fetching playground sessions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Save or update a playground session
   */
  async saveSession(
    userEmail: string,
    session: {
      id?: string;
      name?: string;
      model: string;
      temperature: number;
      maxTokens: number;
      topP: number;
      prompt: string;
      response: string;
      streamingEnabled: boolean;
      tokensUsed?: number;
      responseTimeMs?: number;
    }
  ): Promise<string | null> {
    if (!supabaseClient) {
      console.warn('PlaygroundService: Supabase client not configured');
      return null;
    }

    const { data, error } = await supabaseClient.rpc('save_playground_session', {
      p_user_email: userEmail,
      p_session_id: session.id || null,
      p_name: session.name || null,
      p_model: session.model,
      p_temperature: session.temperature,
      p_max_tokens: session.maxTokens,
      p_top_p: session.topP,
      p_prompt: session.prompt,
      p_response: session.response,
      p_streaming_enabled: session.streamingEnabled,
      p_tokens_used: session.tokensUsed || 0,
      p_response_time_ms: session.responseTimeMs || 0
    });

    if (error) {
      console.error('Error saving playground session:', error);
      return null;
    }

    return data as string;
  }

  /**
   * Delete a playground session
   */
  async deleteSession(userEmail: string, sessionId: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('playground_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error deleting playground session:', error);
      return false;
    }

    return true;
  }

  /**
   * Toggle favorite status of a session
   */
  async toggleFavorite(userEmail: string, sessionId: string): Promise<boolean | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient.rpc('toggle_session_favorite', {
      p_session_id: sessionId,
      p_user_email: userEmail
    });

    if (error) {
      console.error('Error toggling favorite:', error);
      return null;
    }

    return data as boolean;
  }

  /**
   * Rename a session
   */
  async renameSession(userEmail: string, sessionId: string, newName: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('playground_sessions')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error renaming session:', error);
      return false;
    }

    return true;
  }

  /**
   * Get user's playground settings
   */
  async getSettings(userEmail: string): Promise<PlaygroundSettings | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('playground_settings')
      .select('*')
      .eq('user_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching playground settings:', error);
      return null;
    }

    if (!data) {
      return {
        default_model: null,
        default_temperature: 0.7,
        default_max_tokens: 2048,
        default_top_p: 0.9,
        default_streaming: true,
        auto_save_sessions: true
      };
    }

    return data;
  }

  /**
   * Save user's playground settings
   */
  async saveSettings(userEmail: string, settings: Partial<PlaygroundSettings>): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('playground_settings')
      .upsert({
        user_email: userEmail,
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_email' });

    if (error) {
      console.error('Error saving playground settings:', error);
      return false;
    }

    return true;
  }

  /**
   * Get a single session by ID
   */
  async getSession(userEmail: string, sessionId: string): Promise<PlaygroundSession | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('playground_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_email', userEmail)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  }
}

export const playgroundService = new PlaygroundService();
