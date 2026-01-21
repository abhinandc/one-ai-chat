import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Clock, MessageSquare, Bot, Zap, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys, useActivityFeed, useUsageSummary } from "@/hooks/useSupabaseData";
import { useModelRanking } from "@/hooks/useModelRanking";
import { HomeAIInput } from "@/components/home/HomeAIInput";
import { MultiModelComparison } from "@/components/home/MultiModelComparison";
import { useToast } from "@/hooks/use-toast";

// Helper to convert name to sentence case
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
  const { toast } = useToast();
  const { models, loading: modelsLoading } = useModels(user?.email);
  const { data: virtualKeys } = useVirtualKeys(user?.email);
  const { data: activity } = useActivityFeed(user?.email, 5);
  const { data: usage } = useUsageSummary(user?.email);
  const { fetchRankedModels, analyzeQueryType } = useModelRanking();

  const [comparisonQuery, setComparisonQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [smartModels, setSmartModels] = useState<typeof models>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Get 4 best models for comparison
  const comparisonModels = useMemo(() => {
    if (models.length === 0) return [];
    const seenProviders = new Set<string>();
    const diverse: typeof models = [];

    for (const model of models) {
      const provider = model.owned_by || model.id.split('/')[0] || 'unknown';
      if (!seenProviders.has(provider) && diverse.length < 4) {
        seenProviders.add(provider);
        diverse.push(model);
      }
    }

    if (diverse.length < 4) {
      for (const model of models) {
        if (!diverse.includes(model) && diverse.length < 4) {
          diverse.push(model);
        }
      }
    }

    return diverse;
  }, [models]);

  const handleSendQuery = async (query: string) => {
    if (comparisonModels.length === 0) {
      navigate(`/chat?prompt=${encodeURIComponent(query)}`);
      return;
    }

    setIsFetchingModels(true);
    setComparisonQuery(query);
    const queryType = analyzeQueryType(query);

    try {
      const result = await fetchRankedModels(queryType, 4);

      if (result.message === 'no_image_models') {
        setIsFetchingModels(false);
        setComparisonQuery("");
        toast({
          title: "No Image Generation Models Available",
          description: result.userMessage || "Image generation models are not enabled for your account.",
          variant: "destructive",
        });
        return;
      }

      if (result.models.length > 0) {
        const mappedModels = result.models.map(rm => {
          const existingModel = models.find(m => m.id === rm.id || m.id === rm.name);
          return existingModel || {
            id: rm.name || rm.id,
            object: "model" as const,
            owned_by: rm.provider,
            created: Date.now(),
          };
        });
        setSmartModels(mappedModels);
      } else {
        setSmartModels(comparisonModels);
      }
    } catch {
      setSmartModels(comparisonModels);
    } finally {
      setIsFetchingModels(false);
    }

    setIsComparing(true);
  };

  const handleCloseComparison = () => {
    setIsComparing(false);
    setComparisonQuery("");
    setSmartModels([]);
  };

  const stats = useMemo(() => [
    { label: "API Requests", value: usage.totalRequests || 0, change: "All time", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Models Available", value: models.length, change: "Ready to use", icon: Bot, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Virtual Keys", value: virtualKeys.filter(k => !k.disabled).length, change: "Active", icon: Sparkles, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Recent Activity", value: activity.length, change: "Last 24h", icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" }
  ], [usage, models, virtualKeys, activity]);

  // Loading skeleton
  if (!user || modelsLoading) {
    return (
      <div className="min-h-full bg-background overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 animate-pulse" />
            <div className="h-12 w-64 mx-auto rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="h-14 max-w-3xl mx-auto rounded-2xl bg-muted animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
        <AnimatePresence mode="wait">
          {!isComparing ? (
            <motion.div
              key="home-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {/* Welcome Header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Welcome back</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                    {toSentenceCase(user?.name || user?.email?.split("@")[0] || "User")}
                  </h1>
                </div>
              </div>

              {/* AI Input */}
              <HomeAIInput onSend={handleSendQuery} isLoading={isFetchingModels} />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <GlassCard key={stat.label} className="p-5 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={cn("p-2 rounded-lg", stat.bg)}>
                            <Icon className={cn("h-4 w-4", stat.color)} />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {stat.change}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-foreground tabular-nums">
                            {stat.value.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: MessageSquare, title: "Start Chat", desc: "Begin AI conversation", href: "/chat", color: "text-blue-500", bg: "bg-blue-500/10" },
                    { icon: Bot, title: "Build Agent", desc: "Create custom workflow", href: "/agents", color: "text-green-500", bg: "bg-green-500/10" },
                    { icon: Zap, title: "Playground", desc: "Experiment with models", href: "/playground", color: "text-orange-500", bg: "bg-orange-500/10" }
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <GlassCard
                        key={action.href}
                        className="p-5 cursor-pointer group hover:shadow-md transition-all hover:border-primary/30"
                        onClick={() => navigate(action.href)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl transition-colors", action.bg, "group-hover:bg-primary/15")}>
                            <Icon className={cn("h-5 w-5", action.color)} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.desc}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </h2>
                <GlassCard className="overflow-hidden">
                  {activity.length === 0 ? (
                    <div className="p-8 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground mb-4">No recent activity yet</p>
                      <Button variant="default" size="sm" onClick={() => navigate("/chat")}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Your First Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {activity.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {event.action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="comparison-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MultiModelComparison
                query={comparisonQuery}
                models={(smartModels.length > 0 ? smartModels : comparisonModels) as any}
                onClose={handleCloseComparison}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
