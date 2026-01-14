import { memo } from 'react';
import { Handle, Position, NodeProps, type Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { AnimatedBorderTrail } from '@/components/ui/animated-border-trail';
import {
  Play, Square, Bot, GitBranch, Zap, Cpu, Send, ArrowRight,
  Mail, FileText, FolderOpen, Calendar, MessageSquare, Bug,
  Database, Webhook, Clock, Code
} from 'lucide-react';


interface CustomNodeData extends Record<string, unknown> {
  label?: string;
  icon?: string;
  color?: string;
  model?: string;
  agentId?: string;
  actionType?: string;
}

// Button-style node base styling with glass-ios design system
const nodeButtonBase = `
  px-4 py-3 rounded-xl min-w-[160px]
  glass-ios
  shadow-md
  transition-all duration-200
  hover:shadow-lg
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
      <div
        className="relative animate-pulse"
        style={{
          filter: `drop-shadow(0 0 8px ${trailColor}) drop-shadow(0 0 16px ${trailColor}40)`,
        }}
      >
        {children}
      </div>
    );
  }
  return <>{children}</>;
};

// Start Node
export const StartNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#22c55e">
      <div className={cn(nodeButtonBase, selected && "ring-2 ring-green-500/50 ring-offset-2 ring-offset-background")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <Play className="h-4 w-4 text-green-500" fill="currentColor" />
          </div>
          <span className="text-sm font-semibold text-foreground">{data.label || 'Start'}</span>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-background !border-2 !border-green-500 !-right-1.5 hover:!bg-green-500 transition-colors"
        />
      </div>
    </NodeWrapper>
  );
});
StartNode.displayName = 'StartNode';

// End Node
export const EndNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#ef4444">
      <div className={cn(nodeButtonBase, selected && "ring-2 ring-red-500/50 ring-offset-2 ring-offset-background")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-background !border-2 !border-red-500 !-left-1.5 hover:!bg-red-500 transition-colors"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <Square className="h-4 w-4 text-red-500" fill="currentColor" />
          </div>
          <span className="text-sm font-semibold text-foreground">{data.label || 'End'}</span>
        </div>
      </div>
    </NodeWrapper>
  );
});
EndNode.displayName = 'EndNode';

// Model Node
export const ModelNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#a855f7">
      <div className={cn(nodeButtonBase, selected && "ring-2 ring-purple-500/50 ring-offset-2 ring-offset-background")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-background !border-2 !border-purple-500 !-left-1.5 hover:!bg-purple-500 transition-colors"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Cpu className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">{data.label || 'Model'}</span>
            {data.model && (
              <p className="text-xs text-muted-foreground font-mono">{data.model}</p>
            )}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-background !border-2 !border-purple-500 !-right-1.5 hover:!bg-purple-500 transition-colors"
        />
      </div>
    </NodeWrapper>
  );
});
ModelNode.displayName = 'ModelNode';

// Agent Node
export const AgentNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#8b5cf6">
      <div className={cn(nodeButtonBase, selected && "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-background")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-background !border-2 !border-violet-500 !-left-1.5 hover:!bg-violet-500 transition-colors"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
            <Bot className="h-4 w-4 text-violet-500" />
          </div>
          <span className="text-sm font-semibold text-foreground">{data.label || 'Agent'}</span>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-background !border-2 !border-violet-500 !-right-1.5 hover:!bg-violet-500 transition-colors"
        />
      </div>
    </NodeWrapper>
  );
});
AgentNode.displayName = 'AgentNode';

// Condition Node with true/false outputs
export const ConditionNode = memo(({ data, selected }: NodeProps<Node<CustomNodeData>>) => {
  return (
    <NodeWrapper selected={selected} trailColor="#f59e0b">
      <div className={cn(nodeButtonBase, selected && "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-background")}>
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-background !border-2 !border-amber-500 !-left-1.5 hover:!bg-amber-500 transition-colors"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <GitBranch className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-sm font-semibold text-foreground">{data.label || 'Condition'}</span>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          className="!w-3 !h-3 !bg-background !border-2 !border-green-500 !-right-1.5 !top-[30%] hover:!bg-green-500 transition-colors"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          className="!w-3 !h-3 !bg-background !border-2 !border-red-500 !-right-1.5 !top-[70%] hover:!bg-red-500 transition-colors"
        />
      </div>
    </NodeWrapper>
  );
});
ConditionNode.displayName = 'ConditionNode';

interface GenericNodeProps extends NodeProps<Node<CustomNodeData>> {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
}

const GenericNode = ({ data, selected, icon: Icon, color, label }: GenericNodeProps) => (
    <NodeWrapper selected={selected} trailColor={color}>
      <div
        className={cn(nodeButtonBase, selected && "ring-2 ring-offset-2 ring-offset-background")}
        style={selected ? { '--tw-ring-color': `${color}80` } as React.CSSProperties : undefined}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-background !border-2 !-left-1.5 transition-colors"
          style={{ borderColor: color }}
        />
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-foreground">{data.label || label}</span>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-background !border-2 !-right-1.5 transition-colors"
          style={{ borderColor: color }}
        />
      </div>
    </NodeWrapper>
);

export const ActionNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Zap} color="#3b82f6" label="Action" />);
export const GmailNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Mail} color="#ef4444" label="Gmail" />);
export const DriveNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={FolderOpen} color="#eab308" label="Drive" />);
export const DocsNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={FileText} color="#3b82f6" label="Docs" />);
export const CalendarNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Calendar} color="#2563eb" label="Calendar" />);
export const GoogleChatNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={MessageSquare} color="#22c55e" label="Chat" />);
export const JiraNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Bug} color="#2563eb" label="Jira" />);
export const SlackNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={MessageSquare} color="#a855f7" label="Slack" />);
export const WebhookNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Webhook} color="#64748b" label="Webhook" />);
export const DatabaseNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Database} color="#10b981" label="Database" />);
export const DelayNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Clock} color="#f97316" label="Delay" />);
export const CodeNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Code} color="#06b6d4" label="Code" />);
export const SendMessageNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Send} color="#3b82f6" label="Message" />);
export const SelectAgentNode = memo((props: NodeProps<Node<CustomNodeData>>) => <GenericNode {...props} icon={Bot} color="#8b5cf6" label="Select Agent" />);
