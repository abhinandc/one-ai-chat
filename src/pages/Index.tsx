import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  MessageSquare,
  Bot,
  Wallet,
  Command,
  ArrowRight,
  X,
  Activity,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys, useActivityFeed } from "@/hooks/useSupabaseData";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { ModelComparisonPanel } from "@/components/ModelComparisonPanel";
import { MetricCard, QuickActionsGrid, RecentActivity } from "@/components/dashboard";
import {
  fadeInUp,
  staggerContainer,
  scaleIn,
  TIMING,
} from "@/lib/animations";

const Index = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { models, loading: modelsLoading } = useModels();
  const { data: virtualKeys } = useVirtualKeys(user?.email);
  const { data: activity, loading: activityLoading } = useActivityFeed(user?.email, 10);
  const { metrics, loading: metricsLoading } = useDashboardMetrics(user?.email);

  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [spotlightFocused, setSpotlightFocused] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    model: { id: string };
    reason: string;
    action: string;
  } | null>(null);
  const [comparisonQuery, setComparisonQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for spotlight (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSpotlightFocused(true);
      }
      if (e.key === "Escape" && spotlightFocused) {
        inputRef.current?.blur();
        setSpotlightFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spotlightFocused]);

  // Only use real models from virtual keys - no dummy data
  const comparisonModels = useMemo(() => {
    // Return top 4 models from actual virtual keys
    return models.slice(0, 4);
  }, [models]);

  // AI-powered model recommendation
  const recommendModel = useCallback((query: string) => {
    if (!query.trim() || models.length === 0) {
      setAiSuggestion(null);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let recommended = null;

    // Intelligent model selection based on task
    if (lowerQuery.includes("code") || lowerQuery.includes("program") || lowerQuery.includes("debug")) {
      recommended = models.find(m => m.id.includes("code") || m.id.includes("deepseek")) || models[0];
    } else if (lowerQuery.includes("chat") || lowerQuery.includes("talk") || lowerQuery.includes("conversation")) {
      recommended = models.find(m => m.id.includes("gpt") || m.id.includes("chat")) || models[0];
    } else if (lowerQuery.includes("analyze") || lowerQuery.includes("data") || lowerQuery.includes("report")) {
      recommended = models.find(m => m.id.includes("analyst") || m.id.includes("qwen")) || models[0];
    } else if (lowerQuery.includes("write") || lowerQuery.includes("content") || lowerQuery.includes("article")) {
      recommended = models.find(m => m.id.includes("writer") || m.id.includes("llama")) || models[0];
    } else {
      recommended = models[0];
    }

    setAiSuggestion({
      model: recommended,
      reason: getRecommendationReason(lowerQuery),
      action: "/chat?model=" + recommended.id + "&prompt=" + encodeURIComponent(query)
    });
  }, [models]);

  const getRecommendationReason = (query: string) => {
    if (query.includes("code")) return "Best for coding tasks";
    if (query.includes("chat")) return "Optimized for conversations";
    if (query.includes("analyze")) return "Great for data analysis";
    if (query.includes("write")) return "Perfect for content creation";
    return "General purpose model";
  };

  const handleSpotlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotlightQuery.trim()) return;

    setComparisonQuery(spotlightQuery);
    setIsComparing(true);
    setCompletedCount(0);
  };

  const handleComparisonComplete = useCallback(() => {
    setCompletedCount(prev => prev + 1);
  }, []);

  const handleCloseComparison = () => {
    setIsComparing(false);
    setComparisonQuery("");
    setSpotlightQuery("");
    setCompletedCount(0);
  };

  const handleSelectModel = (modelId: string) => {
    // Navigate to chat with the query and selected model
    navigate(`/chat?model=${modelId}&prompt=${encodeURIComponent(comparisonQuery)}`);
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value < 0.01) return '<$0.01';
    return `$${value.toFixed(2)}`;
  };

  // Get sparkline data for metrics
  const sparklineData = useMemo(() => {
    const daily = metrics.trends.daily || [];
    return {
      requests: daily.map(d => d.requests),
      tokens: daily.map(d => d.tokens),
      cost: daily.map(d => d.cost),
    };
  }, [metrics.trends.daily]);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-full bg-background overflow-y-auto">
      <motion.div
        className="max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-8 md:space-y-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.div variants={fadeInUp} className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {greeting}, {user?.name || user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            What would you like to accomplish today?
          </p>
        </motion.div>

        {/* Spotlight Search - Mac Style */}
        <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
          <form onSubmit={handleSpotlightSearch} className="relative">
            <motion.div
              className="relative group"
              animate={{
                scale: spotlightFocused ? 1.02 : 1,
              }}
              transition={{ duration: TIMING.fast }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: spotlightFocused ? 0.8 : 0 }}
                transition={{ duration: TIMING.normal }}
              />

              <div className="relative bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
                <div className="flex items-center p-4 md:p-6">
                  <motion.div
                    animate={{ rotate: spotlightFocused ? 360 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Search className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground shrink-0" />
                  </motion.div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={spotlightQuery}
                    onChange={(e) => {
                      setSpotlightQuery(e.target.value);
                      recommendModel(e.target.value);
                    }}
                    onFocus={() => setSpotlightFocused(true)}
                    onBlur={() => setTimeout(() => setSpotlightFocused(false), 200)}
                    placeholder="Ask anything... Compare models side by side"
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-foreground placeholder:text-muted-foreground text-center focus:ring-0 px-4"
                    data-testid="input-spotlight-search"
                  />
                  <kbd className="hidden sm:flex px-2.5 py-1.5 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded-lg shrink-0 items-center gap-1 hover:bg-accent transition-colors">
                    <Command className="h-3 w-3" /> K
                  </kbd>
                </div>

                {/* AI Suggestion */}
                <AnimatePresence>
                  {aiSuggestion && spotlightQuery && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: TIMING.fast }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <motion.div
                              className="p-2 bg-primary/10 rounded-lg shrink-0"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="h-4 w-4 text-primary" />
                            </motion.div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                Recommended: {aiSuggestion.model.id}
                              </p>
                              <p className="text-xs text-muted-foreground">{aiSuggestion.reason}</p>
                            </div>
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-primary hover:bg-primary/90 shrink-0 gap-1"
                          >
                            Compare
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </form>
        </motion.div>

        {/* Model Comparison Grid */}
        <AnimatePresence mode="wait">
          {isComparing && comparisonModels.length > 0 && (
            <motion.div
              key="comparison"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-foreground truncate">
                    Comparing {comparisonModels.length} models
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">"{comparisonQuery}"</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "transition-colors",
                      completedCount === comparisonModels.length && "bg-green-500/10 text-green-600"
                    )}
                  >
                    {completedCount === comparisonModels.length && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {completedCount}/{comparisonModels.length} complete
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCloseComparison}
                    data-testid="button-close-comparison"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {comparisonModels.map((model, index) => (
                  <motion.div
                    key={model.id}
                    className="h-80 relative group"
                    variants={fadeInUp}
                    custom={index}
                  >
                    <ModelComparisonPanel
                      model={model}
                      query={comparisonQuery}
                      onComplete={handleComparisonComplete}
                    />
                    {/* Select this response button */}
                    <motion.div
                      className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <Button
                        size="sm"
                        onClick={() => handleSelectModel(model.id)}
                        className="bg-primary hover:bg-primary/90 shadow-lg"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Use this response
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Grid */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <MetricCard
            title="Today's Messages"
            value={metrics.today.messages}
            subtitle="Sent today"
            icon={MessageSquare}
            iconColor="text-primary"
            trend={metrics.trends.weeklyChange !== 0 ? {
              value: metrics.trends.weeklyChange,
              label: "vs last week"
            } : undefined}
            sparklineData={sparklineData.requests}
            sparklineColor="hsl(var(--primary))"
            loading={metricsLoading}
          />

          <MetricCard
            title="Models Available"
            value={modelsLoading ? "..." : models.length}
            subtitle="Ready to use"
            icon={Bot}
            iconColor="text-green-600"
            loading={modelsLoading}
          />

          <MetricCard
            title="Virtual Keys"
            value={virtualKeys.filter(k => !k.disabled).length}
            subtitle="Active keys"
            icon={Activity}
            iconColor="text-orange-600"
          />

          <MetricCard
            title="Budget Used"
            value={metrics.budget.total
              ? `${metrics.budget.percentage}%`
              : formatCurrency(metrics.budget.used)
            }
            subtitle={metrics.budget.total
              ? `${formatCurrency(metrics.budget.used)} of ${formatCurrency(metrics.budget.total)}`
              : "This week"
            }
            icon={Wallet}
            iconColor="text-purple-600"
            sparklineData={sparklineData.cost}
            sparklineColor="hsl(var(--chart-4))"
            loading={metricsLoading}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <QuickActionsGrid
            recentConversation={activity[0] ? {
              id: (activity[0].metadata as { conversationId?: string })?.conversationId || 'recent',
              title: activity[0].action.replace(/_/g, ' '),
            } : undefined}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeInUp}>
          <RecentActivity
            activities={activity}
            loading={activityLoading}
            onViewAll={() => navigate('/chat')}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
