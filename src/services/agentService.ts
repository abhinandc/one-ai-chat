/**
 * Agent Service for OneEdge
 *
 * This service handles all agent-related operations using Supabase.
 * Agents are custom AI workflow definitions that can be shared with team members.
 *
 * @module services/agentService
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Agent,
  AgentInsert,
  AgentUpdate,
  AgentWorkflowData,
  Json,
} from '@/integrations/supabase/types';

/**
 * Agent with additional computed properties
 */
export interface AgentWithDetails extends Agent {
  shared_count?: number;
  is_owner?: boolean;
}

/**
 * Input for creating a new agent
 */
export interface CreateAgentInput {
  name: string;
  description?: string;
  model: string;
  system_prompt?: string;
  workflow_data?: AgentWorkflowData;
  is_shared?: boolean;
  shared_with?: string[];
  tags?: string[];
}

/**
 * Input for updating an existing agent
 */
export interface UpdateAgentInput {
  name?: string;
  description?: string;
  model?: string;
  system_prompt?: string;
  workflow_data?: AgentWorkflowData;
  is_shared?: boolean;
  shared_with?: string[];
  tags?: string[];
}

/**
 * Agent Service class for managing agent operations
 */
class AgentService {
  /**
   * Get all agents for a user (owned + shared with them)
   */
  async getAgents(userId: string): Promise<AgentWithDetails[]> {
    // Get owned agents
    const { data: ownedAgents, error: ownedError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) {
      throw new Error(`Failed to fetch owned agents: ${ownedError.message}`);
    }

    // Get shared agents (where userId is in shared_with array)
    const { data: sharedAgents, error: sharedError } = await supabase
      .from('agents')
      .select('*')
      .contains('shared_with', [userId])
      .neq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sharedError) {
      throw new Error(`Failed to fetch shared agents: ${sharedError.message}`);
    }

    // Combine and add details
    const allAgents = [
      ...(ownedAgents || []).map((agent) => ({
        ...agent,
        is_owner: true,
        shared_count: agent.shared_with?.length || 0,
      })),
      ...(sharedAgents || []).map((agent) => ({
        ...agent,
        is_owner: false,
        shared_count: agent.shared_with?.length || 0,
      })),
    ];

    return allAgents as AgentWithDetails[];
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(agentId: string, userId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new agent
   */
  async createAgent(input: CreateAgentInput, userId: string): Promise<Agent> {
    const agentData: AgentInsert = {
      user_id: userId,
      name: input.name,
      description: input.description || null,
      model: input.model,
      system_prompt: input.system_prompt || null,
      workflow_data: (input.workflow_data || { nodes: [], edges: [] }) as Json,
      is_shared: input.is_shared ?? false,
      shared_with: input.shared_with || [],
      tags: input.tags || [],
    };

    const { data, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing agent
   */
  async updateAgent(
    agentId: string,
    userId: string,
    updates: UpdateAgentInput
  ): Promise<Agent> {
    // First verify ownership
    const existing = await this.getAgent(agentId, userId);
    if (!existing) {
      throw new Error('Agent not found');
    }

    // Only owner can update
    if (existing.user_id !== userId) {
      throw new Error('You do not have permission to update this agent');
    }

    const updateData: AgentUpdate = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.model !== undefined && { model: updates.model }),
      ...(updates.system_prompt !== undefined && { system_prompt: updates.system_prompt }),
      ...(updates.workflow_data !== undefined && { workflow_data: updates.workflow_data as Json }),
      ...(updates.is_shared !== undefined && { is_shared: updates.is_shared }),
      ...(updates.shared_with !== undefined && { shared_with: updates.shared_with }),
      ...(updates.tags !== undefined && { tags: updates.tags }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.getAgent(agentId, userId);
    if (!existing) {
      throw new Error('Agent not found');
    }

    if (existing.user_id !== userId) {
      throw new Error('You do not have permission to delete this agent');
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`);
    }
  }

  /**
   * Share an agent with other users
   */
  async shareAgent(
    agentId: string,
    userId: string,
    shareWithUserIds: string[]
  ): Promise<Agent> {
    const existing = await this.getAgent(agentId, userId);
    if (!existing || existing.user_id !== userId) {
      throw new Error('Agent not found or you do not have permission');
    }

    const newSharedWith = [
      ...new Set([...(existing.shared_with || []), ...shareWithUserIds]),
    ];

    return this.updateAgent(agentId, userId, {
      shared_with: newSharedWith,
      is_shared: newSharedWith.length > 0,
    });
  }

  /**
   * Unshare an agent from specific users
   */
  async unshareAgent(
    agentId: string,
    userId: string,
    removeUserIds: string[]
  ): Promise<Agent> {
    const existing = await this.getAgent(agentId, userId);
    if (!existing || existing.user_id !== userId) {
      throw new Error('Agent not found or you do not have permission');
    }

    const newSharedWith = (existing.shared_with || []).filter(
      (id) => !removeUserIds.includes(id)
    );

    return this.updateAgent(agentId, userId, {
      shared_with: newSharedWith,
      is_shared: newSharedWith.length > 0,
    });
  }

  /**
   * Duplicate an agent
   */
  async duplicateAgent(agentId: string, userId: string): Promise<Agent> {
    const existing = await this.getAgent(agentId, userId);
    if (!existing) {
      throw new Error('Agent not found');
    }

    return this.createAgent(
      {
        name: `${existing.name} (Copy)`,
        description: existing.description || undefined,
        model: existing.model,
        system_prompt: existing.system_prompt || undefined,
        workflow_data: existing.workflow_data as AgentWorkflowData,
        is_shared: false,
        shared_with: [],
        tags: existing.tags || [],
      },
      userId
    );
  }

  /**
   * Get agents by tag
   */
  async getAgentsByTag(userId: string, tag: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agents by tag: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search agents by name or description
   */
  async searchAgents(userId: string, query: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .or(`user_id.eq.${userId},shared_with.cs.{${userId}}`)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get public/shared agents (for discovery)
   */
  async getPublicAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_shared', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch public agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Execute an agent with given input
   * This sends the input through the agent's workflow and returns the result
   */
  async executeAgent(
    agentId: string,
    userId: string,
    input: {
      message: string;
      context?: Record<string, any>;
      stream?: boolean;
    }
  ): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    tokensUsed?: number;
  }> {
    const startTime = Date.now();

    try {
      // Get the agent
      const agent = await this.getAgent(agentId, userId);
      if (!agent) {
        return {
          success: false,
          error: 'Agent not found or you do not have permission to access it',
        };
      }

      // Validate agent configuration
      if (!agent.model) {
        return {
          success: false,
          error: 'Agent does not have a model assigned',
        };
      }

      // Build system prompt from workflow data
      const workflowData = agent.workflow_data as any;
      const nodes = workflowData?.nodes || [];

      let systemPrompt = agent.system_prompt || `You are ${agent.name}`;

      // Find system node in workflow
      const systemNode = nodes.find((n: any) => n.type === 'system');
      if (systemNode?.data?.content) {
        systemPrompt = systemNode.data.content;
      }

      // Extract tool configurations from workflow
      const toolNodes = nodes.filter((n: any) => n.type === 'tool');
      const tools = toolNodes.map((node: any) => ({
        name: node.data?.toolName || 'unknown',
        scopes: node.data?.scopes || ['read'],
      }));

      // Make AI API call (using OneEdge API client)
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.message },
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: input.stream || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `API request failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: data.choices?.[0]?.message?.content || 'No response',
        executionTime,
        tokensUsed: data.usage?.total_tokens,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during execution',
        executionTime,
      };
    }
  }

  /**
   * Test an agent workflow without saving
   * Useful for testing agent configurations before saving
   */
  async testAgentWorkflow(
    userId: string,
    config: {
      model: string;
      systemPrompt?: string;
      workflowData?: AgentWorkflowData;
      testInput: string;
    }
  ): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
  }> {
    const startTime = Date.now();

    try {
      // Validate model
      if (!config.model) {
        return {
          success: false,
          error: 'Model is required',
        };
      }

      // Build system prompt
      const workflowData = config.workflowData as any;
      const nodes = workflowData?.nodes || [];

      let systemPrompt = config.systemPrompt || 'You are a helpful AI assistant';

      // Find system node in workflow
      const systemNode = nodes.find((n: any) => n.type === 'system');
      if (systemNode?.data?.content) {
        systemPrompt = systemNode.data.content;
      }

      // Make AI API call
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: config.testInput },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `API request failed: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: data.choices?.[0]?.message?.content || 'No response',
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during test',
        executionTime,
      };
    }
  }
}

export const agentService = new AgentService();
export default agentService;
