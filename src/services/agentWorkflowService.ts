import { Node, Edge } from '@xyflow/react';
import { apiClient, Agent } from './api';
import supabaseClient from './supabaseClient';

export interface AgentWorkflow {
  id: string;
  user_email: string;
  agent_id: string;
  name: string;
  description: string;
  workflow_data: {
    nodes: Node[];
    edges: Edge[];
  };
  created_at: string;
  updated_at: string;
}

class AgentWorkflowService {
  // Convert ReactFlow graph to MCP agent configuration
  convertFlowToAgentConfig(nodes: Node[], edges: Edge[]): Partial<Agent> {
    const tools: { slug: string; scopes: string[] }[] = [];
    const datasets: { id: string; access: 'read' | 'write' }[] = [];
    let systemPrompt = '';
    let modelRouting = { primary: 'nemotron-9b' };

    // Extract configuration from nodes
    nodes.forEach(node => {
      const data = node.data as Record<string, any>;
      switch (node.type) {
        case 'system':
          systemPrompt = String(data?.content || '');
          break;
        case 'tool':
          tools.push({
            slug: String(data?.toolName || 'http'),
            scopes: Array.isArray(data?.scopes) ? data.scopes : ['read']
          });
          break;
        case 'retrieval':
          datasets.push({
            id: String(data?.datasetId || 'default'),
            access: (data?.access === 'write' ? 'write' : 'read') as 'read' | 'write'
          });
          break;
        case 'router':
          if (data?.model) {
            modelRouting.primary = String(data.model);
          }
          break;
      }
    });

    return {
      tools,
      datasets,
      runtime: {
        maxTokens: 4000,
        maxSeconds: 120,
        maxCostUSD: 1.0
      }
    };
  }

  // Convert MCP agent to ReactFlow graph
  convertAgentToFlow(agent: Agent): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create system prompt node (agents don't have metadata.systemPrompt, use name as placeholder)
    nodes.push({
      id: 'system-1',
      type: 'system',
      position: { x: 100, y: 100 },
      data: {
        label: 'System Prompt',
        content: `You are ${agent.name}`
      }
    });

    // Create tool nodes
    agent.tools?.forEach((tool, index) => {
      nodes.push({
        id: `tool-${index}`,
        type: 'tool',
        position: { x: 100 + (index * 200), y: 200 },
        data: {
          label: tool.slug.toUpperCase(),
          toolName: tool.slug,
          scopes: tool.scopes
        }
      });
    });

    // Create dataset nodes
    agent.datasets?.forEach((dataset, index) => {
      nodes.push({
        id: `dataset-${index}`,
        type: 'retrieval',
        position: { x: 100 + (index * 200), y: 300 },
        data: {
          label: `Dataset: ${dataset.id}`,
          datasetId: dataset.id,
          access: dataset.access
        }
      });
    });

    // Create output node
    nodes.push({
      id: 'output-1',
      type: 'output',
      position: { x: 300, y: 400 },
      data: {
        label: 'Output',
        format: 'text'
      }
    });

    // Create basic edges connecting nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'smoothstep'
      });
    }

    return { nodes, edges };
  }

  async saveWorkflow(workflow: Omit<AgentWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<AgentWorkflow> {
    const { data, error } = await supabaseClient
      .from('agent_workflows')
      .insert(workflow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getWorkflows(userEmail: string): Promise<AgentWorkflow[]> {
    const { data, error } = await supabaseClient
      .from('agent_workflows')
      .select('*')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateWorkflow(id: string, userEmail: string, updates: Partial<AgentWorkflow>): Promise<AgentWorkflow> {
    const { data, error } = await supabaseClient
      .from('agent_workflows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async executeAgentWorkflow(agentId: string, input: any): Promise<any> {
    const agent = await apiClient.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    return await apiClient.createChatCompletion({
      model: agent.modelRouting.primary,
      messages: [
        { role: 'system', content: `You are ${agent.name}` },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.7,
      max_tokens: agent.runtime.maxTokens || 4000,
    });
  }
}

export const agentWorkflowService = new AgentWorkflowService();
