import { apiClient } from './api';
import supabaseClient from './supabaseClient';

export interface AutomationExecution {
  id: string;
  automationId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  input: any;
  output?: any;
  error?: string;
  metrics: {
    duration: number;
    tokensUsed: number;
    cost: number;
  };
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  agentId: string;
  enabled: boolean;
  lastRun?: Date;
  totalRuns: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

class AutomationService {
  async getAutomations(): Promise<Automation[]> {
    try {
      const agents = await apiClient.getAgents({ env: 'prod' });
      return agents.map(agent => ({
        id: `automation-${agent.id}`,
        name: `${agent.name} Automation`,
        description: `Automated workflow using ${agent.name} agent`,
        agentId: agent.id,
        enabled: Boolean(agent.published),
        lastRun: agent.published ? new Date(agent.published.at) : undefined,
        totalRuns: this.getStoredRuns(agent.id),
        successRate: this.getStoredSuccessRate(agent.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      console.error('Failed to fetch automations:', error);
      return [];
    }
  }

  private getStoredRuns(agentId: string): number {
    try {
      const stored = localStorage.getItem(`oneai.automation.${agentId}.runs`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private getStoredSuccessRate(agentId: string): number {
    try {
      const stored = localStorage.getItem(`oneai.automation.${agentId}.successRate`);
      return stored ? parseFloat(stored) : 100;
    } catch {
      return 100;
    }
  }

  async executeAutomation(automationId: string, input: any = {}): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: `exec-${Date.now()}`,
      automationId,
      status: 'running',
      startedAt: new Date(),
      input,
      metrics: { duration: 0, tokensUsed: 0, cost: 0 },
    };

    try {
      const agentId = automationId.replace('automation-', '');
      const agent = await apiClient.getAgent(agentId);
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

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.output = result.choices[0]?.message?.content;
      execution.metrics = {
        duration: execution.completedAt.getTime() - execution.startedAt.getTime(),
        tokensUsed: result.usage?.total_tokens || 0,
        cost: (result.usage?.total_tokens || 0) * 0.0001,
      };

      // Update metrics
      const currentRuns = this.getStoredRuns(agentId);
      localStorage.setItem(`oneai.automation.${agentId}.runs`, (currentRuns + 1).toString());

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return execution;
  }

  async createAutomation(automation: Partial<Automation>): Promise<Automation> {
    const agent = await apiClient.createAgent({
      name: automation.name || 'New Automation',
      owner: 'user',
      version: '1.0.0',
      modelRouting: { primary: 'nemotron-9b' },
      tools: [],
      datasets: [],
      runtime: { maxTokens: 4000, maxSeconds: 120, maxCostUSD: 1.0 },
      labels: ['automation'],
    });

    return {
      id: `automation-${agent.id}`,
      name: agent.name,
      description: automation.description || '',
      agentId: agent.id,
      enabled: Boolean(agent.published),
      totalRuns: 0,
      successRate: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteAutomation(automationId: string): Promise<void> {
    const agentId = automationId.replace('automation-', '');
    await apiClient.deleteAgent(agentId);
  }
}

export const automationService = new AutomationService();
