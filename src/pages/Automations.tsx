import { useState } from "react";
import { Play, Plus, Search, Filter, Zap, Clock, CheckCircle, AlertCircle, Settings, Pause, Trash2, AlertTriangle } from "lucide-react";
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
import { useAutomations } from "@/hooks/useAutomations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { CreateAutomationModal } from "@/components/modals/CreateAutomationModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categories = ["All", "research", "product", "executive", "vip", "General"];

export default function Automations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const user = useCurrentUser();
  const { 
    automations, 
    loading, 
    error, 
    executeAutomation, 
    deleteAutomation, 
    createAutomation 
  } = useAutomations(user?.email);

  const handleRunAutomation = async (automationId: string) => {
    try {
      const execution = await executeAutomation(automationId, {
        timestamp: new Date().toISOString(),
        source: "manual_trigger"
      });
      
      toast({
        title: "Automation Executed",
        description: `Automation completed with status: ${execution.status}`,
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Failed to execute automation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    setAutomationToDelete(automationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!automationToDelete) return;
    
    try {
      await deleteAutomation(automationToDelete);
      toast({
        title: "Automation Deleted",
        description: "Automation has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to Delete",
        description: error instanceof Error ? error.message : "Failed to delete automation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAutomationToDelete(null);
    }
  };

  const handleCreateAutomation = async (data: { name: string; description: string }) => {
    try {
      await createAutomation(data);
      toast({
        title: "Automation Created",
        description: `"${data.name}" has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to Create",
        description: error instanceof Error ? error.message : "Failed to create automation",
        variant: "destructive",
      });
    }
  };

  const filteredAutomations = automations.filter((auto) => {
    const matchesSearch = auto.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || auto.name.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "active" && auto.enabled) ||
      (selectedStatus === "paused" && !auto.enabled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Automations Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
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
      <div className="px-6 py-6 border-b border-border-secondary/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Automations</h1>
            <p className="text-text-secondary mt-1">
              Manage and monitor your automated workflows
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-accent-green text-white hover:bg-accent-green/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <GlassInput
              placeholder="Search automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              variant="search"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Category: {selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Status: {selectedStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("paused")}>Paused</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
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
                  onRun={handleRunAutomation}
                  onDelete={handleDeleteAutomation}
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
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAutomationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateAutomation}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the automation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-accent-red hover:bg-accent-red/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AutomationCard({ automation, onRun, onDelete }: { automation: any; onRun: (id: string) => void; onDelete: (id: string) => void }) {
  const getStatusIcon = () => {
    if (automation.enabled) {
      return <CheckCircle className="h-4 w-4 text-accent-green" />;
    }
    return <Pause className="h-4 w-4 text-accent-orange" />;
  };

  const getRelativeTime = (date?: string) => {
    if (!date) return "Never";
    try {
      const now = new Date();
      const then = new Date(date);
      const diff = now.getTime() - then.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  return (
    <GlassCard className="p-6 hover:border-accent-blue/30 transition-colors">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {automation.name}
            </h3>
            <p className="text-sm text-text-secondary line-clamp-2">
              {automation.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={automation.enabled ? "default" : "secondary"}>
              {automation.enabled ? "Active" : "Paused"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-y border-border-primary/30">
          <div>
            <div className="text-xs text-text-tertiary">Total Runs</div>
            <div className="text-lg font-semibold text-text-primary">{automation.totalRuns}</div>
          </div>
          <div>
            <div className="text-xs text-text-tertiary">Success Rate</div>
            <div className="text-lg font-semibold text-accent-green">{automation.successRate}%</div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-text-tertiary">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Run
            </span>
            <span>{getRelativeTime(automation.lastRunAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Trigger
            </span>
            <span>{automation.trigger?.type || "Manual"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 bg-accent-blue hover:bg-accent-blue/90"
            onClick={() => onRun(automation.id)}
            data-testid={`button-run-automation-${automation.id}`}
          >
            <Play className="h-3 w-3 mr-1" />
            Run
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDelete(automation.id)}
            data-testid={`button-delete-automation-${automation.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
