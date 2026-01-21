"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  CircleIcon,
  ClockIcon,
  CogIcon,
  PlayIcon,
  SquareIcon,
  WrenchIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react";
import { memo, useState, type ComponentProps, type ReactNode } from "react";
import { CodeBlock } from "./code-block";

// Types for multi-step tool execution
export type ToolStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "skipped";

export interface ToolStep {
  id: string;
  name: string;
  description?: string;
  status: ToolStepStatus;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  children?: ToolStep[];
}

export interface MultiStepToolsProps extends ComponentProps<"div"> {
  title?: string;
  description?: string;
  steps: ToolStep[];
  isRunning?: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
}

const statusConfig: Record<
  ToolStepStatus,
  { icon: ReactNode; label: string; color: string }
> = {
  pending: {
    icon: <CircleIcon className="h-4 w-4" />,
    label: "Pending",
    color: "text-muted-foreground",
  },
  running: {
    icon: <ClockIcon className="h-4 w-4 animate-pulse" />,
    label: "Running",
    color: "text-blue-500",
  },
  completed: {
    icon: <CheckCircle2Icon className="h-4 w-4" />,
    label: "Completed",
    color: "text-green-500",
  },
  error: {
    icon: <XCircleIcon className="h-4 w-4" />,
    label: "Error",
    color: "text-destructive",
  },
  skipped: {
    icon: <SquareIcon className="h-4 w-4" />,
    label: "Skipped",
    color: "text-muted-foreground",
  },
};

// Individual step component
export const ToolStepItem = memo(function ToolStepItem({
  step,
  depth = 0,
  className,
}: {
  step: ToolStep;
  depth?: number;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(step.status === "running");
  const config = statusConfig[step.status];
  const hasDetails = step.input || step.output || step.error || step.children;

  return (
    <div
      className={cn("relative", depth > 0 && "ml-6 border-l border-border/50 pl-4", className)}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-3 py-2">
          {/* Status indicator */}
          <div
            className={cn(
              "mt-0.5 flex-shrink-0",
              config.color,
              step.status === "running" && "animate-pulse"
            )}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {hasDetails && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-transparent"
                  >
                    <ChevronRightIcon
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isOpen && "rotate-90"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
              <span className="font-medium text-sm">{step.name}</span>
              <Badge
                variant="secondary"
                className={cn("text-[10px] px-1.5 py-0", config.color)}
              >
                {config.label}
              </Badge>
            </div>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            )}
          </div>

          {/* Timing */}
          {step.completedAt && step.startedAt && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {Math.round(
                (step.completedAt.getTime() - step.startedAt.getTime()) / 1000
              )}
              s
            </span>
          )}
        </div>

        {hasDetails && (
          <CollapsibleContent className="ml-7">
            {/* Input */}
            {step.input && Object.keys(step.input).length > 0 && (
              <div className="mb-3">
                <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Input
                </h5>
                <CodeBlock
                  code={JSON.stringify(step.input, null, 2)}
                  language="json"
                  className="text-xs"
                />
              </div>
            )}

            {/* Output */}
            {step.output && (
              <div className="mb-3">
                <h5 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Output
                </h5>
                <CodeBlock
                  code={
                    typeof step.output === "string"
                      ? step.output
                      : JSON.stringify(step.output, null, 2)
                  }
                  language="json"
                  className="text-xs"
                />
              </div>
            )}

            {/* Error */}
            {step.error && (
              <div className="mb-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                <h5 className="text-[10px] font-medium text-destructive uppercase tracking-wide mb-1">
                  Error
                </h5>
                <pre className="text-xs text-destructive whitespace-pre-wrap">
                  {step.error}
                </pre>
              </div>
            )}

            {/* Nested steps */}
            {step.children && step.children.length > 0 && (
              <div className="space-y-1">
                {step.children.map((child) => (
                  <ToolStepItem key={child.id} step={child} depth={depth + 1} />
                ))}
              </div>
            )}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
});

// Main multi-step tools component
export const MultiStepTools = memo(function MultiStepTools({
  title = "Tool Execution",
  description,
  steps,
  isRunning = false,
  onCancel,
  onRetry,
  className,
  ...props
}: MultiStepToolsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const errorCount = steps.filter((s) => s.status === "error").length;
  const totalCount = steps.length;

  const overallStatus: ToolStepStatus =
    errorCount > 0
      ? "error"
      : isRunning
        ? "running"
        : completedCount === totalCount
          ? "completed"
          : "pending";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-md bg-primary/10")}>
                {isRunning ? (
                  <CogIcon className="h-4 w-4 text-primary animate-spin" />
                ) : overallStatus === "completed" ? (
                  <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                ) : overallStatus === "error" ? (
                  <XCircleIcon className="h-4 w-4 text-destructive" />
                ) : (
                  <ZapIcon className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">{title}</h3>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground tabular-nums">
                  {completedCount}/{totalCount}
                </div>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      overallStatus === "error"
                        ? "bg-destructive"
                        : overallStatus === "completed"
                          ? "bg-green-500"
                          : "bg-primary"
                    )}
                    style={{
                      width: `${(completedCount / totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Steps list */}
          <div className="p-3 space-y-1 border-t border-border/50">
            {steps.map((step) => (
              <ToolStepItem key={step.id} step={step} />
            ))}
          </div>

          {/* Actions */}
          {(onCancel || onRetry) && (
            <div className="flex justify-end gap-2 p-3 border-t border-border/50 bg-muted/20">
              {isRunning && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {!isRunning && errorCount > 0 && onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <PlayIcon className="h-3 w-3 mr-1" />
                  Retry Failed
                </Button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

// Orchestrator-specific component for displaying orchestrator → worker pattern
export interface OrchestratorStepProps extends ComponentProps<"div"> {
  orchestratorName: string;
  orchestratorStatus: ToolStepStatus;
  workers: Array<{
    id: string;
    name: string;
    task: string;
    status: ToolStepStatus;
    result?: unknown;
    error?: string;
  }>;
  summary?: string;
}

export const OrchestratorStep = memo(function OrchestratorStep({
  orchestratorName,
  orchestratorStatus,
  workers,
  summary,
  className,
  ...props
}: OrchestratorStepProps) {
  const steps: ToolStep[] = [
    {
      id: "orchestrator",
      name: orchestratorName,
      description: "Coordinating worker tasks",
      status: orchestratorStatus,
      children: workers.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.task,
        status: w.status,
        output: w.result,
        error: w.error,
      })),
    },
  ];

  if (summary && orchestratorStatus === "completed") {
    steps.push({
      id: "summary",
      name: "Summary",
      description: summary,
      status: "completed",
    });
  }

  return (
    <MultiStepTools
      title="AI Orchestration"
      description={`${workers.length} worker tasks`}
      steps={steps}
      isRunning={orchestratorStatus === "running"}
      className={className}
      {...props}
    />
  );
});

// Simple inline tool indicator
export interface InlineToolProps extends ComponentProps<"span"> {
  name: string;
  status: ToolStepStatus;
}

export const InlineTool = memo(function InlineTool({
  name,
  status,
  className,
  ...props
}: InlineToolProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted",
        config.color,
        className
      )}
      {...props}
    >
      {config.icon}
      {name}
    </span>
  );
});

// Tool call timeline for showing sequential execution
export interface ToolTimelineProps extends ComponentProps<"div"> {
  calls: Array<{
    id: string;
    name: string;
    timestamp: Date;
    duration?: number;
    status: ToolStepStatus;
  }>;
}

export const ToolTimeline = memo(function ToolTimeline({
  calls,
  className,
  ...props
}: ToolTimelineProps) {
  return (
    <div className={cn("space-y-0", className)} {...props}>
      {calls.map((call, index) => (
        <div key={call.id} className="flex items-start gap-3">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                statusConfig[call.status].color.replace("text-", "bg-")
              )}
            />
            {index < calls.length - 1 && (
              <div className="w-px h-6 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{call.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {call.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {call.duration !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                {call.duration}ms
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

export default MultiStepTools;
