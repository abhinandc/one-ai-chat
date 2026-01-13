/**
 * Supabase Agents Hook for OneEdge
 *
 * This hook provides React state management for agents stored in Supabase.
 * It supports CRUD operations, sharing, and searching.
 *
 * @module hooks/useSupabaseAgents
 */

import { useState, useEffect, useCallback } from 'react';
import {
  agentService,
  AgentWithDetails,
  CreateAgentInput,
  UpdateAgentInput,
} from '@/services/agentService';
import type { Agent, AgentWorkflowData } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

/**
 * Result interface for the useSupabaseAgents hook
 */
export interface UseSupabaseAgentsResult {
  /** List of agents (owned and shared with user) */
  agents: AgentWithDetails[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Create a new agent */
  createAgent: (input: CreateAgentInput) => Promise<Agent>;
  /** Update an existing agent */
  updateAgent: (agentId: string, updates: UpdateAgentInput) => Promise<Agent>;
  /** Delete an agent */
  deleteAgent: (agentId: string) => Promise<void>;
  /** Share an agent with other users */
  shareAgent: (agentId: string, userIds: string[]) => Promise<Agent>;
  /** Unshare an agent from users */
  unshareAgent: (agentId: string, userIds: string[]) => Promise<Agent>;
  /** Duplicate an agent */
  duplicateAgent: (agentId: string) => Promise<Agent>;
  /** Search agents by query */
  searchAgents: (query: string) => Promise<Agent[]>;
  /** Get agents by tag */
  getAgentsByTag: (tag: string) => Promise<Agent[]>;
  /** Refresh the agents list */
  refetch: () => Promise<void>;
  /** Get a single agent by ID */
  getAgent: (agentId: string) => Promise<Agent | null>;
  /** Execute an agent with input */
  executeAgent: (agentId: string, input: { message: string; context?: Record<string, any>; stream?: boolean }) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
    tokensUsed?: number;
  }>;
  /** Test agent workflow without saving */
  testAgentWorkflow: (config: {
    model: string;
    systemPrompt?: string;
    workflowData?: AgentWorkflowData;
    testInput: string;
  }) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
    executionTime?: number;
  }>;
}

/**
 * Hook options
 */
export interface UseSupabaseAgentsOptions {
  /** Whether to include shared agents in the list */
  includeShared?: boolean;
  /** Filter by tag */
  tag?: string;
  /** Initial search query */
  searchQuery?: string;
}

/**
 * Hook for managing agents with Supabase
 *
 * @param userId - The current user's ID
 * @param options - Optional configuration
 * @returns Agent management functions and state
 *
 * @example
 * ```tsx
 * const { agents, loading, createAgent, deleteAgent } = useSupabaseAgents(user?.id);
 *
 * const handleCreate = async () => {
 *   await createAgent({
 *     name: 'My Agent',
 *     model: 'gpt-4',
 *     description: 'A helpful assistant',
 *   });
 * };
 * ```
 */
export function useSupabaseAgents(
  userId?: string,
  options: UseSupabaseAgentsOptions = {}
): UseSupabaseAgentsResult {
  const [agents, setAgents] = useState<AgentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all agents for the user
   */
  const fetchAgents = useCallback(async () => {
    if (!userId) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: AgentWithDetails[];

      if (options.searchQuery) {
        data = (await agentService.searchAgents(userId, options.searchQuery)) as AgentWithDetails[];
      } else if (options.tag) {
        data = (await agentService.getAgentsByTag(userId, options.tag)) as AgentWithDetails[];
      } else {
        data = await agentService.getAgents(userId);
      }

      // Filter out shared if not wanted
      if (options.includeShared === false) {
        data = data.filter((agent) => agent.user_id === userId);
      }

      setAgents(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(errorMessage);
      setAgents([]);
      logger.error('Failed to fetch agents', err);
    } finally {
      setLoading(false);
    }
  }, [userId, options.includeShared, options.tag, options.searchQuery]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  /**
   * Create a new agent
   */
  const createAgent = async (input: CreateAgentInput): Promise<Agent> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const created = await agentService.createAgent(input, userId);
    await fetchAgents();
    return created;
  };

  /**
   * Update an existing agent
   */
  const updateAgent = async (
    agentId: string,
    updates: UpdateAgentInput
  ): Promise<Agent> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updated = await agentService.updateAgent(agentId, userId, updates);
    await fetchAgents();
    return updated;
  };

  /**
   * Delete an agent
   */
  const deleteAgent = async (agentId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await agentService.deleteAgent(agentId, userId);
    await fetchAgents();
  };

  /**
   * Share an agent with other users
   */
  const shareAgent = async (
    agentId: string,
    userIds: string[]
  ): Promise<Agent> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updated = await agentService.shareAgent(agentId, userId, userIds);
    await fetchAgents();
    return updated;
  };

  /**
   * Unshare an agent from users
   */
  const unshareAgent = async (
    agentId: string,
    userIds: string[]
  ): Promise<Agent> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const updated = await agentService.unshareAgent(agentId, userId, userIds);
    await fetchAgents();
    return updated;
  };

  /**
   * Duplicate an agent
   */
  const duplicateAgent = async (agentId: string): Promise<Agent> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const duplicated = await agentService.duplicateAgent(agentId, userId);
    await fetchAgents();
    return duplicated;
  };

  /**
   * Search agents by query
   */
  const searchAgents = async (query: string): Promise<Agent[]> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return agentService.searchAgents(userId, query);
  };

  /**
   * Get agents by tag
   */
  const getAgentsByTag = async (tag: string): Promise<Agent[]> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return agentService.getAgentsByTag(userId, tag);
  };

  /**
   * Get a single agent by ID
   */
  const getAgent = async (agentId: string): Promise<Agent | null> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return agentService.getAgent(agentId, userId);
  };

  /**
   * Execute an agent with input
   */
  const executeAgent = async (
    agentId: string,
    input: { message: string; context?: Record<string, any>; stream?: boolean }
  ) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return agentService.executeAgent(agentId, userId, input);
  };

  /**
   * Test agent workflow without saving
   */
  const testAgentWorkflow = async (config: {
    model: string;
    systemPrompt?: string;
    workflowData?: AgentWorkflowData;
    testInput: string;
  }) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return agentService.testAgentWorkflow(userId, config);
  };

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    shareAgent,
    unshareAgent,
    duplicateAgent,
    searchAgents,
    getAgentsByTag,
    refetch: fetchAgents,
    getAgent,
    executeAgent,
    testAgentWorkflow,
  };
}

export default useSupabaseAgents;
