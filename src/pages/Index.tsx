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
import { HomeAIInput } from "@/components/home/HomeAIInput";
import { MultiModelComparison } from "@/components/home/MultiModelComparison";

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
  
  const [comparisonQuery, setComparisonQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);

  // Get 4 best models for comparison (prioritize diverse providers)
  const comparisonModels = useMemo(() => {
    if (models.length === 0) return [];
    
    // Try to get models from different providers for diversity
    const seenProviders = new Set<string>();
    const diverse: typeof models = [];
    
    for (const model of models) {
      const provider = model.owned_by || model.id.split('/')[0] || 'unknown';
      if (!seenProviders.has(provider) && diverse.length < 4) {
        seenProviders.add(provider);
        diverse.push(model);
      }
    }
    
    // If we don't have 4 diverse, fill with remaining
    if (diverse.length < 4) {
      for (const model of models) {
        if (!diverse.includes(model) && diverse.length < 4) {
          diverse.push(model);
        }
      }
    }
    
    return diverse;
  }, [models]);

  const handleSendQuery = (query: string) => {
    if (comparisonModels.length === 0) {
      // No models available, go directly to chat
      navigate(`/chat?prompt=${encodeURIComponent(query)}`);
      return;
    }
    setComparisonQuery(query);
    setIsComparing(true);
  };

  const handleCloseComparison = () => {
    setIsComparing(false);
    setComparisonQuery("");
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
        
        <AnimatePresence mode="wait">
          {!isComparing ? (
            <motion.div
              key="home-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Welcome Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-3"
              >
                <h1 className="text-5xl font-bold text-foreground tracking-tight">
                  Welcome back, {toSentenceCase(user?.name || user?.email?.split("@")[0] || "User")}
                </h1>
              </motion.div>

              {/* AI Chat Input - Placeholder is the question */}
              <HomeAIInput onSend={handleSendQuery} />

              {/* Stats Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
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
                          <div className="text-3xl font-bold text-foreground tabular-nums">
                            {modelsLoading && index === 1 ? "..." : stat.value}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
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
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{action.desc}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </GlassCard>
                  );
                })}
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Activity</h2>
                <GlassCard className="overflow-hidden">
                  {activity.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
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
                    <div className="divide-y divide-border/50">
                      {activity.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {event.action.replace(/_/g, " ")}
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
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="comparison-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MultiModelComparison
                query={comparisonQuery}
                models={comparisonModels as any}
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
