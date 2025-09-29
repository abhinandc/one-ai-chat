import { useState, useEffect } from 'react';
import { toolService, Tool } from '../services/toolService';

export interface UseToolsResult {
  tools: Tool[];
  loading: boolean;
  error: string | null;
  installTool: (toolSlug: string, config: any) => Promise<any>;
  uninstallTool: (toolSlug: string, agentId: string) => Promise<void>;
  getToolUsage: (toolSlug: string) => Promise<any>;
  submitNewTool: (tool: any) => Promise<Tool>;
  refetch: () => Promise<void>;
}

export function useTools(): UseToolsResult {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await toolService.getAvailableTools();
      setTools(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tools';
      setError(errorMessage);
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const installTool = async (toolSlug: string, config: any) => {
    try {
      const result = await toolService.installTool(toolSlug, config);
      await fetchTools();
      return result;
    } catch (error) {
      console.error('Failed to install tool:', error);
      throw error;
    }
  };

  const uninstallTool = async (toolSlug: string, agentId: string) => {
    try {
      await toolService.uninstallTool(toolSlug, agentId);
      await fetchTools();
    } catch (error) {
      console.error('Failed to uninstall tool:', error);
      throw error;
    }
  };

  const getToolUsage = async (toolSlug: string) => {
    try {
      return await toolService.getToolUsage(toolSlug);
    } catch (error) {
      console.error('Failed to get tool usage:', error);
      throw error;
    }
  };

  const submitNewTool = async (tool: any) => {
    try {
      const newTool = await toolService.submitNewTool(tool);
      await fetchTools();
      return newTool;
    } catch (error) {
      console.error('Failed to submit tool:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  return {
    tools,
    loading,
    error,
    installTool,
    uninstallTool,
    getToolUsage,
    submitNewTool,
    refetch: fetchTools,
  };
}
