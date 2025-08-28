import { useState, useCallback } from "react";
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
import { Plus, Play, Save, Settings, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

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

const initialNodes: Node[] = [
  {
    id: "start",
    type: "system",
    position: { x: 250, y: 50 },
    data: { 
      label: "System Prompt",
      content: "You are a helpful AI assistant."
    },
  },
];

const initialEdges: Edge[] = [];

export default function Agents() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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

  const runAgent = () => {
    setIsRunning(true);
    // Simulate agent execution
    setTimeout(() => setIsRunning(false), 3000);
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
      {/* Left Panel - Node Palette */}
      <div className="w-80 flex-shrink-0 bg-surface-graphite/30 border-r border-border-primary/50 overflow-y-auto">
        <div className="p-lg">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-lg font-semibold text-text-primary">Node Palette</h2>
          </div>

          <div className="space-y-lg">
            {nodeCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-sm font-medium text-text-secondary mb-md">{category.title}</h3>
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

      {/* Center - Flow Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border-primary/50 p-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Agent Builder</h1>
              <p className="text-sm text-text-secondary">Drag nodes from the palette and connect them to build your agent</p>
            </div>

            <div className="flex items-center gap-sm">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-sm" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-sm" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-sm" />
                Save
              </Button>
              <Button 
                onClick={runAgent}
                disabled={isRunning}
                className={cn(isRunning && "animate-pulse")}
              >
                <Play className="h-4 w-4 mr-sm" />
                {isRunning ? "Running..." : "Run Agent"}
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

      {/* Right Panel - Node Inspector */}
      <div className="w-80 flex-shrink-0 bg-surface-graphite/30 border-l border-border-primary/50 overflow-y-auto">
        <div className="p-lg">
          <h2 className="text-lg font-semibold text-text-primary mb-lg">Node Inspector</h2>
          
          {selectedNode ? (
            <NodeInspector node={selectedNode} onUpdate={(data) => {
              setNodes((nds) => nds.map((node) => 
                node.id === selectedNode.id 
                  ? { ...node, data: { ...node.data, ...data } }
                  : node
              ));
            }} />
          ) : (
            <div className="text-center py-xl">
              <Settings className="h-8 w-8 text-text-quaternary mx-auto mb-md" />
              <p className="text-sm text-text-tertiary">Select a node to edit its properties</p>
            </div>
          )}
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