import { memo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Brain,
  Image,
  Paperclip,
  Sparkles,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  description?: string;
  result?: string;
  toolType?: "search" | "code" | "analyze" | "reason" | "execute" | "vision" | "attachment";
  duration?: number;
}

interface AIThinkingDisplayProps {
  steps: ToolStep[];
  isThinking?: boolean;
  thinkingText?: string;
  className?: string;
}

const toolIcons: Record<string, typeof Circle> = {
  search: Search,
  code: Code,
  analyze: FileText,
  reason: Brain,
  execute: Zap,
  vision: Eye,
  attachment: Paperclip,
};

// Animated thinking dots
const ThinkingDots = memo(function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <motion.span
        className="w-1 h-1 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-1 h-1 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="w-1 h-1 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
      />
    </span>
  );
});

// Progress ring for running steps
const ProgressRing = memo(function ProgressRing({ size = 16 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      className="animate-spin"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="12 25"
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
});

export const AIThinkingDisplay = memo(function AIThinkingDisplay({
  steps,
  isThinking = false,
  thinkingText = "Processing",
  className,
}: AIThinkingDisplayProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const runningStep = steps.find((s) => s.status === "running");
  const hasSteps = steps.length > 0;

  // Auto-expand when new step starts running
  useEffect(() => {
    if (runningStep && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [runningStep, isCollapsed]);

  if (!hasSteps && !isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isThinking || runningStep ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          ) : (
            <Brain className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium text-foreground">
            {runningStep ? (
              <>
                {runningStep.name}
                <ThinkingDots />
              </>
            ) : isThinking ? (
              <>
                {thinkingText}
                <ThinkingDots />
              </>
            ) : (
              "Deep Thinking Complete"
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasSteps && (
            <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-full bg-muted">
              {completedCount}/{steps.length}
            </span>
          )}
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Steps List */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5">
              {steps.map((step, index) => {
                const Icon = step.toolType ? toolIcons[step.toolType] || Circle : Circle;
                const isStepExpanded = expandedSteps.has(step.id);

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={cn(
                      "rounded-lg border transition-all duration-200",
                      step.status === "running" && "border-primary/40 bg-primary/10 shadow-sm shadow-primary/10",
                      step.status === "completed" && "border-border/40 bg-muted/30",
                      step.status === "pending" && "border-border/20 bg-transparent opacity-50",
                      step.status === "error" && "border-destructive/40 bg-destructive/10"
                    )}
                  >
                    <button
                      onClick={() => step.result && toggleStep(step.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      disabled={!step.result}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                        {step.status === "completed" ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </motion.div>
                        ) : step.status === "running" ? (
                          <ProgressRing size={16} />
                        ) : step.status === "error" ? (
                          <Circle className="h-4 w-4 text-destructive fill-destructive/20" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Tool Icon */}
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        step.status === "running" && "text-primary",
                        step.status === "completed" && "text-foreground",
                        step.status === "pending" && "text-muted-foreground/40"
                      )} />

                      {/* Step Name & Description */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          step.status === "pending" && "text-muted-foreground"
                        )}>
                          {step.name}
                        </p>
                        {step.description && step.status === "running" && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {step.duration && step.status === "completed" && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {step.duration}ms
                        </span>
                      )}

                      {/* Expand Icon */}
                      {step.result && (
                        <motion.div
                          animate={{ rotate: isStepExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </button>

                    {/* Expanded Result */}
                    <AnimatePresence>
                      {isStepExpanded && step.result && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1">
                            <div className="rounded-md bg-background/60 border border-border/30 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {step.result}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Active thinking indicator without specific step */}
              {isThinking && !runningStep && steps.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <ProgressRing size={16} />
                  <span className="text-sm text-muted-foreground">{thinkingText}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Simplified thinking indicator for inline use
export const InlineThinkingIndicator = memo(function InlineThinkingIndicator({
  text = "Thinking",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </motion.div>
      <span>{text}</span>
      <ThinkingDots />
    </motion.div>
  );
});
