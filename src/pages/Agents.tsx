import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Play, Save, Settings, Brain, Trash2, Edit, ExternalLink, Link2, Power, PowerOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { agentWorkflowService } from "@/services/agentWorkflowService";
import { useToast } from "@/hooks/use-toast";
import { useN8NWorkflows } from "@/hooks/useN8NWorkflows";
import { n8nService } from "@/services/n8nService";
import { Badge } from "@/components/ui/badge";

import { SystemNode } from "@/components/agents/nodes/SystemNode";
import { ToolNode } from "@/components/agents/nodes/ToolNode";
import { RouterNode } from "@/components/agents/nodes/RouterNode";
import { MemoryNode } from "@/components/agents/nodes/MemoryNode";
import { RetrievalNode } from "@/components/agents/nodes/RetrievalNode";
import { DecisionNode } from "@/components/agents/nodes/DecisionNode";
import { CodeNode } from "@/components/agents/nodes/CodeNode";
import { HumanNode } from "@/components/agents/nodes/HumanNode";
import { WebhookNode } from "@/components/agents/nodes/WebhookNode";
import { DelayNode } from "@/components/agents/nodes/DelayNode";
import { OutputNode } from "@/components/agents/nodes/OutputNode";

const nodeTypes = {
  system: SystemNode,
  tool: ToolNode,
  router: RouterNode,
  memory: MemoryNode,
  retrieval: RetrievalNode,
  decision: DecisionNode,
  code: CodeNode,
  human: HumanNode,
  webhook: WebhookNode,
  delay: DelayNode,
  output: OutputNode,
};

interface Agent {
  id: string;
  name: string;
  owner: string;
  version: string;
  modelRouting: {
    primary: string;
    fallbacks?: string[];
  };
  tools: Array<{
    slug: string;
    scopes: string[];
  }>;
  datasets: Array<{
    id: string;
    access: 'read' | 'write';
  }>;
  published?: {
    env: string;
    at: string;
  };
}

const Agents = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'n8n' | 'custom'>('n8n');
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  
  const { agents, loading: agentsLoading, createAgent, deleteAgent, refetch } = useAgents({ env: 'all' });
  const { models, loading: modelsLoading } = useModels();
  const user = useCurrentUser();
  const { toast } = useToast();
  const { workflows: n8nWorkflows, loading: n8nLoading, error: n8nError, hasCredentials, refetch: refetchN8N, toggleActive } = useN8NWorkflows();

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: \`\${type}-\${Date.now()}\`,
      type,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        ...(type === 'system' && { content: '' }),
        ...(type === 'tool' && { toolName: 'http', scopes: ['read'] }),
        ...(type === 'router' && { model: selectedModel }),
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, selectedModel]);

  const saveAgent = async () => {
    if (!agentName.trim()) {
      toast({
        title: "Agent name required",
        description: "Please enter a name for your agent",
        variant: "destructive"
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save agents",
        variant: "destructive"
      });
      return;
    }

    try {
      await agentWorkflowService.saveWorkflow({
        user_email: user.email,
        name: agentName,
        nodes: nodes as any,
        edges: edges as any,
        model_id: selectedModel,
        is_active: false,
      });

      toast({
        title: "Agent saved",
        description: "Your agent workflow has been saved successfully"
      });
      
      setAgentName("");
      setNodes([]);
      setEdges([]);
      refetch();
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Could not save agent",
        variant: "destructive"
      });
    }
  };

  const handleOpenN8NEditor = (workflowId: string) => {
    const url = n8nService.getN8NEditorUrl(workflowId);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleToggleN8NWorkflow = async (workflowId: string, currentActive: boolean) => {
    setTogglingWorkflow(workflowId);
    try {
      await toggleActive(workflowId, !currentActive);
      toast({
        title: currentActive ? "Workflow deactivated" : "Workflow activated",
        description: \`The workflow has been \${currentActive ? 'deactivated' : 'activated'}\`,
      });
    } catch (error) {
      toast({
        title: "Failed to toggle workflow",
        description: error instanceof Error ? error.message : "Could not toggle workflow",
        variant: "destructive"
      });
    } finally {
      setTogglingWorkflow(null);
    }
  };

  const openIntegrationsModal = () => {
    window.dispatchEvent(new CustomEvent('open-integrations'));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col bg-surface-primary">
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Agents</h1>
          <p className="text-sm text-text-secondary">Manage your AI agent workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-primary overflow-hidden">
            <button
              onClick={() => setActiveTab('n8n')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'n8n' 
                  ? "bg-accent-blue text-white" 
                  : "bg-surface-secondary text-text-secondary hover:text-text-primary"
              )}
              data-testid="tab-n8n"
            >
              N8N Workflows
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === 'custom' 
                  ? "bg-accent-blue text-white" 
                  : "bg-surface-secondary text-text-secondary hover:text-text-primary"
              )}
              data-testid="tab-custom"
            >
              Custom Builder
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'n8n' ? (
        <div className="flex-1 overflow-auto p-6">
          {!hasCredentials ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Link2 className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Connect to N8N
                </h2>
                <p className="text-text-secondary mb-6">
                  Connect your N8N instance to sync and manage your automation workflows directly from OneEdge.
                </p>
                <Button onClick={openIntegrationsModal} data-testid="button-connect-n8n">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect N8N
                </Button>
              </div>
            </div>
          ) : n8nLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
            </div>
          ) : n8nError ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">Failed to load workflows: {n8nError}</div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={refetchN8N}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={openIntegrationsModal}>
                    <Settings className="h-4 w-4 mr-2" />
                    Check Settings
                  </Button>
                </div>
              </div>
            </div>
          ) : n8nWorkflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Brain className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  No Workflows Found
                </h2>
                <p className="text-text-secondary mb-6">
                  No workflows found in your N8N instance. Create workflows in N8N and they will appear here.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={refetchN8N}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={() => {
                    const url = n8nService.getCredentials()?.url;
                    if (url) window.open(url, '_blank');
                  }}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open N8N
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-text-primary">
                  Your N8N Workflows ({n8nWorkflows.length})
                </h2>
                <Button variant="outline" size="sm" onClick={refetchN8N}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {n8nWorkflows.map((workflow) => (
                  <GlassCard 
                    key={workflow.id} 
                    className="overflow-visible"
                    data-testid={\`card-workflow-\${workflow.id}\`}
                  >
                    <GlassCardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-text-primary truncate">{workflow.name}</h3>
                          <p className="text-xs text-text-tertiary mt-1">
                            Updated {formatDate(workflow.updatedAt)}
                          </p>
                        </div>
                        <Badge 
                          variant={workflow.active ? "default" : "secondary"}
                          className={cn(
                            "shrink-0",
                            workflow.active ? "bg-green-500/10 text-green-500" : ""
                          )}
                        >
                          {workflow.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      {workflow.tags && workflow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {workflow.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {workflow.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{workflow.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenN8NEditor(workflow.id)}
                          data-testid={\`button-edit-workflow-\${workflow.id}\`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit in N8N
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleN8NWorkflow(workflow.id, workflow.active)}
                          disabled={togglingWorkflow === workflow.id}
                          data-testid={\`button-toggle-workflow-\${workflow.id}\`}
                        >
                          {togglingWorkflow === workflow.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : workflow.active ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-border-primary flex flex-col">
            <div className="p-4 border-b border-border-primary">
              <h3 className="font-medium text-text-primary mb-3">Add Nodes</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(nodeTypes).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addNode(type)}
                    className="text-xs justify-start"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-border-primary">
              <h3 className="font-medium text-text-primary mb-3">Save Agent</h3>
              <input
                type="text"
                placeholder="Agent name..."
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border-primary rounded-md text-text-primary mb-2"
                data-testid="input-agent-name"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={saveAgent}
                disabled={!agentName.trim() || nodes.length === 0}
                data-testid="button-save-agent"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Agent
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <h3 className="font-medium text-text-primary mb-3">Saved Agents</h3>
              {agentsLoading ? (
                <div className="text-sm text-text-tertiary">Loading...</div>
              ) : agents.length === 0 ? (
                <div className="text-sm text-text-tertiary">No agents yet</div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent: Agent) => (
                    <div
                      key={agent.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedAgent?.id === agent.id
                          ? "border-accent-blue bg-accent-blue/10"
                          : "border-border-primary hover:bg-surface-secondary"
                      )}
                      onClick={() => setSelectedAgent(agent)}
                      data-testid={\`agent-item-\${agent.id}\`}
                    >
                      <div className="font-medium text-text-primary text-sm">{agent.name}</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        Model: {agent.modelRouting.primary}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {agent.published ? "Published" : "Draft"} - {agent.tools?.length || 0} tools
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-surface-primary"
            >
              <Controls className="bg-surface-secondary border-border-primary" />
              <MiniMap className="bg-surface-secondary border-border-primary" />
              <Background gap={20} size={1} className="opacity-20" />
            </ReactFlow>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Brain className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-secondary mb-2">
                    Start Building Your Agent
                  </h3>
                  <p className="text-text-tertiary max-w-md">
                    Add nodes from the sidebar to create your agent workflow. 
                    Connect them to define the agent's behavior and capabilities.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
