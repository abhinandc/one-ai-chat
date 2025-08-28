import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { MessageSquare } from "lucide-react";

interface SystemNodeProps {
  data: {
    label: string;
    content?: string;
  };
}

export const SystemNode = memo(({ data }: SystemNodeProps) => {
  return (
    <div className="bg-card border border-border-primary rounded-xl p-md shadow-md min-w-[200px]">
      <div className="flex items-center gap-sm mb-sm">
        <div className="w-6 h-6 bg-accent-blue rounded-lg flex items-center justify-center">
          <MessageSquare className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-card-foreground">{data.label}</span>
      </div>
      
      {data.content && (
        <p className="text-xs text-text-secondary line-clamp-2">{data.content}</p>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-accent-blue border-2 border-white"
      />
    </div>
  );
});