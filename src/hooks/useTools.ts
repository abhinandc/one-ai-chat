import { useState, useEffect } from 'react';
import { toolService, ToolInstallation, ToolSubmission } from '../services/toolService';
import supabaseClient from '../services/supabaseClient';

// Define Tool type locally since it's not exported from toolService
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
}

export interface UseToolsResult {
  tools: ToolInstallation[];
  loading: boolean;
  error: string | null;
  installTool: (toolSlug: string, config: any) => Promise<ToolInstallation>;
  uninstallTool: (installationId: string) => Promise<void>;
  getToolUsage: (toolSlug: string) => Promise<any>;
  submitNewTool: (tool: Omit<ToolSubmission, 'id' | 'submitted_at' | 'status'>) => Promise<ToolSubmission>;
  refetch: () => Promise<void>;
}

export function useTools(userEmail?: string): UseToolsResult {
  const [tools, setTools] = useState<ToolInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    if (!userEmail) {
      setTools([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await toolService.getInstalledTools(userEmail);
      setTools(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tools';
      setError(errorMessage);
      console.error('Failed to fetch tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const installTool = async (toolSlug: string, config: any): Promise<ToolInstallation> => {
    if (!userEmail) throw new Error('User email required');
    
    try {
      const result = await toolService.installTool(toolSlug, userEmail, config);
      await fetchTools();
      return result;
    } catch (error) {
      console.error('Failed to install tool:', error);
      throw error;
    }
  };

  const uninstallTool = async (installationId: string): Promise<void> => {
    if (!userEmail) throw new Error('User email required');
    
    try {
      await toolService.uninstallTool(installationId, userEmail);
      await fetchTools();
    } catch (error) {
      console.error('Failed to uninstall tool:', error);
      throw error;
    }
  };

  const getToolUsage = async (toolSlug: string): Promise<any> => {
    if (!userEmail) throw new Error('User email required');
    
    try {
      // Get usage stats from tool installations
      const { data, error } = await supabaseClient
        .from('tool_installations')
        .select('*')
        .eq('user_email', userEmail)
        .eq('tool_name', toolSlug)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get tool usage:', error);
      throw error;
    }
  };

  const submitNewTool = async (tool: Omit<ToolSubmission, 'id' | 'submitted_at' | 'status'>): Promise<ToolSubmission> => {
    try {
      const newTool = await toolService.submitTool(tool);
      await fetchTools();
      return newTool;
    } catch (error) {
      console.error('Failed to submit tool:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTools();
  }, [userEmail]);

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
