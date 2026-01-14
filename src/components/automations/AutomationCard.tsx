import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Zap, Play, MoreHorizontal, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutomationCardProps {
  name: string;
  description: string;
  triggerType: "webhook" | "schedule" | "event";
  actionCount: number;
  status: "active" | "inactive" | "draft";
  lastRun?: string;
  onClick?: () => void;
}

export function AutomationCard({
  name,
  description,
  triggerType,
  actionCount,
  status,
  lastRun,
  onClick,
}: AutomationCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  const getTriggerIcon = () => {
    switch(triggerType) {
      case "webhook": return <Globe className="h-4 w-4 text-blue-500" />;
      case "schedule": return <Calendar className="h-4 w-4 text-purple-500" />;
      default: return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-300 cursor-pointer",
        "bg-card border-border hover:border-primary/50",
        "hover:shadow-lg",
        "rounded-xl h-[240px]"
      )}
    >
      {/* Visual Header (Animated Beam) */}
      <div 
        ref={containerRef}
        className="relative flex h-[120px] w-full items-center justify-center overflow-hidden bg-muted/20 border-b border-border"
      >
        <div className="flex w-full max-w-[200px] flex-row items-stretch justify-between gap-8">
            <div className="flex flex-col justify-center">
                <div 
                    ref={triggerRef} 
                    className="z-10 flex size-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm"
                >
                    {getTriggerIcon()}
                </div>
            </div>
            <div className="flex flex-col justify-center">
                <div 
                    ref={actionRef}
                    className="z-10 flex size-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm"
                >
                    <Play className="h-4 w-4 text-green-500" />
                </div>
            </div>
        </div>
        
        <AnimatedBeam
            containerRef={containerRef}
            fromRef={triggerRef}
            toRef={actionRef}
            duration={3}
            gradientStartColor="#3B9DFF" // Blue
            gradientStopColor="#8B5CF6"  // Purple
            pathWidth={2}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {description}
                </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <Badge 
                variant="outline" 
                className={cn(
                    "border-0 px-2 py-0.5 font-medium rounded-full",
                    status === "active" ? "bg-green-500/10 text-green-500" :
                    status === "draft" ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-zinc-500/10 text-zinc-500"
                )}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <span>{actionCount} Actions</span>
        </div>
      </div>
    </Card>
  );
}
