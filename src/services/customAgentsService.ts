import supabaseClient from './supabaseClient';

export interface CustomAgent {
  id: string;
  user_email: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
  is_shared: boolean;
  is_public: boolean;
  use_count: number;
  tags: string[];
  is_own: boolean;
  created_at: string;
}

export interface NewAgentData {
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  is_shared?: boolean;
  is_public?: boolean;
  tags?: string[];
}

class CustomAgentsService {
  /**
   * Get all agents accessible to the user
   */
  async getAgents(
    userEmail: string,
    options?: { includePublic?: boolean; limit?: number }
  ): Promise<CustomAgent[]> {
    if (!supabaseClient) {
      console.warn('CustomAgentsService: Supabase client not configured');
      return [];
    }

    const { data, error } = await supabaseClient.rpc('get_custom_agents', {
      p_user_email: userEmail,
      p_include_public: options?.includePublic ?? true,
      p_limit: options?.limit ?? 50
    });

    if (error) {
      console.error('Error fetching custom agents:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a new custom agent
   */
  async createAgent(
    userEmail: string,
    agentData: NewAgentData
  ): Promise<string | null> {
    if (!supabaseClient) {
      console.warn('CustomAgentsService: Supabase client not configured');
      return null;
    }

    const { data, error } = await supabaseClient.rpc('create_custom_agent', {
      p_user_email: userEmail,
      p_name: agentData.name,
      p_description: agentData.description || null,
      p_system_prompt: agentData.system_prompt,
      p_model: agentData.model,
      p_temperature: agentData.temperature ?? 0.7,
      p_max_tokens: agentData.max_tokens ?? 2048,
      p_tools: agentData.tools || [],
      p_is_shared: agentData.is_shared ?? false,
      p_is_public: agentData.is_public ?? false
    });

    if (error) {
      console.error('Error creating custom agent:', error);
      return null;
    }

    // If we have additional fields, update them
    if (data && (agentData.avatar_url || agentData.tags)) {
      await supabaseClient
        .from('custom_agents')
        .update({
          avatar_url: agentData.avatar_url,
          tags: agentData.tags || []
        })
        .eq('id', data);
    }

    return data as string;
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(userEmail: string, agentId: string): Promise<CustomAgent | null> {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('custom_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      console.error('Error fetching agent:', error);
      return null;
    }

    return {
      ...data,
      is_own: data.user_email === userEmail
    };
  }

  /**
   * Update an agent
   */
  async updateAgent(
    userEmail: string,
    agentId: string,
    updates: Partial<NewAgentData>
  ): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.system_prompt !== undefined) updateData.system_prompt = updates.system_prompt;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
    if (updates.max_tokens !== undefined) updateData.max_tokens = updates.max_tokens;
    if (updates.tools !== undefined) updateData.tools = updates.tools;
    if (updates.is_shared !== undefined) updateData.is_shared = updates.is_shared;
    if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { error } = await supabaseClient
      .from('custom_agents')
      .update(updateData)
      .eq('id', agentId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error updating agent:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete an agent
   */
  async deleteAgent(userEmail: string, agentId: string): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('custom_agents')
      .delete()
      .eq('id', agentId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error deleting agent:', error);
      return false;
    }

    return true;
  }

  /**
   * Share an agent with specific users
   */
  async shareAgent(
    userEmail: string,
    agentId: string,
    shareWith: string[]
  ): Promise<boolean> {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('custom_agents')
      .update({
        shared_with: shareWith,
        is_shared: shareWith.length > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error sharing agent:', error);
      return false;
    }

    return true;
  }

  /**
   * Toggle public visibility
   */
  async togglePublic(userEmail: string, agentId: string): Promise<boolean | null> {
    if (!supabaseClient) {
      return null;
    }

    // First get current status
    const { data: current } = await supabaseClient
      .from('custom_agents')
      .select('is_public')
      .eq('id', agentId)
      .eq('user_email', userEmail)
      .single();

    if (!current) return null;

    const newStatus = !current.is_public;

    const { error } = await supabaseClient
      .from('custom_agents')
      .update({
        is_public: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .eq('user_email', userEmail);

    if (error) {
      console.error('Error toggling public:', error);
      return null;
    }

    return newStatus;
  }

  /**
   * Increment use count
   */
  async recordUse(agentId: string): Promise<void> {
    if (!supabaseClient) return;

    await supabaseClient.rpc('increment', {
      row_id: agentId,
      table_name: 'custom_agents',
      column_name: 'use_count'
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabaseClient
        .from('custom_agents')
        .update({
          use_count: supabaseClient.rpc('sql', {
            query: `(SELECT use_count + 1 FROM custom_agents WHERE id = '${agentId}')`
          })
        })
        .eq('id', agentId);
    });
  }

  /**
   * Duplicate an agent
   */
  async duplicateAgent(
    userEmail: string,
    sourceAgentId: string,
    newName?: string
  ): Promise<string | null> {
    const sourceAgent = await this.getAgent(userEmail, sourceAgentId);
    if (!sourceAgent) return null;

    return this.createAgent(userEmail, {
      name: newName || `${sourceAgent.name} (Copy)`,
      description: sourceAgent.description || undefined,
      system_prompt: sourceAgent.system_prompt,
      model: sourceAgent.model,
      temperature: sourceAgent.temperature,
      max_tokens: sourceAgent.max_tokens,
      tools: sourceAgent.tools,
      tags: sourceAgent.tags
    });
  }
}

export const customAgentsService = new CustomAgentsService();
