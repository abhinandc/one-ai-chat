import React from "react";
import { Plus, Sparkles, Activity, Clock, Zap, Plug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutomationCard } from "./AutomationCard";
import { useAutomations } from "@/hooks/useAutomations";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AutomationsDashboardProps {
  onCreateClick: () => void;
  onIntegrationClick: () => void;
  onCardClick: (id: string) => void;
}

export function AutomationsDashboard({ onCreateClick, onIntegrationClick, onCardClick }: AutomationsDashboardProps) {
  const currentUser = useCurrentUser();
  const { automations, templates, loading, error } = useAutomations(currentUser?.email);

  // Map trigger types from template_data
  const getTriggerType = (trigger: string): "webhook" | "schedule" | "event" => {
    if (trigger === "webhook") return "webhook";
    if (trigger === "schedule") return "schedule";
    return "event";
  };

  // Combine user automations with templates for display
  const displayItems = [
    // User automations first
    ...automations.map(auto => {
      const triggerType = auto.trigger_config?.type;
      return {
        id: auto.id,
        name: auto.name,
        description: auto.description || '',
        triggerType: triggerType === "webhook" ? "webhook" as const :
                     triggerType === "schedule" ? "schedule" as const : "event" as const,
        actionCount: auto.total_runs || 0,
        status: auto.enabled ? "active" as const : "inactive" as const,
        lastRun: auto.last_run_at,
      };
    }),
    // Templates as available options (only show if user has no automations or as suggestions)
    ...templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      triggerType: getTriggerType(template.template_data?.trigger || "event"),
      actionCount: 0,
      status: "draft" as const,
    })),
  ];

  // Stats
  const activeCount = automations.filter(a => a.enabled).length;
  const totalRuns = automations.reduce((sum, a) => sum + (a.total_runs || 0), 0);

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 md:p-10 text-center shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:14px_24px] opacity-10 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent z-0" />
        
        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto gap-6">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                What would you like to automate?
            </h1>
            <div className="flex w-full gap-2">
                <div className="relative flex-1">
                    <Input 
                        placeholder="Describe a workflow, e.g. 'When a new lead arrives...'" 
                        className="h-12 bg-background border-input text-lg placeholder:text-muted-foreground/60 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                </div>
                <Button size="lg" className="h-12 rounded-xl text-primary-foreground shadow-lg">
                    Generate
                </Button>
            </div>
            
            <div className="flex gap-2.5 text-xs text-muted-foreground/80">
                <span>Try:</span>
                <button className="hover:text-primary transition-colors">"Summarize support tickets"</button>
                <span>•</span>
                <button className="hover:text-primary transition-colors">"Sync new Stripe customers"</button>
            </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricItem label="Active Automations" value={String(activeCount)} icon={Zap} trend={activeCount > 0 ? `+${activeCount}` : "0"} />
        <MetricItem label="Total Runs" value={totalRuns.toLocaleString()} icon={Activity} trend={totalRuns > 0 ? `${totalRuns}` : "0"} />
        <MetricItem label="Templates" value={String(templates.length)} icon={Clock} trend="available" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
             <Button onClick={onIntegrationClick} variant="outline" size="icon" className="h-10 w-10 border-border" title="Integrations">
                <Plug className="h-4 w-4" />
            </Button>
             <Button onClick={onCreateClick} variant="default" className="shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                New Automation
            </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No automations yet</p>
              <p className="text-sm">Create your first automation to get started</p>
            </div>
          ) : (
            displayItems.map(auto => (
              <AutomationCard
                  key={auto.id}
                  {...auto}
                  onClick={() => onCardClick(auto.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
}

function MetricItem({ label, value, icon: Icon, trend }: MetricItemProps) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </div>
        </div>
    )
}
