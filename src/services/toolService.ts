import { apiClient } from './api';
import supabaseClient from './supabaseClient';

export interface ToolInstallation {
  id: string;
  user_email: string;
  tool_name: string;
  agent_id: string;
  configuration: any;
  installed_at: string;
  status: 'active' | 'inactive' | 'error';
}

export interface ToolSubmission {
  id: string;
  user_email: string;
  name: string;
  description: string;
  category: string;
  implementation: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

class ToolService {
  async getInstalledTools(userEmail: string): Promise<ToolInstallation[]> {
    const { data, error } = await supabaseClient
      .from('tool_installations')
      .select('*')
      .eq('user_email', userEmail)
      .order('installed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async installTool(toolName: string, userEmail: string, config: any): Promise<ToolInstallation> {
    // Create agent with the tool
    const agent = await apiClient.createAgent({
      name: `${toolName} Agent`,
      owner: userEmail,
      version: '1.0.0',
      modelRouting: {
        primary: config.model || 'nemotron-9b'
      },
      tools: [{
        slug: toolName.toLowerCase(),
        scopes: config.scopes || ['read']
      }],
      runtime: {
        maxTokens: 4000,
        maxSeconds: 120,
        maxCostUSD: 1.0
      },
      labels: ['tool-agent', toolName.toLowerCase()]
    });

    // Record installation
    const { data, error } = await supabaseClient
      .from('tool_installations')
      .insert({
        user_email: userEmail,
        tool_name: toolName,
        agent_id: agent.id,
        configuration: config,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async uninstallTool(installationId: string, userEmail: string): Promise<void> {
    const installation = await this.getToolInstallation(installationId, userEmail);
    if (!installation) throw new Error('Installation not found');

    // Delete the agent
    await apiClient.deleteAgent(installation.agent_id);

    // Remove installation record
    const { error } = await supabaseClient
      .from('tool_installations')
      .delete()
      .eq('id', installationId)
      .eq('user_email', userEmail);

    if (error) throw error;
  }

  async getToolInstallation(id: string, userEmail: string): Promise<ToolInstallation | null> {
    const { data, error } = await supabaseClient
      .from('tool_installations')
      .select('*')
      .eq('id', id)
      .eq('user_email', userEmail)
      .single();

    if (error) return null;
    return data;
  }

  async submitTool(submission: Omit<ToolSubmission, 'id' | 'submitted_at' | 'status'>): Promise<ToolSubmission> {
    const { data, error } = await supabaseClient
      .from('tool_submissions')
      .insert({
        ...submission,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getToolSubmissions(userEmail: string): Promise<ToolSubmission[]> {
    const { data, error } = await supabaseClient
      .from('tool_submissions')
      .select('*')
      .eq('user_email', userEmail)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const toolService = new ToolService();
