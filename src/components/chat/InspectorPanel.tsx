import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Inspector } from "@/components/chat/Inspector";
import { cn } from "@/lib/utils";
import type { Conversation, Citation } from "@/types";

interface InspectorPanelProps {
  conversation?: Conversation;
  citations?: Citation[];
  onUpdateSettings?: (settings: any) => void;
}

export function InspectorPanel({ conversation, citations, onUpdateSettings }: InspectorPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-surface-graphite/30 border-l border-border-primary/50 flex flex-col transition-all duration-normal",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Collapse Toggle */}
      <div className="px-4 py-2 border-b border-border-secondary/50 flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 shrink-0"
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          <Inspector
            conversation={conversation}
            citations={citations}
            onUpdateSettings={onUpdateSettings}
          />
        </div>
      )}
    </div>
  );
}