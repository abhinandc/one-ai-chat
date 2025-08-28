import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Search } from "lucide-react";

export const RetrievalNode = memo(({ data }: any) => {
  return (
    <div className="bg-card border border-border-primary rounded-xl p-md shadow-md min-w-[160px]">
      <div className="flex items-center gap-sm mb-sm">
        <div className="w-6 h-6 bg-accent-green rounded-lg flex items-center justify-center">
          <Search className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-card-foreground">{data.label}</span>
      </div>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400 border-2 border-white" />
    </div>
  );
});