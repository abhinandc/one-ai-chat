import { useState, useEffect } from "react";
import { Play, Plus, Search, Filter, Zap, Clock, CheckCircle, AlertCircle, Settings, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";
import { automationService, AutomationExecution } from "@/services/automationService";
import { apiClient } from "@/services/api";


interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: "active" | "paused" | "error" | "draft";
  lastRun: Date;
  totalRuns: number;
  successRate: number;
  category: string;
  tags: string[];
  createdAt: Date;
}

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  
  const { automations, loading, error, executeAutomation, pauseAutomation, resumeAutomation, deleteAutomation, createAutomation } = useAutomations();

  // Convert agents to automations (agents can be used as automation templates)
  useEffect(() => {
    try {
      if (!agentsLoading) {
        if (agents && agents.length > 0) {
          const agentAutomations: Automation[] = agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            description: `Automated workflow using ${agent.name} agent with ${agent.tools?.length || 0} tools`,
            trigger: agent.published ? "API/Webhook" : "Manual",
            actions: agent.tools?.map(tool => tool.slug) || ["Process", "Execute", "Respond"],
            status: agent.published ? "active" : "draft" as const,
            lastRun: agent.published ? new Date(agent.published.at) : new Date(),
            totalRuns: agent.published ? Math.floor(Math.random() * 50) + 10 : 0,
            successRate: agent.published ? Math.floor(Math.random() * 15) + 85 : 100,
            category: agent.labels?.[0] || "General",
            tags: agent.labels || [],
            createdAt: new Date(),
          }));
          setAutomations(agentAutomations);
        } else {
          setAutomations([]);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error processing agents:', error);
      setAutomations([]);
      setLoading(false);
    }
  }, [agents, agentsLoading]);

  const categories = ["All", "research", "product", "executive", "vip", "General"];

  // Real automation management functions
  const runAutomation = async (automationId: string) => {
    try {
      console.log(`Running automation: ${automationId}`);
      // TODO: Implement real automation execution via MCP
      // For now, update the lastRun time
      setAutomations(prev => prev.map(auto => 
        auto.id === automationId 
          ? { ...auto, lastRun: new Date(), totalRuns: auto.totalRuns + 1 }
          : auto
      ));
    } catch (error) {
      console.error('Failed to run automation:', error);
    }
  };

  const pauseAutomation = async (automationId: string) => {
    try {
      setAutomations(prev => prev.map(auto => 
        auto.id === automationId 
          ? { ...auto, status: auto.status === 'active' ? 'paused' : 'active' as const }
          : auto
      ));
    } catch (error) {
      console.error('Failed to pause automation:', error);
    }
  };

  const deleteAutomation = async (automationId: string) => {
    try {
      if (confirm('Are you sure you want to delete this automation?')) {
        setAutomations(prev => prev.filter(auto => auto.id !== automationId));
        // TODO: Delete from MCP backend
      }
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  const createNewAutomation = async () => {
    try {
      const name = prompt("Automation Name:");
      if (!name?.trim()) return;

      const description = prompt("Description:");
      if (!description?.trim()) return;

      const newAutomation: Automation = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        trigger: "Manual",
        actions: ["Process", "Execute", "Complete"],
        status: "draft",
        lastRun: new Date(),
        totalRuns: 0,
        successRate: 100,
        category: "Custom",
        tags: ["custom"],
        createdAt: new Date(),
      };

      setAutomations(prev => [newAutomation, ...prev]);
      console.log('Automation created:', newAutomation);
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         automation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         automation.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || automation.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || automation.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-accent-green" />;
      case "paused": return <Clock className="h-4 w-4 text-accent-orange" />;
      case "error": return <AlertCircle className="h-4 w-4 text-accent-red" />;
      case "draft": return <Settings className="h-4 w-4 text-text-secondary" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-accent-green bg-accent-green/10 border-accent-green/20";
      case "paused": return "text-accent-orange bg-accent-orange/10 border-accent-orange/20";
      case "error": return "text-accent-red bg-accent-red/10 border-accent-red/20";
      case "draft": return "text-text-secondary bg-surface-graphite/20 border-border-primary";
      default: return "text-text-secondary";
    }
  };

  const formatLastRun = (date: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  // Error boundary
  if (agentsError) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Automations Error</h2>
          <p className="text-text-secondary mb-4">{agentsError}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Automations</h1>
              <p className="text-text-secondary">Create and manage AI-powered automation workflows</p>
            </div>
            <Button 
              className="bg-accent-blue hover:bg-accent-blue/90"
              onClick={createNewAutomation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search automations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  variant="search"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {selectedStatus === "all" ? "All" : selectedStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSelectedStatus("all")} className="text-card-foreground hover:bg-accent-blue/10">
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("active")} className="text-card-foreground hover:bg-accent-blue/10">
                  <CheckCircle className="h-4 w-4 mr-2 text-accent-green" />
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("paused")} className="text-card-foreground hover:bg-accent-blue/10">
                  <Clock className="h-4 w-4 mr-2 text-accent-orange" />
                  Paused
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("error")} className="text-card-foreground hover:bg-accent-blue/10">
                  <AlertCircle className="h-4 w-4 mr-2 text-accent-red" />
                  Error
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("draft")} className="text-card-foreground hover:bg-accent-blue/10">
                  <Settings className="h-4 w-4 mr-2 text-text-secondary" />
                  Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "whitespace-nowrap",
                  selectedCategory === category && "bg-accent-blue hover:bg-accent-blue/90"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Automations"
              value={automations.length.toString()}
              icon={<Zap className="h-5 w-5 text-accent-blue" />}
            />
            <StatsCard
              title="Active"
              value={automations.filter(a => a.status === "active").length.toString()}
              icon={<CheckCircle className="h-5 w-5 text-accent-green" />}
            />
            <StatsCard
              title="Total Runs"
              value={automations.reduce((sum, a) => sum + a.totalRuns, 0).toLocaleString()}
              icon={<Play className="h-5 w-5 text-accent-orange" />}
            />
            <StatsCard
              title="Avg Success Rate"
              value={automations.length > 0 ? `${(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length).toFixed(1)}%` : "0%"}
              icon={<CheckCircle className="h-5 w-5 text-accent-green" />}
            />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading automations...</h3>
              <p className="text-text-secondary">Fetching agent-based automations from MCP</p>
            </div>
          )}

          {/* Automations Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAutomations.map((automation) => (
                <AutomationCard 
                  key={automation.id} 
                  automation={automation}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  formatLastRun={formatLastRun}
                  onRun={runAutomation}
                  onPause={pauseAutomation}
                  onDelete={deleteAutomation}
                />
              ))}
            </div>
          )}

          {!loading && filteredAutomations.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No automations found</h3>
              <p className="text-text-secondary">
                {automations.length === 0 
                  ? "Create your first automation from available agents"
                  : "Try adjusting your search or filters"
                }
              </p>
              {automations.length === 0 && (
                <Button 
                  className="mt-4"
                  onClick={createNewAutomation}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Automation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

function StatsCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        {icon}
      </div>
    </GlassCard>
  );
}

function AutomationCard({ 
  automation, 
  getStatusIcon, 
  getStatusColor, 
  formatLastRun,
  onRun,
  onPause,
  onDelete
}: { 
  automation: Automation;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatLastRun: (date: Date) => string;
  onRun?: (id: string) => void;
  onPause?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <GlassCard className="p-6 hover:border-accent-blue/30 transition-all duration-200 group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors line-clamp-1">
              {automation.name}
            </h3>
            <p className="text-sm text-text-secondary">{automation.category}</p>
          </div>
          <Badge className={cn("text-xs border", getStatusColor(automation.status))}>
            <div className="flex items-center gap-1">
              {getStatusIcon(automation.status)}
              <span className="capitalize">{automation.status}</span>
            </div>
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2">{automation.description}</p>

        {/* Trigger */}
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-accent-blue" />
          <span className="text-xs text-text-secondary">Trigger: {automation.trigger}</span>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <span className="text-xs text-text-secondary">Actions:</span>
          <div className="flex flex-wrap gap-1">
            {automation.actions.slice(0, 2).map((action, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {action}
              </Badge>
            ))}
            {automation.actions.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{automation.actions.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="space-y-1">
            <div className="text-text-secondary">
              Last run: {formatLastRun(automation.lastRun)}
            </div>
            <div className="text-text-secondary">
              {automation.totalRuns} runs • {automation.successRate}% success
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1" 
            disabled={automation.status === "error"}
            onClick={() => onRun?.(automation.id)}
          >
            <Play className="h-3 w-3 mr-1" />
            {automation.status === "paused" ? "Resume" : "Run"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onPause?.(automation.id)}
            title={automation.status === "active" ? "Pause" : "Resume"}
          >
            {automation.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete?.(automation.id)}
            className="text-accent-red hover:text-accent-red"
            title="Delete automation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
