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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
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
  Clock, Code, Mail, Zap, Plus, X, Save, Cpu, Boxes, Workflow,
  StickyNote, Eye, EyeOff, FileCode, Database, Layers, Settings,
  ChevronDown, ChevronRight, Sparkles, Send, FolderOpen, FileText,
  Calendar, Bug, Link2
} from 'lucide-react';

// Custom node components
import {
  StartNode, EndNode, AgentNode, ConditionNode, ActionNode, ModelNode,
  SelectAgentNode, SendMessageNode, GmailNode, DriveNode, DocsNode,
  CalendarNode, GoogleChatNode, JiraNode, SlackNode, WebhookNode,
  DatabaseNode, DelayNode, CodeNode
} from './WorkflowNodes';

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

// Sidebar sections with connectors
const SIDEBAR_SECTIONS = [
  {
    id: 'models',
    label: 'Models & AI',
    icon: Cpu,
    items: [
      { id: 'model', icon: Cpu, label: 'Model', type: 'model', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { id: 'code', icon: Code, label: 'Code', type: 'code', color: 'bg-gradient-to-br from-cyan-500 to-cyan-600' },
      { id: 'template', icon: Layers, label: 'Template', type: 'model', color: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
    ]
  },
  {
    id: 'gsuite',
    label: 'Google Workspace',
    icon: Mail,
    items: [
      { id: 'gmail', icon: Mail, label: 'Gmail', type: 'gmail', color: 'bg-gradient-to-br from-red-500 to-red-600' },
      { id: 'drive', icon: FolderOpen, label: 'Drive', type: 'drive', color: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
      { id: 'docs', icon: FileText, label: 'Docs', type: 'docs', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
      { id: 'calendar', icon: Calendar, label: 'Calendar', type: 'calendar', color: 'bg-gradient-to-br from-blue-600 to-blue-700' },
      { id: 'google-chat', icon: MessageSquare, label: 'Chat', type: 'googleChat', color: 'bg-gradient-to-br from-green-500 to-green-600' },
    ]
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    items: [
      { id: 'jira', icon: Bug, label: 'Jira', type: 'jira', color: 'bg-gradient-to-br from-blue-600 to-blue-700' },
      { id: 'slack', icon: MessageSquare, label: 'Slack', type: 'slack', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { id: 'webhook', icon: Webhook, label: 'Webhook', type: 'webhook', color: 'bg-gradient-to-br from-slate-500 to-slate-600' },
      { id: 'database', icon: Database, label: 'Database', type: 'database', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
    ]
  },
  {
    id: 'agents',
    label: 'Agentic Workflows',
    icon: Bot,
    items: [
      { id: 'select-agent', icon: Bot, label: 'Select Agent', type: 'selectAgent', color: 'bg-gradient-to-br from-violet-500 to-violet-600' },
      { id: 'invoke-agent', icon: Workflow, label: 'Invoke', type: 'agent', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
      { id: 'refund-agent', icon: Bot, label: 'Refund', type: 'agent', color: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600' },
      { id: 'support-agent', icon: Bot, label: 'Support', type: 'agent', color: 'bg-gradient-to-br from-pink-500 to-pink-600' },
    ]
  },
  {
    id: 'control',
    label: 'Flow Control',
    icon: Settings,
    items: [
      { id: 'start', icon: Play, label: 'Start', type: 'start', color: 'bg-gradient-to-br from-green-500 to-green-600' },
      { id: 'end', icon: Square, label: 'End', type: 'end', color: 'bg-gradient-to-br from-red-500 to-red-600' },
      { id: 'condition', icon: GitBranch, label: 'If/Else', type: 'condition', color: 'bg-gradient-to-br from-amber-500 to-amber-600' },
      { id: 'send-message', icon: Send, label: 'Message', type: 'sendMessage', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
      { id: 'delay', icon: Clock, label: 'Delay', type: 'delay', color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    ]
  },
];

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
      position: { x: 100, y: 200 },
      data: { label: 'Start' },
    },
  ];

  const initialEdges: Edge[] = initialWorkflow?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [viewMode, setViewMode] = useState<'visualizer' | 'yaml'>('visualizer');
  const [expandedSections, setExpandedSections] = useState<string[]>(['gsuite', 'agents', 'control']);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#fff', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#fff', width: 15, height: 15 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((item: typeof SIDEBAR_SECTIONS[0]['items'][0]) => {
    const newNode: Node = {
      id: `${item.type}-${Date.now()}`,
      type: item.type,
      position: { x: 300 + Math.random() * 100, y: 150 + nodes.length * 100 },
      data: { label: item.label, config: {} },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

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

  const handleSave = useCallback(() => {
    onSave?.({ nodes, edges });
  }, [nodes, edges, onSave]);

  return (
    <div className="h-full flex bg-[#0a0a0a]">
      {/* Left Sidebar */}
      <div className="w-60 flex flex-col border-r border-white/10 bg-[#111111]">
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {SIDEBAR_SECTIONS.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              return (
                <div key={section.id} className="rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center shadow-inner">
                      <section.icon className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-white/80 flex-1">{section.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-2 pb-3 grid grid-cols-3 gap-1.5">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addNode(item)}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-all group"
                          title={item.label}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shadow-lg",
                            "shadow-black/30",
                            item.color
                          )}>
                            <item.icon className="h-4 w-4 text-white drop-shadow-sm" />
                          </div>
                          <span className="text-[10px] text-white/60 group-hover:text-white/90 truncate w-full text-center font-medium">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        {/* Top toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => addNode({ id: 'new', icon: Plus, label: 'New Node', type: 'action', color: 'bg-gray-600' })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New node
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
            >
              <StickyNote className="h-3.5 w-3.5 mr-1" />
              Add note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setShowNotes(!showNotes)}
            >
              {showNotes ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
              {showNotes ? 'Hide notes' : 'Show notes'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-white/20 overflow-hidden">
              <button
                onClick={() => setViewMode('visualizer')}
                className={cn(
                  "px-3 py-1 text-xs transition-colors",
                  viewMode === 'visualizer'
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                Visualizer
              </button>
              <button
                onClick={() => setViewMode('yaml')}
                className={cn(
                  "px-3 py-1 text-xs transition-colors",
                  viewMode === 'yaml'
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                YAML
              </button>
            </div>

            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30"
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-white/70 hover:text-white hover:bg-white/10"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#fff', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0a0a0a]"
          style={{ background: '#0a0a0a' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={1}
            color="rgba(255,255,255,0.15)"
            className="bg-[#0a0a0a]"
          />
          <Controls
            className="!bg-[#1a1a1a] !border-white/20 !rounded-lg [&>button]:!bg-[#1a1a1a] [&>button]:!border-white/10 [&>button]:!text-white/70 [&>button:hover]:!bg-white/10"
            position="bottom-left"
          />
        </ReactFlow>
      </div>

      {/* Right Configuration Panel */}
      {selectedNode && (
        <div className="w-72 border-l border-white/10 bg-[#111111] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">{selectedNode.data.label || 'Node'}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10"
                onClick={() => setSelectedNode(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-white/50 capitalize">{selectedNode.type}</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Agent config */}
              {(selectedNode.type === 'agent' || selectedNode.type === 'selectAgent') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Invoke: agent</Label>
                    <Select
                      value={selectedNode.data.agentId || ''}
                      onValueChange={(v) => updateNodeData('agentId', v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-[#1a1a1a] border-white/20 text-white">
                        <SelectValue placeholder="Select agent..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        <SelectItem value="refund" className="text-white hover:bg-white/10">Refund agent</SelectItem>
                        <SelectItem value="support" className="text-white hover:bg-white/10">Support agent</SelectItem>
                        <SelectItem value="sales" className="text-white hover:bg-white/10">Sales agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Details</Label>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#1a1a1a] border border-white/10 text-left hover:bg-white/5">
                      <span className="text-xs text-white/70">Input output variables</span>
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    </button>
                  </div>
                </>
              )}

              {/* Model config */}
              {selectedNode.type === 'model' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Model</Label>
                    <Select
                      value={selectedNode.data.model || ''}
                      onValueChange={(v) => updateNodeData('model', v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-[#1a1a1a] border-white/20 text-white">
                        <SelectValue placeholder="Choose model..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        <SelectItem value="gpt-4" className="text-white">GPT-4</SelectItem>
                        <SelectItem value="gpt-4o" className="text-white">GPT-4o</SelectItem>
                        <SelectItem value="claude-3-opus" className="text-white">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet" className="text-white">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="gemini-pro" className="text-white">Gemini Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">System Prompt</Label>
                    <Textarea
                      value={selectedNode.data.systemPrompt || ''}
                      onChange={(e) => updateNodeData('systemPrompt', e.target.value)}
                      placeholder="Enter system prompt..."
                      className="min-h-[80px] text-xs bg-[#1a1a1a] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                </>
              )}

              {/* GSuite config */}
              {['gmail', 'drive', 'docs', 'calendar', 'googleChat'].includes(selectedNode.type) && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Action</Label>
                    <Select
                      value={selectedNode.data.action || ''}
                      onValueChange={(v) => updateNodeData('action', v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-[#1a1a1a] border-white/20 text-white">
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        {selectedNode.type === 'gmail' && (
                          <>
                            <SelectItem value="send" className="text-white">Send Email</SelectItem>
                            <SelectItem value="read" className="text-white">Read Emails</SelectItem>
                            <SelectItem value="search" className="text-white">Search Emails</SelectItem>
                          </>
                        )}
                        {selectedNode.type === 'drive' && (
                          <>
                            <SelectItem value="upload" className="text-white">Upload File</SelectItem>
                            <SelectItem value="download" className="text-white">Download File</SelectItem>
                            <SelectItem value="list" className="text-white">List Files</SelectItem>
                          </>
                        )}
                        {selectedNode.type === 'docs' && (
                          <>
                            <SelectItem value="create" className="text-white">Create Document</SelectItem>
                            <SelectItem value="read" className="text-white">Read Document</SelectItem>
                            <SelectItem value="update" className="text-white">Update Document</SelectItem>
                          </>
                        )}
                        {selectedNode.type === 'calendar' && (
                          <>
                            <SelectItem value="create" className="text-white">Create Event</SelectItem>
                            <SelectItem value="list" className="text-white">List Events</SelectItem>
                            <SelectItem value="update" className="text-white">Update Event</SelectItem>
                          </>
                        )}
                        {selectedNode.type === 'googleChat' && (
                          <>
                            <SelectItem value="send" className="text-white">Send Message</SelectItem>
                            <SelectItem value="read" className="text-white">Read Messages</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Configuration</Label>
                    <Textarea
                      value={selectedNode.data.config || ''}
                      onChange={(e) => updateNodeData('config', e.target.value)}
                      placeholder="Enter configuration..."
                      className="min-h-[60px] text-xs bg-[#1a1a1a] border-white/20 text-white placeholder:text-white/30 font-mono"
                    />
                  </div>
                </>
              )}

              {/* Jira config */}
              {selectedNode.type === 'jira' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Action</Label>
                    <Select
                      value={selectedNode.data.action || ''}
                      onValueChange={(v) => updateNodeData('action', v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-[#1a1a1a] border-white/20 text-white">
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        <SelectItem value="create" className="text-white">Create Issue</SelectItem>
                        <SelectItem value="update" className="text-white">Update Issue</SelectItem>
                        <SelectItem value="search" className="text-white">Search Issues</SelectItem>
                        <SelectItem value="transition" className="text-white">Transition Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Project Key</Label>
                    <Textarea
                      value={selectedNode.data.projectKey || ''}
                      onChange={(e) => updateNodeData('projectKey', e.target.value)}
                      placeholder="e.g., PROJ"
                      className="min-h-[40px] text-xs bg-[#1a1a1a] border-white/20 text-white placeholder:text-white/30 font-mono"
                    />
                  </div>
                </>
              )}

              {/* Slack config */}
              {selectedNode.type === 'slack' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Action</Label>
                    <Select
                      value={selectedNode.data.action || ''}
                      onValueChange={(v) => updateNodeData('action', v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-[#1a1a1a] border-white/20 text-white">
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        <SelectItem value="send" className="text-white">Send Message</SelectItem>
                        <SelectItem value="read" className="text-white">Read Messages</SelectItem>
                        <SelectItem value="react" className="text-white">Add Reaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Channel</Label>
                    <Textarea
                      value={selectedNode.data.channel || ''}
                      onChange={(e) => updateNodeData('channel', e.target.value)}
                      placeholder="e.g., #general"
                      className="min-h-[40px] text-xs bg-[#1a1a1a] border-white/20 text-white placeholder:text-white/30 font-mono"
                    />
                  </div>
                </>
              )}

              {/* Condition config */}
              {selectedNode.type === 'condition' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Condition</Label>
                    <Textarea
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData('condition', e.target.value)}
                      placeholder="e.g., {{input.amount}} > 100"
                      className="min-h-[60px] text-xs bg-[#1a1a1a] border-white/20 text-white font-mono placeholder:text-white/30"
                    />
                  </div>
                  <p className="text-[10px] text-white/40">
                    Use {'{{variable}}'} syntax to reference inputs
                  </p>
                </>
              )}

              {/* Generic action config */}
              {['sendMessage', 'action', 'webhook', 'database', 'delay', 'code'].includes(selectedNode.type) && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Configuration</Label>
                    <Textarea
                      value={selectedNode.data.config || ''}
                      onChange={(e) => updateNodeData('config', e.target.value)}
                      placeholder="Enter configuration..."
                      className="min-h-[80px] text-xs bg-[#1a1a1a] border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                </>
              )}

              {/* Node ID */}
              <Separator className="bg-white/10" />
              <div className="space-y-2">
                <Label className="text-xs text-white/50">Node ID</Label>
                <p className="text-xs text-white/40 font-mono">{selectedNode.id}</p>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
