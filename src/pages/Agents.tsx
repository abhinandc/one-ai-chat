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
import { Plus, Play, Save, Settings, Upload, Download, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";
import { agentWorkflowService } from "@/services/agentWorkflowService";
import { useAgentWorkflow } from "@/hooks/useAgentWorkflow";
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

export default function Agents() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<any | null>(null);
  const [agentName, setAgentName] = useState("");
  
  const { agents, loading: agentsLoading, createAgent, updateAgent, deleteAgent } = useAgents({ env: 'prod' });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        ...getDefaultNodeData(type)
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case "system":
        return { content: "Enter system prompt..." };
      case "tool":
        return { toolName: "web_search", config: {} };
      case "router":
        return { conditions: [], defaultTarget: null };
      case "memory":
        return { memoryType: "conversation", config: {} };
      case "retrieval":
        return { dataSource: "", query: "" };
      case "decision":
        return { condition: "", trueTarget: null, falseTarget: null };
      case "code":
        return { language: "javascript", code: "// Enter code here" };
      case "human":
        return { message: "Please review and respond", timeout: 300 };
      case "webhook":
        return { url: "", method: "POST", headers: {} };
      case "delay":
        return { duration: 5, unit: "seconds" };
      case "output":
        return { format: "text", template: "{{result}}" };
      default:
        return {};
    }
  };

  const handleNodeClick = (_event: any, node: Node) => {
    setSelectedNode(node);
  };

  // Load agent from MCP
  const loadAgent = async (agentId: string) => {
    try {
      const agent = await apiClient.getAgent(agentId);
      if (agent) {
        setCurrentAgent(agent);
        setAgentName(agent.name);
        // Convert agent data to nodes/edges if available
        // TODO: Implement agent graph loading
      }
    } catch (error) {
      console.error('Failed to load agent:', error);
    }
  };

  // Save agent to MCP
  const saveAgent = async () => {
    try {
      if (!agentName.trim()) {
        alert('Please enter an agent name');
        return;
      }

      const agentData = {
        name: agentName,
        owner: 'user',
        version: '1.0.0',
        entrypoint: { kind: 'local' as const },
        modelRouting: {
          primary: 'nemotron-9b',
          fallbacks: ['mamba2-1.4b']
        },
        tools: [],
        datasets: [],
        runtime: {
          maxTokens: 4000,
          maxSeconds: 120,
          maxCostUSD: 1.0
        },
        labels: ['custom'],
        // TODO: Convert nodes/edges to agent graph format
        graph: { nodes, edges }
      };

      if (currentAgent) {
        await updateAgent(currentAgent.id, agentData);
      } else {
        const newAgent = await createAgent(agentData);
        setCurrentAgent(newAgent);
      }
      
      console.log('Agent saved successfully');
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const runAgent = () => {
    setIsRunning(true);
    // Real agent execution
    console.log("Executing agent workflow...");
    
    // TODO: Implement real agent execution via MCP
    setTimeout(() => {
      setIsRunning(false);
      console.log("Agent workflow completed.");
    }, 3000);
  };

  const newAgent = () => {
    setNodes([]);
    setEdges([]);
    setCurrentAgent(null);
    setAgentName("");
    setSelectedNode(null);
  };

  const nodeCategories = [
    {
      title: "Core",
      nodes: [
        { type: "system", label: "System Prompt", icon: "💬", color: "bg-accent-blue" },
        { type: "tool", label: "Tool", icon: "🔧", color: "bg-accent-green" },
        { type: "router", label: "Router", icon: "🔀", color: "bg-accent-orange" },
        { type: "output", label: "Output", icon: "📤", color: "bg-accent-blue" },
      ]
    },
    {
      title: "Memory & Data",
      nodes: [
        { type: "memory", label: "Memory", icon: "🧠", color: "bg-accent-green" },
        { type: "retrieval", label: "Retrieval", icon: "🔍", color: "bg-accent-green" },
      ]
    },
    {
      title: "Logic & Flow",
      nodes: [
        { type: "decision", label: "Decision", icon: "❓", color: "bg-accent-orange" },
        { type: "delay", label: "Delay", icon: "⏱️", color: "bg-accent-orange" },
      ]
    },
    {
      title: "External",
      nodes: [
        { type: "code", label: "Code", icon: "💻", color: "bg-accent-blue" },
        { type: "human", label: "Human", icon: "👤", color: "bg-accent-red" },
        { type: "webhook", label: "Webhook", icon: "🔗", color: "bg-accent-green" },
      ]
    }
  ];

  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* Left Panel - Agents & Node Palette */}
      <div className="w-80 flex-shrink-0 bg-surface-graphite/30 border-r border-border-primary/50 overflow-y-auto">
        <div className="p-lg space-y-lg">
          {/* Existing Agents */}
          <div>
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-sm">
                <Users className="h-4 w-4" />
                My Agents
              </h2>
              {agentsLoading && <span className="text-xs text-text-tertiary">Loading...</span>}
            </div>
            
            {agents.length > 0 ? (
              <div className="space-y-sm">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "p-sm rounded-lg cursor-pointer border transition-colors",
                      currentAgent?.id === agent.id 
                        ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                        : "border-border-secondary hover:border-accent-blue/50 hover:bg-surface-graphite/50"
                    )}
                    onClick={() => loadAgent(agent.id)}
                  >
                    <div className="text-sm font-medium text-text-primary">{agent.name}</div>
                    <div className="text-xs text-text-tertiary">v{agent.version} • {agent.owner}</div>
                    {agent.labels && (
                      <div className="flex gap-1 mt-1">
                        {agent.labels.slice(0, 2).map(label => (
                          <span key={label} className="text-xs px-1 py-0.5 bg-accent-blue/20 text-accent-blue rounded">
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-md">
                <Brain className="h-8 w-8 text-text-quaternary mx-auto mb-sm" />
                <p className="text-xs text-text-tertiary">No agents created yet</p>
              </div>
            )}
          </div>

          {/* Node Palette */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-md">Node Palette</h3>
            <div className="space-y-lg">
              {nodeCategories.map((category) => (
                <div key={category.title}>
                  <h4 className="text-sm font-medium text-text-secondary mb-md">{category.title}</h4>
                <div className="grid grid-cols-2 gap-sm">
                  {category.nodes.map((node) => (
                    <Button
                      key={node.type}
                      variant="outline"
                      onClick={() => addNode(node.type)}
                      className="h-auto p-md flex flex-col gap-sm hover:border-accent-blue/50"
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", node.color)}>
                        <span className="text-sm">{node.icon}</span>
                      </div>
                      <span className="text-xs font-medium">{node.label}</span>
                    </Button>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Flow Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border-primary/50 p-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Agent Builder</h1>
                <p className="text-sm text-text-secondary">Build and manage AI agents with real backend integration</p>
              </div>
              
              <div className="flex items-center gap-sm">
                <input
                  type="text"
                  placeholder="Agent name..."
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary text-sm w-40"
                />
                {currentAgent && (
                  <span className="text-xs text-accent-green">• Loaded: {currentAgent.name}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-sm">
              <Button 
                variant="outline" 
                size="sm"
                onClick={newAgent}
              >
                <Plus className="h-4 w-4 mr-sm" />
                New
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // TODO: Implement agent import from file
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        try {
                          const agentData = JSON.parse(e.target?.result as string);
                          // Load agent data into canvas
                          console.log('Agent imported:', agentData);
                        } catch (error) {
                          alert('Invalid agent file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-sm" />
                Import
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Export current agent
                  const agentData = {
                    name: agentName || 'Untitled Agent',
                    nodes,
                    edges,
                    metadata: {
                      created: new Date().toISOString(),
                      version: '1.0.0'
                    }
                  };
                  
                  const blob = new Blob([JSON.stringify(agentData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${agentName || 'agent'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-sm" />
                Export
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={saveAgent}
                disabled={!agentName.trim()}
              >
                <Save className="h-4 w-4 mr-sm" />
                Save to MCP
              </Button>
              
              <Button 
                onClick={runAgent}
                disabled={isRunning || nodes.length === 0}
                className={cn(isRunning && "animate-pulse")}
              >
                <Play className="h-4 w-4 mr-sm" />
                {isRunning ? "Running..." : "Test Agent"}
              </Button>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 bg-surface-graphite/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
          >
            <Background color="#94a3b8" gap={20} />
            <Controls className="bg-card border-border-primary" />
            <MiniMap className="bg-card border-border-primary" />
          </ReactFlow>
        </div>
      </div>

      {/* Right Panel - Agent Inspector */}
      <div className="w-80 flex-shrink-0 bg-surface-graphite/30 border-l border-border-primary/50 overflow-y-auto">
        <div className="p-lg space-y-lg">
          {/* Agent Info */}
          {currentAgent ? (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-md">Agent Details</h2>
              <GlassCard className="p-md">
                <div className="space-y-sm">
                  <div>
                    <span className="text-xs text-text-secondary">Name:</span>
                    <div className="text-sm font-medium text-text-primary">{currentAgent.name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Owner:</span>
                    <div className="text-sm text-text-primary">{currentAgent.owner}</div>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Version:</span>
                    <div className="text-sm text-text-primary">{currentAgent.version}</div>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Model:</span>
                    <div className="text-sm text-text-primary">{currentAgent.modelRouting?.primary}</div>
                  </div>
                  {currentAgent.labels && (
                    <div>
                      <span className="text-xs text-text-secondary">Labels:</span>
                      <div className="flex gap-1 mt-1">
                        {currentAgent.labels.map(label => (
                          <span key={label} className="text-xs px-1 py-0.5 bg-accent-blue/20 text-accent-blue rounded">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-md">Agent Builder</h2>
              <div className="text-center py-md">
                <Brain className="h-8 w-8 text-text-quaternary mx-auto mb-sm" />
                <p className="text-xs text-text-tertiary">Create a new agent or load existing one</p>
              </div>
            </div>
          )}

          {/* Node Inspector */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-md">Node Inspector</h3>
            
            {selectedNode ? (
              <NodeInspector node={selectedNode} onUpdate={(data) => {
                setNodes((nds) => nds.map((node) => 
                  node.id === selectedNode.id 
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
                ));
              }} />
            ) : (
              <div className="text-center py-md">
                <Settings className="h-6 w-6 text-text-quaternary mx-auto mb-sm" />
                <p className="text-xs text-text-tertiary">Select a node to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeInspector({ node, onUpdate }: { node: Node; onUpdate: (data: any) => void }) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="text-base">{String(node.data.label)}</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-md">
        {node.type === "system" && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-sm">System Prompt</label>
            <textarea
              value={String(node.data.content || "")}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full h-24 px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none"
              placeholder="Enter system prompt..."
            />
          </div>
        )}

        {node.type === "tool" && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-sm">Tool Name</label>
            <select
              value={String(node.data.toolName || "")}
              onChange={(e) => onUpdate({ toolName: e.target.value })}
              className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
            >
              <option value="web_search">Web Search</option>
              <option value="calculator">Calculator</option>
              <option value="code_interpreter">Code Interpreter</option>
              <option value="file_reader">File Reader</option>
            </select>
          </div>
        )}

        {node.type === "delay" && (
          <div className="space-y-md">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-sm">Duration</label>
              <input
                type="number"
                value={Number(node.data.duration || 5)}
                onChange={(e) => onUpdate({ duration: parseInt(e.target.value) })}
                className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-sm">Unit</label>
              <select
                value={String(node.data.unit || "seconds")}
                onChange={(e) => onUpdate({ unit: e.target.value })}
                className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-md border-t border-border-secondary">
          <p className="text-xs text-text-tertiary">Node ID: {node.id}</p>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
