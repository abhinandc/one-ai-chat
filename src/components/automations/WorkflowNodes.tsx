import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { AnimatedBorderTrail } from '@/components/ui/animated-border-trail';
import {
  Play, Square, Bot, GitBranch, Zap, Cpu, Send, ArrowRight,
  Mail, FileText, FolderOpen, Calendar, MessageSquare, Bug,
  Database, Webhook, Clock, Code
} from 'lucide-react';

interface CustomNodeData {
  label?: string;
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

// Button-style node base styling
const nodeButtonBase = `
  px-4 py-3 rounded-lg min-w-[120px]
  bg-[#1e1e1e] border border-white/10
  shadow-md
  transition-all duration-200
  hover:bg-[#252525] hover:border-white/20
`;

// Node wrapper component with conditional animated border trail
const NodeWrapper = ({
  children,
  selected,
  trailColor = '#8b5cf6'
}: {
  children: React.ReactNode;
  selected?: boolean;
  trailColor?: string;
}) => {
  if (selected) {
    return (
      <AnimatedBorderTrail
        duration="3s"
        trailColor={trailColor}
        trailSize="md"
        className="rounded-lg"
        contentClassName="rounded-lg"
      >
        {children}
      </AnimatedBorderTrail>
    );
  }
  return <>{children}</>;
};

// Start Node
export const StartNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#22c55e">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
            <Play className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Start'}</span>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
StartNode.displayName = 'StartNode';

// End Node
export const EndNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#ef4444">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <Square className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'End'}</span>
        </div>
      </div>
    </NodeWrapper>
  );
});
EndNode.displayName = 'EndNode';

// Model Node
export const ModelNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#a855f7">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Model'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        {data.model && (
          <p className="text-xs text-white/50 mt-2 ml-11">{data.model}</p>
        )}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
ModelNode.displayName = 'ModelNode';

// Agent Node
export const AgentNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#8b5cf6">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Agent'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        {data.agentId && (
          <p className="text-xs text-white/50 mt-2 ml-11">→ {data.agentId}</p>
        )}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
AgentNode.displayName = 'AgentNode';

// Select Agent Node
export const SelectAgentNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#8b5cf6">
      <div className={cn(nodeButtonBase, "min-w-[200px]", selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Select Agent'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
SelectAgentNode.displayName = 'SelectAgentNode';

// Condition Node (If/Else)
export const ConditionNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#f59e0b">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'If / Else'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-[#1a1a1a] !-right-1.5 !top-[35%] !shadow-md"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!w-3 !h-3 !bg-red-500 !border-2 !border-[#1a1a1a] !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
ConditionNode.displayName = 'ConditionNode';

// Send Message Node
export const SendMessageNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#3b82f6">
      <div className={cn(nodeButtonBase, "min-w-[160px]", selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Send className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Message'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
SendMessageNode.displayName = 'SendMessageNode';

// Action Node (generic)
export const ActionNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#3b82f6">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Action'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        {data.actionType && (
          <p className="text-xs text-white/50 mt-2 ml-11 capitalize">
            {(data.actionType as string).replace(/_/g, ' ')}
          </p>
        )}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
ActionNode.displayName = 'ActionNode';

// Gmail Node
export const GmailNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#ef4444">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Gmail'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
GmailNode.displayName = 'GmailNode';

// Google Drive Node
export const DriveNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#eab308">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-sm">
            <FolderOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Drive'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
DriveNode.displayName = 'DriveNode';

// Google Docs Node
export const DocsNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#3b82f6">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Docs'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
DocsNode.displayName = 'DocsNode';

// Google Calendar Node
export const CalendarNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#2563eb">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Calendar'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
CalendarNode.displayName = 'CalendarNode';

// Google Chat Node
export const GoogleChatNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#22c55e">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Chat'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
GoogleChatNode.displayName = 'GoogleChatNode';

// Jira Node
export const JiraNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#2563eb">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <Bug className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Jira'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
JiraNode.displayName = 'JiraNode';

// Slack Node
export const SlackNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#a855f7">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Slack'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
SlackNode.displayName = 'SlackNode';

// Webhook Node
export const WebhookNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#64748b">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
            <Webhook className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Webhook'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
WebhookNode.displayName = 'WebhookNode';

// Database Node
export const DatabaseNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#10b981">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Database className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Database'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
DatabaseNode.displayName = 'DatabaseNode';

// Delay Node
export const DelayNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#f97316">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Delay'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
DelayNode.displayName = 'DelayNode';

// Code Node
export const CodeNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#06b6d4">
      <div className={cn(nodeButtonBase, selected && "bg-[#252525]")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-left-1.5 !shadow-md"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
            <Code className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{data.label || 'Code'}</span>
          <ArrowRight className="h-4 w-4 text-white/40 ml-auto" />
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#1a1a1a] !-right-1.5 !shadow-md"
        />
      </div>
    </NodeWrapper>
  );
});
CodeNode.displayName = 'CodeNode';
