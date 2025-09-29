import { Node, Edge } from '@xyflow/react';
import { apiClient, Agent } from './api';

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

class AgentWorkflowService {
  // Convert ReactFlow graph to MCP Agent schema
  convertFlowToAgent(nodes: Node[], edges: Edge[], metadata: { name: string; owner: string }): Partial<Agent> {
    const entryNode = nodes.find(n => n.type === 'system');
    const tools = nodes.filter(n => n.type === 'tool').map(n => ({
      slug: n.data.toolType || 'custom',
      scopes: n.data.scopes || ['read']
    }));

    return {
      name: metadata.name,
      owner: metadata.owner,
      version: '1.0.0',
      modelRouting: {
        primary: 'nemotron-9b',
        fallbacks: ['mamba2-1.4b']
      },
      tools,
      datasets: [],
      runtime: {
        maxTokens: 4000,
        maxSeconds: 120,
        maxCostUSD: 1.0
      },
      labels: ['workflow', 'visual-editor'],
      // Store workflow in metadata
      metadata: {
        workflow: {
          nodes: nodes.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data
          })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle
          }))
        }
      }
    };
  }

  // Convert MCP Agent to ReactFlow graph
  convertAgentToFlow(agent: Agent): { nodes: Node[]; edges: Edge[] } {
    if (agent.metadata?.workflow) {
      return {
        nodes: agent.metadata.workflow.nodes || [],
        edges: agent.metadata.workflow.edges || []
      };
    }

    // Generate basic flow from agent configuration
    const nodes: Node[] = [
      {
        id: 'start',
        type: 'system',
        position: { x: 250, y: 50 },
        data: {
          label: 'System Prompt',
          content: `You are ${agent.name}, an AI agent.`
        }
      }
    ];

    // Add tool nodes
    agent.tools?.forEach((tool, index) => {
      nodes.push({
        id: `tool-${index}`,
        type: 'tool',
        position: { x: 100 + (index * 200), y: 200 },
        data: {
          label: tool.slug.toUpperCase(),
          toolType: tool.slug,
          scopes: tool.scopes
        }
      });
    });

    return { nodes, edges: [] };
  }

  async saveWorkflowAsAgent(workflow: AgentWorkflow): Promise<Agent> {
    const agentData = this.convertFlowToAgent(
      workflow.nodes, 
      workflow.edges, 
      { name: workflow.name, owner: 'user' }
    );

    if (workflow.agentId) {
      return await apiClient.updateAgent(workflow.agentId, agentData);
    } else {
      return await apiClient.createAgent(agentData);
    }
  }

  async executeWorkflow(nodes: Node[], edges: Edge[], input: any): Promise<any> {
    try {
      // Create temporary agent for execution
      const tempAgent = this.convertFlowToAgent(nodes, edges, { 
        name: 'Temp Workflow', 
        owner: 'temp' 
      });

      // Execute via chat completion
      const result = await apiClient.createChatCompletion({
        model: tempAgent.modelRouting?.primary || 'nemotron-9b',
        messages: [
          { role: 'system', content: 'Execute this workflow with the provided input.' },
          { role: 'user', content: JSON.stringify(input) }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      return {
        success: true,
        output: result.choices[0]?.message?.content,
        tokensUsed: result.usage?.total_tokens
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  // Get available node types for the palette
  getNodeTypes() {
    return [
      { type: 'system', label: 'System Prompt', category: 'Core' },
      { type: 'tool', label: 'Tool Call', category: 'Core' },
      { type: 'decision', label: 'Decision', category: 'Logic' },
      { type: 'memory', label: 'Memory', category: 'Data' },
      { type: 'retrieval', label: 'Retrieval', category: 'Data' },
      { type: 'webhook', label: 'Webhook', category: 'Integration' },
      { type: 'delay', label: 'Delay', category: 'Control' },
      { type: 'human', label: 'Human Input', category: 'Control' },
      { type: 'code', label: 'Code', category: 'Processing' },
      { type: 'router', label: 'Router', category: 'Logic' },
      { type: 'output', label: 'Output', category: 'Core' }
    ];
  }
}

export const agentWorkflowService = new AgentWorkflowService();
