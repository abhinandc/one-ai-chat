import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Clock, MessageSquare, Bot, Zap, ArrowRight, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys, useActivityFeed, useUsageSummary } from "@/hooks/useSupabaseData";
import { ModelComparisonPanel } from "@/components/ModelComparisonPanel";
import { AIInput } from "@/components/chat/AIInput";

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
  const [comparisonQuery, setComparisonQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const comparisonModels = useMemo(() => {
    // Only use real models, no hardcoded fallbacks
    return models.slice(0, 4);
  }, [models]);

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

        {/* AI Chat Input */}
        <div className="max-w-3xl mx-auto">
          <AIInput
            onSend={(message) => {
              setSpotlightQuery(message);
              if (models.length === 0) {
                navigate(`/chat?prompt=${encodeURIComponent(message)}`);
                return;
              }
              setComparisonQuery(message);
              setIsComparing(true);
              setCompletedCount(0);
            }}
            placeholder="What's on your mind?"
            className="[&_textarea]:text-lg [&_textarea]:placeholder:text-lg"
          />
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
