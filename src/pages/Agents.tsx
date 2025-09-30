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
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Play, Save, Settings, Upload, Download, Users, Brain, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { agentWorkflowService } from "@/services/agentWorkflowService";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/services/api";

// Custom Node Components
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
  
  const { agents, loading: agentsLoading, createAgent, deleteAgent, refetch } = useAgents({ env: 'all' });
  const { models, loading: modelsLoading } = useModels();
  const user = useCurrentUser();
  const { toast } = useToast();

  // Initialize with first available model
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
      id: `${type}-${Date.now()}`,
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

    if (!selectedModel) {
      toast({
        title: "Model required",
        description: "Please select a model for your agent",
        variant: "destructive"
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Authentication required",
        description: "Please log in to create agents",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAgent(true);
    try {
      // Convert ReactFlow to agent config
      const agentConfig = agentWorkflowService.convertFlowToAgentConfig(nodes, edges);
      
      // Create agent via MCP API
      const newAgent = await createAgent({
        name: agentName.trim(),
        owner: user.email,
        version: '1.0.0',
        modelRouting: {
          primary: selectedModel,
          fallbacks: []
        },
        ...agentConfig,
        labels: ['workflow-agent']
      });

      // Save workflow to Supabase
      await agentWorkflowService.saveWorkflow({
        user_email: user.email,
        agent_id: newAgent.id,
        name: agentName.trim(),
        description: `Workflow for ${agentName.trim()}`,
        workflow_data: { nodes, edges }
      });

      toast({
        title: "Agent created successfully",
        description: `Agent "${agentName}" has been created and saved`
      });

      // Reset form
      setAgentName("");
      setNodes([]);
      setEdges([]);
      setSelectedAgent(newAgent);
      
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const loadAgent = async (agent: Agent) => {
    try {
      setSelectedAgent(agent);
      setAgentName(agent.name);
      setSelectedModel(agent.modelRouting.primary);

      // Convert agent to workflow
      const { nodes: agentNodes, edges: agentEdges } = agentWorkflowService.convertAgentToFlow(agent);
      setNodes(agentNodes);
      setEdges(agentEdges);

      toast({
        title: "Agent loaded",
        description: `Loaded workflow for "${agent.name}"`
      });
    } catch (error) {
      console.error('Failed to load agent:', error);
      toast({
        title: "Failed to load agent",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const executeAgent = async () => {
    if (!selectedAgent) {
      toast({
        title: "No agent selected",
        description: "Please select an agent to execute",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    try {
      const result = await agentWorkflowService.executeAgentWorkflow(
        selectedAgent.id, 
        { message: "Execute workflow test" }
      );

      toast({
        title: "Agent executed successfully",
        description: `Agent "${selectedAgent.name}" completed execution`
      });

      console.log('Execution result:', result);
    } catch (error) {
      console.error('Failed to execute agent:', error);
      toast({
        title: "Execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteSelectedAgent = async () => {
    if (!selectedAgent) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedAgent.name}"?`)) return;

    try {
      await deleteAgent(selectedAgent.id);
      toast({
        title: "Agent deleted",
        description: `Agent "${selectedAgent.name}" has been deleted`
      });
      
      // Reset UI
      setSelectedAgent(null);
      setAgentName("");
      setNodes([]);
      setEdges([]);
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({
        title: "Failed to delete agent",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-md border-b border-border-primary bg-surface-primary">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm">
            <Brain className="h-5 w-5 text-accent-blue" />
            <h1 className="text-lg font-semibold text-text-primary">Agent Builder</h1>
          </div>
          
          <div className="flex items-center gap-sm">
            <input
              type="text"
              placeholder="Agent name..."
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary text-sm w-48"
            />
            
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary text-sm"
              disabled={modelsLoading}
            >
              <option value="">Select Model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <Button
            onClick={saveAgent}
            disabled={isCreatingAgent || !agentName.trim() || !selectedModel}
            className="bg-accent-green text-white hover:bg-accent-green/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreatingAgent ? "Creating..." : "Save Agent"}
          </Button>
          
          <Button
            onClick={executeAgent}
            disabled={!selectedAgent || isExecuting}
            className="bg-accent-blue text-white hover:bg-accent-blue/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? "Executing..." : "Execute"}
          </Button>

          {selectedAgent && (
            <Button
              onClick={deleteSelectedAgent}
              variant="destructive"
              className="bg-accent-red text-white hover:bg-accent-red/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-surface-secondary border-r border-border-primary flex flex-col">
          {/* Node Palette */}
          <div className="p-md border-b border-border-primary">
            <h3 className="text-sm font-medium text-text-primary mb-md">Add Nodes</h3>
            <div className="grid grid-cols-2 gap-xs">
              {Object.keys(nodeTypes).map((type) => (
                <Button
                  key={type}
                  onClick={() => addNode(type)}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Existing Agents */}
          <div className="flex-1 p-md overflow-auto">
            <h3 className="text-sm font-medium text-text-primary mb-md">Your Agents</h3>
            {agentsLoading ? (
              <div className="text-sm text-text-secondary">Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="text-sm text-text-secondary">No agents yet</div>
            ) : (
              <div className="space-y-xs">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "p-sm rounded-lg cursor-pointer transition-colors",
                      selectedAgent?.id === agent.id
                        ? "bg-accent-blue/10 border border-accent-blue"
                        : "bg-surface-graphite hover:bg-surface-primary border border-transparent"
                    )}
                    onClick={() => loadAgent(agent)}
                  >
                    <div className="text-sm font-medium text-text-primary">{agent.name}</div>
                    <div className="text-xs text-text-secondary">
                      Model: {agent.modelRouting.primary}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {agent.published ? "Published" : "Draft"} • {agent.tools?.length || 0} tools
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Workflow Area */}
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
            <Background variant="dots" gap={20} size={1} className="opacity-20" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Brain className="h-16 w-16 text-text-quaternary mx-auto mb-md" />
                <h3 className="text-lg font-medium text-text-secondary mb-sm">
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
    </div>
  );
};

export default Agents;
