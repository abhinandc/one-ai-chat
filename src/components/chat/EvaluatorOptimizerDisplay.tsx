import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Target,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EvaluationRound {
  id: string;
  iteration: number;
  status: "optimizing" | "evaluating" | "approved" | "rejected";
  optimizerOutput?: string;
  evaluatorFeedback?: string;
  score?: number;
  criteria?: { name: string; passed: boolean }[];
}

interface EvaluatorOptimizerDisplayProps {
  rounds: EvaluationRound[];
  maxIterations?: number;
  isExpanded?: boolean;
  className?: string;
}

export function EvaluatorOptimizerDisplay({
  rounds,
  maxIterations = 5,
  isExpanded: initialExpanded = true,
  className,
}: EvaluatorOptimizerDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  const toggleRound = (roundId: string) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  const currentRound = rounds[rounds.length - 1];
  const isOptimizing = currentRound?.status === "optimizing";
  const isEvaluating = currentRound?.status === "evaluating";
  const isApproved = currentRound?.status === "approved";

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
          {isOptimizing || isEvaluating ? (
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          ) : isApproved ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Target className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            {isOptimizing 
              ? "Optimizing response..." 
              : isEvaluating 
              ? "Evaluating quality..."
              : isApproved
              ? "Quality approved"
              : "Evaluator-Optimizer"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Round {rounds.length}/{maxIterations}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Rounds List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {rounds.map((round) => {
                const isRoundExpanded = expandedRounds.has(round.id);

                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: round.iteration * 0.1 }}
                    className={cn(
                      "rounded-lg border transition-colors",
                      round.status === "optimizing" && "border-blue-500/50 bg-blue-500/5",
                      round.status === "evaluating" && "border-amber-500/50 bg-amber-500/5",
                      round.status === "approved" && "border-green-500/50 bg-green-500/5",
                      round.status === "rejected" && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <button
                      onClick={() => toggleRound(round.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5"
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {round.status === "optimizing" ? (
                          <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                        ) : round.status === "evaluating" ? (
                          <Target className="h-4 w-4 text-amber-500 animate-pulse" />
                        ) : round.status === "approved" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>

                      {/* Round Info */}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">
                          Iteration {round.iteration}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {round.status === "optimizing" && "Generating optimized response..."}
                          {round.status === "evaluating" && "Checking quality criteria..."}
                          {round.status === "approved" && `Approved with score ${round.score ?? 'N/A'}/100`}
                          {round.status === "rejected" && "Needs improvement"}
                        </p>
                      </div>

                      {/* Score Badge */}
                      {round.score !== undefined && (
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          round.score >= 80 && "bg-green-500/20 text-green-500",
                          round.score >= 50 && round.score < 80 && "bg-amber-500/20 text-amber-500",
                          round.score < 50 && "bg-destructive/20 text-destructive"
                        )}>
                          {round.score}%
                        </div>
                      )}

                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isRoundExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isRoundExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-3">
                            {/* Criteria */}
                            {round.criteria && round.criteria.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Quality Criteria
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {round.criteria.map((c, i) => (
                                    <span
                                      key={i}
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                                        c.passed 
                                          ? "bg-green-500/20 text-green-500" 
                                          : "bg-destructive/20 text-destructive"
                                      )}
                                    >
                                      {c.passed ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Feedback */}
                            {round.evaluatorFeedback && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Evaluator Feedback
                                </p>
                                <div className="rounded-md bg-background/50 p-3 text-xs text-muted-foreground">
                                  {round.evaluatorFeedback}
                                </div>
                              </div>
                            )}
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
