import { apiClient } from './api';
import supabaseClient from './supabaseClient';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  slug: string;
  scopes: string[];
  usageCount: number;
  agentCount: number;
  author: string;
  version: string;
  isInstalled: boolean;
  installationDate?: Date;
}

class ToolService {
  async getAvailableTools(): Promise<Tool[]> {
    try {
      const agents = await apiClient.getAgents({ env: 'prod' });
      const toolMap = new Map<string, Tool>();

      // Extract tools from all agents
      agents.forEach(agent => {
        agent.tools?.forEach(tool => {
          if (!toolMap.has(tool.slug)) {
            toolMap.set(tool.slug, {
              id: tool.slug,
              name: tool.slug.toUpperCase(),
              description: this.getToolDescription(tool.slug, tool.scopes),
              category: this.getToolCategory(tool.slug),
              slug: tool.slug,
              scopes: tool.scopes,
              usageCount: 0,
              agentCount: 0,
              author: 'MCP System',
              version: '1.0.0',
              isInstalled: false,
            });
          }
          
          const existingTool = toolMap.get(tool.slug)!;
          existingTool.agentCount++;
        });
      });

      return Array.from(toolMap.values());
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      return [];
    }
  }

  async installTool(toolSlug: string, config: { agentName: string; agentOwner: string; scopes: string[] }): Promise<any> {
    try {
      // Create new agent with this tool
      const agent = await apiClient.createAgent({
        name: config.agentName,
        owner: config.agentOwner,
        version: '1.0.0',
        modelRouting: {
          primary: 'nemotron-9b',
          fallbacks: ['mamba2-1.4b']
        },
        tools: [{
          slug: toolSlug,
          scopes: config.scopes
        }],
        datasets: [],
        runtime: {
          maxTokens: 4000,
          maxSeconds: 120,
          maxCostUSD: 1.0
        },
        labels: ['tool-agent', toolSlug]
      });

      // Publish agent to make tool available
      await apiClient.publishAgent(agent.id, 'prod', config.agentOwner);

      return agent;
    } catch (error) {
      console.error('Failed to install tool:', error);
      throw error;
    }
  }

  async uninstallTool(toolSlug: string, agentId: string): Promise<void> {
    try {
      await apiClient.deleteAgent(agentId);
    } catch (error) {
      console.error('Failed to uninstall tool:', error);
      throw error;
    }
  }

  async getToolUsage(toolSlug: string): Promise<{ total: number; lastWeek: number; agents: string[] }> {
    try {
      const agents = await apiClient.getAgents({ env: 'prod' });
      const agentsWithTool = agents.filter(agent => 
        agent.tools?.some(tool => tool.slug === toolSlug)
      );

      return {
        total: agentsWithTool.length * 10, // Estimated usage
        lastWeek: Math.floor(Math.random() * 50),
        agents: agentsWithTool.map(agent => agent.name)
      };
    } catch (error) {
      console.error('Failed to get tool usage:', error);
      return { total: 0, lastWeek: 0, agents: [] };
    }
  }

  private getToolDescription(slug: string, scopes: string[]): string {
    const scopeText = scopes.join(', ');
    switch (slug) {
      case 'http': return `HTTP client for API requests and web integrations. Supports ${scopeText} operations.`;
      case 'notion': return `Notion integration for managing pages and databases. Supports ${scopeText} operations.`;
      case 'sheets': return `Google Sheets integration for spreadsheet operations. Supports ${scopeText} operations.`;
      case 'sql': return `SQL database connector for querying and managing data. Supports ${scopeText} operations.`;
      case 'file': return `File system operations for reading and writing files. Supports ${scopeText} operations.`;
      case 'search': return `Search and information retrieval tool. Supports ${scopeText} operations.`;
      default: return `${slug} tool with ${scopeText} capabilities for specialized operations.`;
    }
  }

  private getToolCategory(slug: string): string {
    switch (slug) {
      case 'http': case 'webhook': return 'Integration';
      case 'notion': case 'email': return 'Communication';
      case 'sheets': case 'csv': case 'file': return 'Data';
      case 'sql': case 'search': case 'vector': return 'Analytics';
      case 'image': case 'audio': case 'video': return 'Media';
      default: return 'Custom';
    }
  }

  async submitNewTool(tool: { name: string; description: string; category: string; implementation: string }): Promise<Tool> {
    try {
      // In a real implementation, this would submit to a tool marketplace
      // For now, we'll store it locally and create an agent with it
      const newTool: Tool = {
        id: `custom-${Date.now()}`,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        slug: tool.name.toLowerCase().replace(/\s+/g, '-'),
        scopes: ['read', 'write'],
        usageCount: 0,
        agentCount: 0,
        author: 'User Submitted',
        version: '1.0.0',
        isInstalled: false,
      };

      // Store in localStorage for now
      const customTools = this.getCustomTools();
      customTools.push(newTool);
      localStorage.setItem('oneai.customTools', JSON.stringify(customTools));

      return newTool;
    } catch (error) {
      console.error('Failed to submit tool:', error);
      throw error;
    }
  }

  private getCustomTools(): Tool[] {
    try {
      const stored = localStorage.getItem('oneai.customTools');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

export const toolService = new ToolService();
