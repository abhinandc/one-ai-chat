import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Wrench } from "lucide-react";

interface ToolNodeProps {
  data: {
    label: string;
    toolName?: string;
  };
}

export const ToolNode = memo(({ data }: ToolNodeProps) => {
  return (
    <div className="bg-card border border-border-primary rounded-xl p-md shadow-md min-w-[160px]">
      <div className="flex items-center gap-sm mb-sm">
        <div className="w-6 h-6 bg-accent-green rounded-lg flex items-center justify-center">
          <Wrench className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-card-foreground">{data.label}</span>
      </div>
      
      {data.toolName && (
        <p className="text-xs text-text-secondary">{data.toolName}</p>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-accent-green border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-accent-green border-2 border-white"
      />
    </div>
  );
});