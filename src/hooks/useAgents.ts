import { useState, useEffect } from 'react';
import { apiClient, Agent } from '../services/api';
import { logger } from '@/lib/logger';

export interface UseAgentsOptions {
  env?: string;
  labels?: string;
  subject?: string;
}

export interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAgent: (agent: Partial<Agent>) => Promise<Agent>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  publishAgent: (id: string, env: string, by: string) => Promise<Agent>;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAgents(options);
      setAgents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(errorMessage);
      logger.error('Failed to fetch agents', err);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agent: Partial<Agent>): Promise<Agent> => {
    try {
      const newAgent = await apiClient.createAgent(agent);
      setAgents(prev => [newAgent, ...prev]);
      return newAgent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent';
      setError(errorMessage);
      throw err;
    }
  };

  const updateAgent = async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    try {
      const updatedAgent = await apiClient.updateAgent(id, agent);
      setAgents(prev => prev.map(a => a.id === id ? updatedAgent : a));
      return updatedAgent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAgent = async (id: string): Promise<void> => {
    try {
      await apiClient.deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent';
      setError(errorMessage);
      throw err;
    }
  };

  const publishAgent = async (id: string, env: string, by: string): Promise<Agent> => {
    try {
      const publishedAgent = await apiClient.publishAgent(id, env, by);
      setAgents(prev => prev.map(a => a.id === id ? publishedAgent : a));
      return publishedAgent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish agent';
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [options.env, options.labels, options.subject]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    publishAgent,
  };
}

// Transform MCP agent to UI format
export function transformAgentForUI(mcpAgent: Agent) {
  return {
    id: mcpAgent.id,
    name: mcpAgent.name,
    description: `Owner: ${mcpAgent.owner} | Version: ${mcpAgent.version}`,
    graph: {
      nodes: [],
      edges: [],
    },
    environment: mcpAgent.published?.env || 'dev' as const,
    status: mcpAgent.published ? 'published' as const : 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}


