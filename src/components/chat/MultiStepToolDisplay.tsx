import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  Search,
  Code,
  FileText,
  Zap,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ToolStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  description?: string;
  result?: string;
  toolType?: "search" | "code" | "analyze" | "reason" | "execute";
}

interface MultiStepToolDisplayProps {
  steps: ToolStep[];
  isExpanded?: boolean;
  className?: string;
}

const toolIcons = {
  search: Search,
  code: Code,
  analyze: FileText,
  reason: Brain,
  execute: Zap,
};

export function MultiStepToolDisplay({
  steps,
  isExpanded: initialExpanded = true,
  className,
}: MultiStepToolDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const runningStep = steps.find((s) => s.status === "running");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {runningStep ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Brain className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            {runningStep ? `Running: ${runningStep.name}` : "Multi-Step Reasoning"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} steps
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Steps List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {steps.map((step, index) => {
                const Icon = step.toolType ? toolIcons[step.toolType] : Circle;
                const isStepExpanded = expandedSteps.has(step.id);

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "rounded-lg border transition-colors",
                      step.status === "running" && "border-primary/50 bg-primary/5",
                      step.status === "completed" && "border-border/30 bg-muted/20",
                      step.status === "pending" && "border-border/20 bg-transparent opacity-60",
                      step.status === "error" && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <button
                      onClick={() => step.result && toggleStep(step.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5"
                      disabled={!step.result}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {step.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : step.status === "running" ? (
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        ) : step.status === "error" ? (
                          <Circle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Tool Icon */}
                      <Icon className={cn(
                        "h-4 w-4 shrink-0",
                        step.status === "running" && "text-primary",
                        step.status === "completed" && "text-foreground",
                        step.status === "pending" && "text-muted-foreground/50"
                      )} />

                      {/* Step Name */}
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "text-sm font-medium",
                          step.status === "pending" && "text-muted-foreground"
                        )}>
                          {step.name}
                        </p>
                        {step.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Expand Icon */}
                      {step.result && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isStepExpanded && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {/* Expanded Result */}
                    <AnimatePresence>
                      {isStepExpanded && step.result && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1">
                            <div className="rounded-md bg-background/50 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                              {step.result}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
