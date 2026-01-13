import { useState, useEffect } from "react";
import {
  Play, Plus, Search, Zap, Clock, CheckCircle, Pause, Trash2, AlertTriangle,
  Mail, MessageSquare, Bug, Key, Webhook, LayoutTemplate, FolderOpen,
  Loader2, Workflow, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAutomations } from "@/hooks/useAutomations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { IntegrationsModal } from "@/components/modals/IntegrationsModal";
import { WorkflowBuilder } from "@/components/automations/WorkflowBuilder";
import supabase from "@/services/supabaseClient";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: {
    trigger?: string;
    icon?: string;
    [key: string]: unknown;
  };
  required_credentials: string[];
  is_active: boolean;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Mail; color: string; bgColor: string }> = {
  gsuite: { icon: Mail, color: "text-red-500", bgColor: "bg-red-500/10" },
  google: { icon: Mail, color: "text-red-500", bgColor: "bg-red-500/10" },
  slack: { icon: MessageSquare, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  jira: { icon: Bug, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  custom: { icon: Zap, color: "text-accent-blue", bgColor: "bg-accent-blue/10" },
  default: { icon: Zap, color: "text-gray-500", bgColor: "bg-gray-500/10" }
};

const triggerIcons: Record<string, typeof Clock> = {
  schedule: Clock,
  webhook: Webhook,
  manual: Play,
  event: Zap,
};

export default function Automations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [newAutomationName, setNewAutomationName] = useState("");
  const [newAutomationDescription, setNewAutomationDescription] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState("manual");
  const [showBuilder, setShowBuilder] = useState(false);
  const { toast } = useToast();

  // Templates from database
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const user = useCurrentUser();
  const {
    automations,
    loading,
    error,
    executeAutomation,
    deleteAutomation,
    createAutomation
  } = useAutomations(user?.email);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!supabase) {
        setTemplatesError("Supabase not configured");
        setTemplatesLoading(false);
        return;
      }

      try {
        setTemplatesLoading(true);
        const { data, error: fetchError } = await supabase
          .from('automation_templates')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (fetchError) {
          console.error('Error fetching templates:', fetchError);
          setTemplatesError(fetchError.message);
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
        setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setTemplatesLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category.toLowerCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, AutomationTemplate[]>);

  const handleSelectTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    setNewAutomationName(template.name);
    setNewAutomationDescription(template.description);
    setSelectedTrigger(template.template_data?.trigger || "manual");
    setShowBuilder(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setNewAutomationName("");
    setNewAutomationDescription("");
    setSelectedTrigger("manual");
    setShowBuilder(true);
  };

  const handleSaveWorkflow = async (workflow: { nodes: any[]; edges: any[] }) => {
    try {
      await createAutomation({
        name: newAutomationName || 'New Automation',
        description: newAutomationDescription || 'Created with visual builder',
        trigger_config: { type: selectedTrigger as any, config: {} },
        workflow_data: workflow,
      });
      toast({
        title: "Automation Saved",
        description: "Your workflow has been saved successfully",
      });
      setShowBuilder(false);
      setActiveTab("my-automations");
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Failed to save workflow",
        variant: "destructive",
      });
    }
  };

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

  const handleDeleteAutomation = (automationId: string) => {
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

  // Filter templates based on search
  const filteredGroupedTemplates = Object.entries(groupedTemplates).reduce((acc, [category, categoryTemplates]) => {
    const filtered = categoryTemplates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, AutomationTemplate[]>);

  const filteredAutomations = automations.filter((auto) =>
    auto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show visual builder full screen
  if (showBuilder) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Builder Header */}
        <div className="px-4 py-3 border-b border-border-secondary/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBuilder(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border-primary/30" />
            <div>
              <GlassInput
                value={newAutomationName}
                onChange={(e) => setNewAutomationName(e.target.value)}
                placeholder="Automation name..."
                className="h-8 text-sm w-48 bg-transparent border-none focus:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIntegrationsOpen(true)}
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Credentials
            </Button>
          </div>
        </div>

        {/* Visual Builder */}
        <div className="flex-1">
          <WorkflowBuilder
            onSave={handleSaveWorkflow}
            onClose={() => setShowBuilder(false)}
          />
        </div>

        {/* Credentials Modal */}
        <IntegrationsModal
          isOpen={integrationsOpen}
          onClose={() => setIntegrationsOpen(false)}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-accent-red mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Automations Error</h2>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-secondary/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">Automations</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Build AI-powered workflows visually
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIntegrationsOpen(true)}
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Credentials
            </Button>
            <Button
              size="sm"
              onClick={handleCreateFromScratch}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              <Workflow className="h-3.5 w-3.5 mr-1.5" />
              New Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border-secondary/30 flex items-center justify-between gap-4">
          <TabsList className="bg-surface-graphite/50 h-8">
            <TabsTrigger value="templates" className="text-xs h-7 px-3 data-[state=active]:bg-accent-blue data-[state=active]:text-white">
              <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="my-automations" className="text-xs h-7 px-3 data-[state=active]:bg-accent-blue data-[state=active]:text-white">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              My Automations
              {automations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {automations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <GlassInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
              variant="search"
            />
          </div>
        </div>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
          {templatesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-text-quaternary mx-auto mb-3 animate-spin" />
              <p className="text-sm text-text-secondary">Loading templates...</p>
            </div>
          ) : templatesError ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-8 w-8 text-accent-orange mx-auto mb-3" />
              <p className="text-sm text-text-primary mb-1">Failed to load templates</p>
              <p className="text-xs text-text-tertiary">{templatesError}</p>
            </div>
          ) : Object.keys(filteredGroupedTemplates).length === 0 ? (
            <div className="text-center py-12">
              {templates.length === 0 ? (
                <>
                  <Workflow className="h-12 w-12 text-text-quaternary mx-auto mb-4" />
                  <p className="text-sm text-text-primary mb-2">No templates available</p>
                  <p className="text-xs text-text-tertiary mb-4">Start from scratch with the visual builder</p>
                  <Button size="sm" onClick={handleCreateFromScratch}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Workflow
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-10 w-10 text-text-quaternary mx-auto mb-3" />
                  <p className="text-sm text-text-primary mb-1">No templates found</p>
                  <p className="text-xs text-text-tertiary">Try adjusting your search query</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredGroupedTemplates).map(([category, categoryTemplates]) => {
                const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
                const CategoryIcon = config.icon;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.bgColor)}>
                        <CategoryIcon className={cn("h-3.5 w-3.5", config.color)} />
                      </div>
                      <h2 className="text-sm font-semibold text-text-primary capitalize">{category}</h2>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{categoryTemplates.length}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {categoryTemplates.map((template) => {
                        const TriggerIcon = triggerIcons[template.template_data?.trigger || 'manual'] || Zap;
                        return (
                          <div
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className={cn(
                              "p-3 rounded-lg border border-border-primary/30 hover:border-accent-blue/40",
                              "transition-all cursor-pointer group bg-card/50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className={cn("w-7 h-7 rounded flex items-center justify-center shrink-0", config.bgColor)}>
                                <CategoryIcon className={cn("h-3.5 w-3.5", config.color)} />
                              </div>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                                <TriggerIcon className="h-2.5 w-2.5 mr-0.5" />
                                {template.template_data?.trigger || 'manual'}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors line-clamp-1">
                              {template.name}
                            </h3>
                            <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
                              {template.description}
                            </p>
                            {template.required_credentials.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-[10px] text-text-quaternary">
                                <Key className="h-2.5 w-2.5" />
                                {template.required_credentials.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Automations Tab */}
        <TabsContent value="my-automations" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-text-quaternary mx-auto mb-3 animate-spin" />
              <p className="text-sm text-text-secondary">Loading automations...</p>
            </div>
          ) : filteredAutomations.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="h-12 w-12 text-text-quaternary mx-auto mb-4" />
              <p className="text-sm text-text-primary mb-2">
                {automations.length === 0 ? "No automations yet" : "No matching automations"}
              </p>
              <p className="text-xs text-text-tertiary mb-4">
                {automations.length === 0
                  ? "Create your first automation with the visual builder"
                  : "Try adjusting your search query"
                }
              </p>
              {automations.length === 0 && (
                <Button size="sm" onClick={handleCreateFromScratch}>
                  <Workflow className="h-3.5 w-3.5 mr-1.5" />
                  Create Workflow
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredAutomations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onRun={handleRunAutomation}
                  onDelete={handleDeleteAutomation}
                  onEdit={() => {
                    setSelectedTemplate(null);
                    setNewAutomationName(automation.name);
                    setNewAutomationDescription(automation.description || '');
                    setShowBuilder(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Credentials Modal */}
      <IntegrationsModal
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />

      {/* Delete Confirmation */}
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

function AutomationCard({ automation, onRun, onDelete, onEdit }: {
  automation: any;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const getStatusIcon = () => {
    if (automation.enabled) {
      return <CheckCircle className="h-3 w-3 text-accent-green" />;
    }
    return <Pause className="h-3 w-3 text-accent-orange" />;
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
    } catch {
      return "Unknown";
    }
  };

  const TriggerIcon = triggerIcons[automation.trigger_config?.type] || Zap;

  return (
    <div className="p-3 rounded-lg border border-border-primary/30 hover:border-accent-blue/40 transition-all bg-card/50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {automation.name}
          </h3>
          <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">
            {automation.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {getStatusIcon()}
          <Badge variant={automation.enabled ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
            {automation.enabled ? "On" : "Off"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 py-2 border-y border-border-primary/20 text-xs">
        <div>
          <div className="text-text-quaternary">Runs</div>
          <div className="font-medium text-text-primary">{automation.total_runs || 0}</div>
        </div>
        <div>
          <div className="text-text-quaternary">Success</div>
          <div className="font-medium text-accent-green">{automation.success_rate || 100}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-text-quaternary">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {getRelativeTime(automation.last_run_at)}
        </span>
        <span className="flex items-center gap-1 capitalize">
          <TriggerIcon className="h-2.5 w-2.5" />
          {automation.trigger_config?.type || "Manual"}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs"
          onClick={onEdit}
        >
          <Workflow className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          className="flex-1 h-7 text-xs bg-accent-blue hover:bg-accent-blue/90"
          onClick={() => onRun(automation.id)}
        >
          <Play className="h-3 w-3 mr-1" />
          Run
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onDelete(automation.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
