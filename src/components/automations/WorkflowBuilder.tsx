import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Play, Square, GitBranch, Bot, MessageSquare, Webhook,
  Clock, Code, Mail, Zap, X, Cpu, Workflow,
  Settings, Sparkles, Send, FolderOpen, FileText,
  Calendar, Bug, Link2, Database, ArrowLeft
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom node components
import {
  StartNode, EndNode, AgentNode, ConditionNode, ActionNode, ModelNode,
  SelectAgentNode, SendMessageNode, GmailNode, DriveNode, DocsNode,
  CalendarNode, GoogleChatNode, JiraNode, SlackNode, WebhookNode,
  DatabaseNode, DelayNode, CodeNode
} from './WorkflowNodes';

interface WorkflowNodeData extends Record<string, unknown> {
  label?: string;
  agentId?: string;
  model?: string;
  systemPrompt?: string;
  action?: string;
  config?: string;
}

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  selectAgent: SelectAgentNode,
  condition: ConditionNode,
  action: ActionNode,
  model: ModelNode,
  sendMessage: SendMessageNode,
  gmail: GmailNode,
  drive: DriveNode,
  docs: DocsNode,
  calendar: CalendarNode,
  googleChat: GoogleChatNode,
  jira: JiraNode,
  slack: SlackNode,
  webhook: WebhookNode,
  database: DatabaseNode,
  delay: DelayNode,
  code: CodeNode,
};

const TOOL_PALETTE = [
  { group: 'Logic', icon: GitBranch, color: 'text-amber-400', items: [
      { id: 'start', label: 'Start', type: 'start', icon: Play },
      { id: 'condition', label: 'If/Else', type: 'condition', icon: GitBranch },
      { id: 'loop', label: 'Loop', type: 'loop', icon: Workflow },
      { id: 'delay', label: 'Delay', type: 'delay', icon: Clock },
      { id: 'end', label: 'End', type: 'end', icon: Square },
  ]},
  { group: 'AI & Code', icon: Sparkles, color: 'text-purple-400', items: [
      { id: 'agent', label: 'Ai Agent', type: 'agent', icon: Bot },
      { id: 'model', label: 'LLM Node', type: 'model', icon: Cpu },
      { id: 'code', label: 'JS Code', type: 'code', icon: Code },
  ]},
  { group: 'Integrations', icon: Link2, color: 'text-blue-400', items: [
      { id: 'gmail', label: 'Gmail', type: 'gmail', icon: Mail },
      { id: 'slack', label: 'Slack', type: 'slack', icon: MessageSquare },
      { id: 'webhook', label: 'Webhook', type: 'webhook', icon: Webhook },
      { id: 'db', label: 'Database', type: 'database', icon: Database },
  ]}
];

// Custom Animated Edge Component with gradient animation
const AnimatedGradientEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  // Get edge color from data or use default
  const edgeColor = (data as { color?: string })?.color || '#3b82f6';
  const gradientId = `gradient-${id}`;

  return (
    <>
      {/* Background path for visibility */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeOpacity: 0.15, stroke: '#fff', strokeWidth: 2 }}
      />
      {/* Animated gradient path */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={2}
        stroke={`url(#${gradientId})`}
        strokeLinecap="round"
        className="react-flow__edge-path"
      />
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={edgeColor} stopOpacity="0">
            <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor={edgeColor} stopOpacity="1">
            <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor={edgeColor} stopOpacity="0">
            <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
    </>
  );
};

const edgeTypes = {
  animated: AnimatedGradientEdge,
};

interface WorkflowBuilderProps {
  onSave?: (workflow: { nodes: Node[]; edges: Edge[] }) => void;
  onClose?: () => void;
  initialWorkflow?: { nodes: Node[]; edges: Edge[] };
}

export function WorkflowBuilder({ onSave, onClose, initialWorkflow }: WorkflowBuilderProps) {
  const initialNodes: Node[] = initialWorkflow?.nodes || [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 300 },
      data: { label: 'Start' },
    },
  ];

  const initialEdges: Edge[] = initialWorkflow?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activePaletteGroup, setActivePaletteGroup] = useState<string | null>(null);

  // Node type to color mapping
  const nodeTypeColors: Record<string, string> = {
    start: '#22c55e',
    end: '#ef4444',
    agent: '#8b5cf6',
    selectAgent: '#8b5cf6',
    model: '#a855f7',
    condition: '#f59e0b',
    action: '#3b82f6',
    gmail: '#ef4444',
    drive: '#eab308',
    docs: '#3b82f6',
    calendar: '#2563eb',
    googleChat: '#22c55e',
    jira: '#2563eb',
    slack: '#a855f7',
    webhook: '#64748b',
    database: '#10b981',
    delay: '#f97316',
    code: '#06b6d4',
    sendMessage: '#3b82f6',
  };

  const onConnect = useCallback(
    (params: Connection) => {
      // Get source node to determine edge color
      const sourceNode = nodes.find(n => n.id === params.source);
      const sourceColor = nodeTypeColors[sourceNode?.type || 'action'] || '#3b82f6';

      const newEdge = {
        ...params,
        type: 'animated',
        animated: true,
        data: { color: sourceColor },
        style: { stroke: sourceColor, strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((type: string, label: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: { x: 400 + Math.random() * 50, y: 300 + Math.random() * 50 },
      data: { label, config: {} },
    };
    setNodes((nds) => [...nds, newNode]);
    setActivePaletteGroup(null);
  }, [setNodes]);

  const updateNodeData = useCallback((key: string, value: string) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, [key]: value } } : null
    );
  }, [selectedNode, setNodes]);


  return (
    <div className="h-full w-full relative bg-background overflow-hidden flex flex-col">
      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Back & Title */}
          <div className="flex items-center gap-3 pointer-events-auto glass-ios rounded-full pl-2 pr-6 py-2 shadow-lg">
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={onClose}
             >
                <ArrowLeft className="h-4 w-4" />
             </Button>
             <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">New Automation</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Draft • Unsaved</span>
             </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pointer-events-auto glass-ios rounded-full p-1.5 shadow-lg">
             <Button variant="ghost" size="sm" className="h-8 px-4 text-xs rounded-full">
                Discard
             </Button>
             <Button size="sm" className="h-8 px-4 text-xs rounded-full" onClick={() => onSave?.({nodes, edges})}>
                <Play className="h-3 w-3 mr-1.5 fill-current" />
                Publish
             </Button>
          </div>
      </div>

      {/* Floating Tool Palette (Left) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-2">
         {TOOL_PALETTE.map((group) => (
            <div key={group.group} className="relative group">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <button
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-200 shadow-md glass-ios",
                            activePaletteGroup === group.group
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                                : "hover:shadow-lg"
                          )}
                          onClick={() => setActivePaletteGroup(activePaletteGroup === group.group ? null : group.group)}
                        >
                            <group.icon className={cn("h-5 w-5 text-muted-foreground", activePaletteGroup === group.group && group.color)} />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#1a1a1a] border-white/10 text-white">
                        <p>{group.group}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Expanded Menu */}
                {activePaletteGroup === group.group && (
                    <div className="absolute left-14 top-0 ml-2 p-2 glass-ios rounded-xl shadow-lg flex flex-col gap-1 w-48 animate-in fade-in slide-in-from-left-2 z-30">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {group.group}
                        </div>
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => addNode(item.type, item.label)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-left transition-colors group/item"
                            >
                                <div className="p-1.5 rounded-md bg-muted group-hover/item:bg-accent text-muted-foreground group-hover/item:text-accent-foreground transition-colors">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm text-foreground">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
         ))}
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            type: 'animated',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="hsl(var(--border))"
            className="bg-background"
          />
          <Controls
            className="!bg-[#1a1a1a] !border !border-white/10 !rounded-xl !shadow-xl [&>button]:!bg-[#1a1a1a] [&>button]:!border-white/10 [&>button]:!text-white/70 [&>button:hover]:!bg-white/10 [&>button]:!rounded-lg [&>button]:!w-8 [&>button]:!h-8 [&_svg]:!fill-white/70"
            position="bottom-right"
            showInteractive={false}
          />
        </ReactFlow>
      </div>

      {/* Right Configuration Panel (Floating) */}
      {selectedNode && (
        <div className="absolute top-20 right-4 bottom-20 w-80 glass-ios rounded-2xl shadow-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 z-20">
           <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 rounded-md bg-muted">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{(selectedNode.data as WorkflowNodeData).label}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{selectedNode.type}</p>
                 </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                  <X className="h-4 w-4" />
              </Button>
           </div>
           
           <ScrollArea className="flex-1 p-5">
              <div className="space-y-5">
                 <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Node Name</Label>
                    <Input
                        value={(selectedNode.data as WorkflowNodeData).label || ''}
                        onChange={(e) => updateNodeData('label', e.target.value)}
                    />
                 </div>

                 <Separator />

                 {/* Dynamic Conditionals for Config */}
                 {(selectedNode.type === 'agent' || selectedNode.type === 'model') && (
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-xs font-medium text-muted-foreground">System Prompt</Label>
                           <Textarea
                              className="min-h-[120px] font-mono text-xs"
                              placeholder="You are a helpful assistant..."
                              value={(selectedNode.data as WorkflowNodeData).systemPrompt || ''}
                              onChange={(e) => updateNodeData('systemPrompt', e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                           <Select
                              value={(selectedNode.data as WorkflowNodeData).model || ''}
                              onValueChange={(v) => updateNodeData('model', v)}
                           >
                              <SelectTrigger>
                                 <SelectValue placeholder="Select Model" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                                 <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                 )}

                 {/* Generic Config Fallback */}
                 {!['agent', 'model', 'start', 'end'].includes(selectedNode.type || '') && (
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Configuration (JSON)</Label>
                        <Textarea
                            className="min-h-[200px] font-mono text-xs"
                            placeholder="{}"
                            value={(selectedNode.data as WorkflowNodeData).config || ''}
                            onChange={(e) => updateNodeData('config', e.target.value)}
                        />
                    </div>
                 )}
              </div>
           </ScrollArea>

           <div className="p-4 border-t border-border bg-muted/50">
              <Button size="sm" variant="destructive" className="w-full h-8 text-xs">
                 Delete Node
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
