import { apiClient } from './api';
import supabaseClient from './supabaseClient';

export interface AutomationExecution {
  id: string;
  automation_id: string;
  user_email: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  input_data: any;
  output_data?: any;
  error_message?: string;
  metrics: {
    duration_ms: number;
    tokens_used: number;
    cost_usd: number;
  };
}

export interface Automation {
  id: string;
  user_email: string;
  name: string;
  description: string;
  agent_id: string;
  trigger_config: {
    type: 'schedule' | 'webhook' | 'manual' | 'event';
    config: any;
  };
  enabled: boolean;
  last_run_at?: string;
  total_runs: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

class AutomationService {
  async getAutomations(userEmail: string): Promise<Automation[]> {
    const { data, error } = await supabaseClient
      .from('automations')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAutomation(automation: Omit<Automation, 'id' | 'created_at' | 'updated_at' | 'total_runs' | 'success_rate'>, userEmail: string): Promise<Automation> {
    const { data, error } = await supabaseClient
      .from('automations')
      .insert({
        ...automation,
        user_email: userEmail,
        total_runs: 0,
        success_rate: 100
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async executeAutomation(automationId: string, input: any, userEmail: string): Promise<AutomationExecution> {
    const execution = {
      automation_id: automationId,
      user_email: userEmail,
      status: 'running' as const,
      started_at: new Date().toISOString(),
      input_data: input,
      metrics: { duration_ms: 0, tokens_used: 0, cost_usd: 0 }
    };

    const { data: execData, error: execError } = await supabaseClient
      .from('automation_executions')
      .insert(execution)
      .select()
      .single();

    if (execError) throw execError;

    try {
      const automation = await this.getAutomation(automationId, userEmail);
      if (!automation) throw new Error('Automation not found');

      const agent = await apiClient.getAgent(automation.agent_id);
      if (!agent) throw new Error('Agent not found');

      const result = await apiClient.createChatCompletion({
        model: agent.modelRouting.primary,
        messages: [
          { role: 'system', content: `You are ${agent.name}. Execute this automation task.` },
          { role: 'user', content: JSON.stringify(input) }
        ],
        temperature: 0.7,
        max_tokens: agent.runtime.maxTokens || 4000,
      });

      const completedAt = new Date().toISOString();
      const output = result.choices[0]?.message?.content;

      const { data, error } = await supabaseClient
        .from('automation_executions')
        .update({
          status: 'completed',
          completed_at: completedAt,
          output_data: output,
          metrics: {
            duration_ms: Date.now() - new Date(execData.started_at).getTime(),
            tokens_used: result.usage?.total_tokens || 0,
            cost_usd: (result.usage?.total_tokens || 0) * 0.0001
          }
        })
        .eq('id', execData.id)
        .select()
        .single();

      if (error) throw error;
      await this.updateAutomationStats(automationId, true);
      return data;
    } catch (error) {
      await supabaseClient
        .from('automation_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', execData.id);

      await this.updateAutomationStats(automationId, false);
      throw error;
    }
  }

  async getAutomation(id: string, userEmail: string): Promise<Automation | null> {
    const { data, error } = await supabaseClient
      .from('automations')
      .select('*')
      .eq('id', id)
      .eq('user_email', userEmail)
      .single();

    if (error) return null;
    return data;
  }

  private async updateAutomationStats(automationId: string, success: boolean): Promise<void> {
    await supabaseClient.rpc('update_automation_stats', {
      automation_id: automationId,
      success: success
    });
  }
}

export const automationService = new AutomationService();
