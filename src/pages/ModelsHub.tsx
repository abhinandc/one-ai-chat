import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Key,
  Bot,
  Zap,
  DollarSign,
  BarChart2,
  XCircle,
  Filter,
  LayoutGrid,
  List,
  GitCompare,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useModels, type ModelWithMetadata } from "@/services/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVirtualKeys } from "@/hooks/useSupabaseData";
import { useModelUsage } from "@/hooks/useModelUsage";

const ModelsHub = () => {
  const user = useCurrentUser();
  const { models, loading, error, refetch } = useModels();
  const { data: virtualKeys, loading: keysLoading } = useVirtualKeys(user?.email);
  const { usage, loading: usageLoading } = useModelUsage(user?.email);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [compareModels, setCompareModels] = useState<string[]>([]);

  // Get all unique providers
  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    models.forEach((model) => {
      const provider = model.metadata?.provider ?? model.owned_by ?? "unknown";
      providerSet.add(provider);
    });
    return ["all", ...Array.from(providerSet)];
  }, [models]);

  // Filter and group models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch = model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (model.metadata?.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvider = selectedProvider === "all" ||
                             (model.metadata?.provider ?? model.owned_by) === selectedProvider;
      return matchesSearch && matchesProvider;
    });
  }, [models, searchQuery, selectedProvider]);

  const groupedByProvider = useMemo(() => {
    const groups = new Map<string, typeof models>();
    filteredModels.forEach((model) => {
      const provider = model.metadata?.provider ?? model.owned_by ?? "unknown";
      if (!groups.has(provider)) {
        groups.set(provider, []);
      }
      groups.get(provider)?.push(model);
    });
    return Array.from(groups.entries());
  }, [filteredModels]);

  // Get usage for a specific model
  const getModelUsage = (modelId: string) => {
    return usage.find((u) => u.model === modelId);
  };

  // Toggle model comparison
  const toggleCompare = (modelId: string) => {
    setCompareModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), modelId];
      }
      return [...prev, modelId];
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate total stats
  const totalStats = useMemo(() => {
    return usage.reduce(
      (acc, u) => ({
        requests: acc.requests + u.totalRequests,
        tokens: acc.tokens + u.totalTokens,
        cost: acc.cost + u.totalCost,
      }),
      { requests: 0, tokens: 0, cost: 0 }
    );
  }, [usage]);

  // Get selected models for comparison
  const selectedModelsForComparison = useMemo(() => {
    return compareModels.map((id) => models.find((m) => m.id === id)).filter(Boolean) as ModelWithMetadata[];
  }, [compareModels, models]);

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Models Hub</h1>
            <p className="text-muted-foreground">
              Manage your AI model access, view usage statistics, and compare capabilities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              loading={loading}
            >
              {!loading && (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent("open-api-keys"))}
            >
              <Key className="h-4 w-4 mr-2" />
              Manage Keys
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Models Available</p>
                <p className="text-2xl font-bold text-foreground">{models.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{totalStats.requests.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <BarChart2 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">{(totalStats.tokens / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">${totalStats.cost.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Virtual Keys Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-500" />
            Your Virtual Keys
          </h2>

          {keysLoading ? (
            <Card className="p-6">
              {/* Skeleton loader - NO spinners per Constitution */}
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                <div className="w-40 h-4 rounded bg-muted animate-pulse" />
              </div>
            </Card>
          ) : virtualKeys.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No Virtual Keys Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No virtual keys were found for {user?.email || "your account"}.
                </p>
                <Button variant="outline" size="sm">
                  Request Access
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {virtualKeys.map((key) => (
                <Card key={key.id} className="p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-foreground">{key.label || "Virtual Key"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created: {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={key.disabled ? "destructive" : "secondary"}>
                      {key.disabled ? "Disabled" : "Active"}
                    </Badge>
                  </div>

                  {key.budget_usd && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Budget Used</span>
                        <span className="text-muted-foreground">${key.budget_usd} limit</span>
                      </div>
                      <Progress value={30} className="h-1.5" />
                    </div>
                  )}

                  {key.models_json && key.models_json.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {key.models_json.slice(0, 5).map((model) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                      {key.models_json.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.models_json.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Model Comparison */}
        {compareModels.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                Model Comparison ({compareModels.length}/3)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareModels([])}
              >
                Clear Selection
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedModelsForComparison.map((model) => {
                const modelUsage = getModelUsage(model.id);
                return (
                  <Card key={model.id} className="p-5 border-primary/30">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{model.id}</h3>
                          <p className="text-xs text-muted-foreground uppercase">
                            {model.metadata?.provider || model.owned_by}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleCompare(model.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Context Window</span>
                          <span className="text-foreground font-medium">
                            {model.metadata?.maxTokens ? `${(model.metadata.maxTokens / 1000).toFixed(0)}K` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Requests</span>
                          <span className="text-foreground font-medium">
                            {modelUsage?.totalRequests || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Latency</span>
                          <span className="text-foreground font-medium">
                            {modelUsage?.avgLatency ? `${modelUsage.avgLatency}ms` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate</span>
                          <span className={cn(
                            "font-medium",
                            (modelUsage?.successRate || 100) >= 95 ? "text-green-600" : "text-orange-500"
                          )}>
                            {modelUsage?.successRate || 100}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost</span>
                          <span className="text-foreground font-medium">
                            ${modelUsage?.totalCost?.toFixed(3) || "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Model Catalog */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-foreground">Model Catalog</h2>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Provider Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedProvider === "all" ? "All Providers" : selectedProvider}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {providers.map((provider) => (
                    <DropdownMenuItem
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                      className="capitalize"
                    >
                      {provider === "all" ? "All Providers" : provider}
                      {selectedProvider === provider && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode */}
              <div className="flex items-center border border-border rounded-lg p-0.5">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <Card className="p-6">
              {/* Skeleton loader - NO spinners per Constitution */}
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                <div className="w-32 h-4 rounded bg-muted animate-pulse" />
              </div>
            </Card>
          ) : error ? (
            <Card className="p-6 border-orange-500/40 bg-orange-500/5">
              <p className="text-sm text-orange-500">{error}</p>
            </Card>
          ) : filteredModels.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-4">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium text-foreground mb-1">No Models Found</h3>
                <p className="text-sm text-muted-foreground">
                  {models.length === 0
                    ? "No models are currently exposed. Check back after an administrator publishes them."
                    : "No models match your search criteria."
                  }
                </p>
              </div>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="space-y-8">
              {groupedByProvider.map(([provider, providerModels]) => (
                <div key={provider} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground capitalize">{provider}</h3>
                    <span className="text-xs text-muted-foreground">{providerModels.length} model(s)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providerModels.map((model) => {
                      const modelUsage = getModelUsage(model.id);
                      const isSelected = compareModels.includes(model.id);

                      return (
                        <Card
                          key={model.id}
                          className={cn(
                            "p-5 hover:border-primary/30 transition-colors cursor-pointer",
                            isSelected && "border-primary/50 bg-primary/5"
                          )}
                          onClick={() => toggleCompare(model.id)}
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-foreground truncate">{model.id}</h4>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">{model.object}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {model.metadata?.maxTokens ? `${(model.metadata.maxTokens / 1000).toFixed(0)}K` : "Flex"}
                                </Badge>
                              </div>
                            </div>

                            {model.metadata?.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {model.metadata.description}
                              </p>
                            )}

                            {/* Usage Stats */}
                            {modelUsage && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-foreground">{modelUsage.totalRequests}</p>
                                  <p className="text-xs text-muted-foreground">Requests</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-foreground">${modelUsage.totalCost.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground">Cost</p>
                                </div>
                              </div>
                            )}

                            {!modelUsage && (
                              <div className="text-center py-2 border-t border-border">
                                <p className="text-xs text-muted-foreground">No usage data yet</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Model</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Provider</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Context</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Requests</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Cost</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model) => {
                    const modelUsage = getModelUsage(model.id);
                    const isSelected = compareModels.includes(model.id);

                    return (
                      <tr
                        key={model.id}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => toggleCompare(model.id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            <span className="font-medium text-foreground">{model.id}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-muted-foreground capitalize">
                            {model.metadata?.provider || model.owned_by}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-xs">
                            {model.metadata?.maxTokens ? `${(model.metadata.maxTokens / 1000).toFixed(0)}K` : "Flex"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-foreground">{modelUsage?.totalRequests || 0}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-foreground">${modelUsage?.totalCost?.toFixed(2) || "0.00"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-muted-foreground">{formatRelativeTime(modelUsage?.lastUsed || null)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default ModelsHub;
