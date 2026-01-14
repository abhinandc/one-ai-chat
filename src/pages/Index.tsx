import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, TrendingUp, Clock, MessageSquare, Bot, Zap, Command, ArrowRight, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys, useActivityFeed, useUsageSummary } from "@/hooks/useSupabaseData";
import { ModelComparisonPanel } from "@/components/ModelComparisonPanel";

// Helper to convert name to sentence case (capitalize first letter of each word)
const toSentenceCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Index = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { models, loading: modelsLoading } = useModels(user?.email);
  const { data: virtualKeys } = useVirtualKeys(user?.email);
  const { data: activity } = useActivityFeed(user?.email, 5);
  const { data: usage } = useUsageSummary(user?.email);
  
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [spotlightFocused, setSpotlightFocused] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [comparisonQuery, setComparisonQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const comparisonModels = useMemo(() => {
    // Only use real models, no hardcoded fallbacks
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
      reason: getRecommendationReason(lowerQuery, recommended),
      action: "/chat?model=" + recommended.id + "&prompt=" + encodeURIComponent(query)
    });
  }, [models]);

  const getRecommendationReason = (query: string, model: any) => {
    if (query.includes("code")) return "Best for coding tasks";
    if (query.includes("chat")) return "Optimized for conversations";
    if (query.includes("analyze")) return "Great for data analysis";
    if (query.includes("write")) return "Perfect for content creation";
    return "General purpose model";
  };

  const handleSpotlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotlightQuery.trim()) return;

    // Don't show comparison if no real models are available
    if (models.length === 0) {
      // Navigate to chat instead
      navigate(`/chat?prompt=${encodeURIComponent(spotlightQuery)}`);
      return;
    }

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

  const stats = useMemo(() => [
    {
      label: "API Requests",
      value: usage.totalRequests || 0,
      change: "All time",
      icon: TrendingUp,
      color: "text-accent-blue"
    },
    {
      label: "Models Available",
      value: models.length,
      change: "Ready to use",
      icon: Bot,
      color: "text-accent-green"
    },
    {
      label: "Virtual Keys",
      value: virtualKeys.filter(k => !k.disabled).length,
      change: "Active",
      icon: Sparkles,
      color: "text-accent-orange"
    },
    {
      label: "Recent Activity",
      value: activity.length,
      change: "Last 24h",
      icon: Clock,
      color: "text-accent-purple"
    }
  ], [usage, models, virtualKeys, activity]);

  return (
    <div className="min-h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
        
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-text-primary tracking-tight">
            Welcome back, {toSentenceCase(user?.name || user?.email?.split("@")[0] || "User")}
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            What would you like to accomplish today?
          </p>
        </div>

        {/* Spotlight Search - Mac Style */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSpotlightSearch} className="relative">
            <div
              className={cn(
                "relative group transition-all duration-300",
                spotlightFocused && "scale-105"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-surface-graphite border border-border-primary rounded-2xl shadow-lg overflow-hidden dark:backdrop-blur-none">
                <div className="flex items-center p-6">
                  <Search className="h-6 w-6 text-text-secondary shrink-0" />
                  <input
                    type="text"
                    value={spotlightQuery}
                    onChange={(e) => {
                      setSpotlightQuery(e.target.value);
                      recommendModel(e.target.value);
                    }}
                    onFocus={() => setSpotlightFocused(true)}
                    onBlur={() => setTimeout(() => setSpotlightFocused(false), 200)}
                    placeholder="What's on your mind? Try out the best model."
                    className="flex-1 bg-transparent border-none outline-none text-lg text-text-primary placeholder:text-text-tertiary text-center focus:ring-0"
                    data-testid="input-spotlight-search"
                  />
                  <kbd className="px-2 py-1 text-xs font-semibold text-text-tertiary bg-surface-graphite border border-border-secondary/50 rounded shrink-0">
                    <Command className="h-3 w-3 inline" /> K
                  </kbd>
                </div>

                {/* AI Suggestion */}
                {aiSuggestion && spotlightQuery && (
                  <div className="border-t border-border-primary/30 p-4 bg-gradient-to-r from-accent-blue/5 to-accent-purple/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-blue/10 rounded-lg">
                          <Sparkles className="h-4 w-4 text-accent-blue" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Recommended: {aiSuggestion.model.id}
                          </p>
                          <p className="text-xs text-text-secondary">{aiSuggestion.reason}</p>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-accent-blue hover:bg-accent-blue/90"
                      >
                        Start <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Model Comparison Grid */}
        {isComparing && comparisonModels.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-text-primary truncate">
                  Comparing {comparisonModels.length} models
                </h2>
                <p className="text-sm text-text-secondary truncate">"{comparisonQuery}"</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="secondary">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonModels.map((model) => (
                <div key={model.id} className="h-80">
                  <ModelComparisonPanel
                    model={{ ...model, object: model.object || 'model' } as any}
                    query={comparisonQuery}
                    onComplete={handleComparisonComplete}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={stat.label} className="p-6 hover-lift">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className={cn("h-5 w-5", stat.color)} />
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-text-primary tabular-nums">
                      {modelsLoading && index === 1 ? "..." : stat.value}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: MessageSquare, title: "Start Chat", desc: "Begin AI conversation", href: "/chat", color: "accent-blue" },
            { icon: Bot, title: "Build Agent", desc: "Create custom workflow", href: "/agents", color: "accent-green" },
            { icon: Zap, title: "Playground", desc: "Experiment with models", href: "/playground", color: "accent-orange" }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <GlassCard
                key={action.href}
                className="p-6 hover-lift cursor-pointer group"
                onClick={() => navigate(action.href)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", `bg-${action.color}/10`)}>
                    <Icon className={cn("h-6 w-6", `text-${action.color}`)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-text-secondary">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-6">Recent Activity</h2>
          <GlassCard className="overflow-hidden">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity for {user?.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate("/chat")}
                >
                  Start Your First Chat
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border-primary/10">
                {activity.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 hover:bg-surface-graphite/20 transition-colors"
                  >
                    <div className="p-2 bg-accent-blue/10 rounded-lg">
                      <Zap className="h-4 w-4 text-accent-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {event.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default Index;
