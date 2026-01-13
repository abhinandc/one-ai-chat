import { useState, useRef } from "react";
import {
  Play,
  Plus,
  Search,
  Filter,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Pause,
  Trash2,
  AlertTriangle,
  Layers,
  Key,
  ExternalLink,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
  Mail,
  MessageSquare,
} from "lucide-react";
// AnimatedBeam for node connectors - hardUIrules.md line 246
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useAutomations } from "@/hooks/useAutomations";
import { useAutomationTemplates } from "@/hooks/useAdmin";
import { useEdgeVault } from "@/hooks/useEdgeVault";
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
import { AutomationTemplate } from "@/services/adminService";
import { IntegrationType, CredentialStatus } from "@/services/edgeVaultService";

const categories = ["All", "gsuite", "slack", "jira", "chat", "custom"];
const INTEGRATION_TYPES: IntegrationType[] = ["google", "slack", "jira", "n8n", "custom"];

export default function Automations() {
  const [activeTab, setActiveTab] = useState<"automations" | "templates" | "credentials">("automations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const [createFromTemplateOpen, setCreateFromTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [templateConfig, setTemplateConfig] = useState<{
    name?: string;
    description?: string;
    credentialId?: string;
    model?: string;
  }>({});
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [newCredential, setNewCredential] = useState({
    integration_type: "google" as IntegrationType,
    label: "",
    credentials: "",
  });
  const { toast } = useToast();

  const user = useCurrentUser();
  const {
    automations,
    loading: automationsLoading,
    error: automationsError,
    executeAutomation,
    deleteAutomation,
    createAutomation,
    createFromTemplate,
    refetch: refetchAutomations,
  } = useAutomations(user?.email);

  const {
    templates,
    loading: templatesLoading,
    refetch: refetchTemplates,
  } = useAutomationTemplates();

  const {
    credentials,
    loading: credentialsLoading,
    createCredential,
    deleteCredential,
    validateCredential,
    refetch: refetchCredentials,
  } = useEdgeVault(user?.id);

  const activeTemplates = templates.filter((t) => t.is_active);

  const handleRunAutomation = async (automationId: string) => {
    try {
      const execution = await executeAutomation(automationId, {
        timestamp: new Date().toISOString(),
        source: "manual_trigger",
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

  const handleUseTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    setTemplateConfig({
      name: template.name,
      description: template.description || undefined,
      model: template.default_model || undefined,
    });
    setCreateFromTemplateOpen(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await createFromTemplate(selectedTemplate.id, templateConfig);

      // Increment template usage count
      try {
        const { adminService } = await import('@/services/adminService');
        await adminService.incrementTemplateUsage(selectedTemplate.id);
        await refetchTemplates();
      } catch (usageError) {
        console.error('Failed to increment template usage:', usageError);
      }

      toast({
        title: "Automation Created",
        description: `"${templateConfig.name || selectedTemplate.name}" has been created from template`,
      });
      setCreateFromTemplateOpen(false);
      setSelectedTemplate(null);
      setTemplateConfig({});
      setActiveTab("automations");
    } catch (error) {
      toast({
        title: "Failed to Create",
        description: error instanceof Error ? error.message : "Failed to create automation",
        variant: "destructive",
      });
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredential.label.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a credential label",
        variant: "destructive",
      });
      return;
    }

    try {
      let parsedCreds = {};
      if (newCredential.credentials.trim()) {
        try {
          parsedCreds = JSON.parse(newCredential.credentials);
        } catch {
          toast({
            title: "Invalid JSON",
            description: "Credentials must be valid JSON",
            variant: "destructive",
          });
          return;
        }
      }

      await createCredential({
        integration_type: newCredential.integration_type,
        label: newCredential.label,
        credentials: parsedCreds,
      });

      toast({
        title: "Credential Added",
        description: `"${newCredential.label}" has been added to EdgeVault`,
      });

      setNewCredential({
        integration_type: "google",
        label: "",
        credentials: "",
      });
      setCredentialModalOpen(false);
    } catch (error) {
      toast({
        title: "Failed to Add",
        description: error instanceof Error ? error.message : "Failed to add credential",
        variant: "destructive",
      });
    }
  };

  const handleValidateCredential = async (credentialId: string) => {
    try {
      const isValid = await validateCredential(credentialId);
      toast({
        title: isValid ? "Validation Successful" : "Validation Failed",
        description: isValid
          ? "Credential is valid and working"
          : "Credential validation failed",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate credential",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      await deleteCredential(credentialId);
      toast({
        title: "Credential Deleted",
        description: "Credential has been removed from EdgeVault",
      });
    } catch (error) {
      toast({
        title: "Failed to Delete",
        description: error instanceof Error ? error.message : "Failed to delete credential",
        variant: "destructive",
      });
    }
  };

  const filteredAutomations = automations.filter((auto) => {
    const matchesSearch = auto.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      auto.name.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && auto.enabled) ||
      (selectedStatus === "paused" && !auto.enabled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredTemplates = activeTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gsuite":
        return "bg-blue-500/10 text-blue-500";
      case "slack":
        return "bg-purple-500/10 text-purple-500";
      case "jira":
        return "bg-cyan-500/10 text-cyan-500";
      case "chat":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getCredentialStatusIcon = (status: CredentialStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "expired":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (automationsError) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Automations Error</h2>
          <p className="text-muted-foreground mb-4">{automationsError}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automations</h1>
            <p className="text-muted-foreground mt-1">
              Manage workflows, templates, and credentials
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "automations" && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-green-600 text-white hover:bg-green-600/90"
                data-testid="button-create-automation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            )}
            {activeTab === "credentials" && (
              <Button
                onClick={() => setCredentialModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-add-credential"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            )}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="mt-6"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-muted">
              <TabsTrigger
                value="automations"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-automations"
              >
                <Zap className="h-4 w-4 mr-2" />
                My Automations ({automations.length})
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-templates"
              >
                <Layers className="h-4 w-4 mr-2" />
                Templates ({activeTemplates.length})
              </TabsTrigger>
              <TabsTrigger
                value="credentials"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid="tab-credentials"
              >
                <Key className="h-4 w-4 mr-2" />
                EdgeVault ({credentials.length})
              </TabsTrigger>
            </TabsList>

            {(activeTab === "automations" || activeTab === "templates") && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
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
                        className="capitalize"
                      >
                        {category === "gsuite" ? "GSuite" : category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {activeTab === "automations" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Status: {selectedStatus}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedStatus("active")}>
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedStatus("paused")}>
                        Paused
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mt-6">
            <TabsContent value="automations" className="mt-0">
              <AutomationsGrid
                automations={filteredAutomations}
                loading={automationsLoading}
                onRun={handleRunAutomation}
                onDelete={handleDeleteAutomation}
                onCreateNew={() => setCreateModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <TemplatesGrid
                templates={filteredTemplates}
                loading={templatesLoading}
                getCategoryColor={getCategoryColor}
                onUseTemplate={handleUseTemplate}
              />
            </TabsContent>

            <TabsContent value="credentials" className="mt-0">
              <CredentialsGrid
                credentials={credentials}
                loading={credentialsLoading}
                onValidate={handleValidateCredential}
                onDelete={handleDeleteCredential}
                onAddNew={() => setCredentialModalOpen(true)}
                getStatusIcon={getCredentialStatusIcon}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateAutomationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateAutomation}
      />

      {/* Create from Template Dialog */}
      <Dialog open={createFromTemplateOpen} onOpenChange={setCreateFromTemplateOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create from Template</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure and create an automation using the "{selectedTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Template Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {selectedTemplate?.description || "No description available"}
              </p>
            </div>

            {/* Required Credentials Warning */}
            {selectedTemplate?.required_credentials &&
              selectedTemplate.required_credentials.length > 0 && (
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-orange-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Requires credentials: {selectedTemplate.required_credentials.join(", ")}
                  </p>
                </div>
              )}

            {/* Configuration Fields */}
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-foreground">
                Name (Optional)
              </Label>
              <Input
                id="template-name"
                value={templateConfig.name || ''}
                onChange={(e) => setTemplateConfig({ ...templateConfig, name: e.target.value })}
                placeholder={selectedTemplate?.name || "Automation name"}
              />
            </div>

            {/* Credential Selection */}
            {selectedTemplate?.required_credentials &&
              selectedTemplate.required_credentials.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="credential-select" className="text-foreground">
                    Select Credential *
                  </Label>
                  <Select
                    value={templateConfig.credentialId || ''}
                    onValueChange={(v) => setTemplateConfig({ ...templateConfig, credentialId: v })}
                  >
                    <SelectTrigger id="credential-select">
                      <SelectValue placeholder="Choose a credential" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentials
                        .filter((c) =>
                          selectedTemplate.required_credentials.includes(c.integration_type)
                        )
                        .map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>
                            {cred.label} ({cred.integration_type})
                          </SelectItem>
                        ))}
                      {credentials.filter((c) =>
                        selectedTemplate.required_credentials.includes(c.integration_type)
                      ).length === 0 && (
                        <SelectItem value="none" disabled>
                          No matching credentials found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Don't have a credential?{" "}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => {
                        setCreateFromTemplateOpen(false);
                        setActiveTab("credentials");
                      }}
                    >
                      Add one in EdgeVault
                    </button>
                  </p>
                </div>
              )}

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-foreground">
                AI Model (Optional)
              </Label>
              <Input
                id="model-select"
                value={templateConfig.model || ''}
                onChange={(e) => setTemplateConfig({ ...templateConfig, model: e.target.value })}
                placeholder={selectedTemplate?.default_model || "Default model"}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use template default: {selectedTemplate?.default_model}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFromTemplateOpen(false);
                setTemplateConfig({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              className="bg-primary hover:bg-primary/90"
              disabled={
                selectedTemplate?.required_credentials?.length > 0 &&
                !templateConfig.credentialId
              }
            >
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Credential Modal */}
      <Dialog open={credentialModalOpen} onOpenChange={setCredentialModalOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Credential</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Store integration credentials securely in EdgeVault
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCredential}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="integration_type" className="text-foreground">
                  Integration Type
                </Label>
                <Select
                  value={newCredential.integration_type}
                  onValueChange={(v) =>
                    setNewCredential({ ...newCredential, integration_type: v as IntegrationType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEGRATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label" className="text-foreground">
                  Label *
                </Label>
                <Input
                  id="label"
                  value={newCredential.label}
                  onChange={(e) =>
                    setNewCredential({ ...newCredential, label: e.target.value })
                  }
                  placeholder="e.g., Production Google OAuth"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credentials" className="text-foreground">
                  Credentials (JSON)
                </Label>
                <Textarea
                  id="credentials"
                  value={newCredential.credentials}
                  onChange={(e) =>
                    setNewCredential({ ...newCredential, credentials: e.target.value })
                  }
                  placeholder='{"client_id": "...", "client_secret": "..."}'
                  className="min-h-[100px] bg-input border-border text-foreground font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCredentialModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Add Credential
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AutomationsGrid({
  automations,
  loading,
  onRun,
  onDelete,
  onCreateNew,
}: {
  automations: any[];
  loading: boolean;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="w-40 h-4 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (automations.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No automations found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first automation or use a template
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {automations.map((automation) => (
        <AutomationCard
          key={automation.id}
          automation={automation}
          onRun={onRun}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// Mini workflow preview with AnimatedBeam - hardUIrules.md line 246
function WorkflowPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative flex items-center justify-between py-2 px-4 bg-muted/50 rounded-lg">
      <div
        ref={triggerRef}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary"
      >
        <Zap className="h-4 w-4" />
      </div>
      <div
        ref={processRef}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground"
      >
        <Settings className="h-4 w-4" />
      </div>
      <div
        ref={outputRef}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-600"
      >
        <CheckCircle className="h-4 w-4" />
      </div>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={triggerRef}
        toRef={processRef}
        pathColor="hsl(var(--primary))"
        gradientStartColor="hsl(var(--primary))"
        gradientStopColor="hsl(var(--accent))"
        pathWidth={2}
        pathOpacity={0.3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={processRef}
        toRef={outputRef}
        pathColor="hsl(var(--accent))"
        gradientStartColor="hsl(var(--accent))"
        gradientStopColor="hsl(142.1 76.2% 36.3%)"
        pathWidth={2}
        pathOpacity={0.3}
      />
    </div>
  );
}

function AutomationCard({
  automation,
  onRun,
  onDelete,
}: {
  automation: any;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getStatusIcon = () => {
    if (automation.enabled) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Pause className="h-4 w-4 text-orange-500" />;
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

  return (
    <Card className="p-6 hover:border-primary/30 transition-colors">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {automation.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
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

        {/* Workflow Preview with AnimatedBeam - hardUIrules.md line 246 */}
        <WorkflowPreview />

        <div className="grid grid-cols-2 gap-4 py-3 border-y border-border">
          <div>
            <div className="text-xs text-muted-foreground">Total Runs</div>
            <div className="text-lg font-semibold text-foreground">
              {automation.total_runs || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
            <div className="text-lg font-semibold text-green-600">
              {automation.success_rate || 100}%
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Run
            </span>
            <span>{getRelativeTime(automation.last_run_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Trigger
            </span>
            <span>{automation.trigger_config?.type || "Manual"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
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
    </Card>
  );
}

function TemplatesGrid({
  templates,
  loading,
  getCategoryColor,
  onUseTemplate,
}: {
  templates: AutomationTemplate[];
  loading: boolean;
  getCategoryColor: (category: string) => string;
  onUseTemplate: (template: AutomationTemplate) => void;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "gsuite":
        return <Mail className="h-5 w-5" />;
      case "slack":
        return <MessageSquare className="h-5 w-5" />;
      case "jira":
        return <Database className="h-5 w-5" />;
      case "chat":
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="w-40 h-4 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No templates available</h3>
        <p className="text-muted-foreground">
          Templates will be added by your administrator
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="p-6 hover:border-primary/30 transition-colors group relative overflow-hidden"
          data-testid={`card-template-${template.id}`}
        >
          {/* Featured badge */}
          {template.is_featured && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
              Featured
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {/* Category icon */}
              <div className={cn(
                "p-2 rounded-lg",
                getCategoryColor(template.category)
              )}>
                {getCategoryIcon(template.category)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground leading-tight">{template.name}</h3>
                <Badge className={cn("mt-2", getCategoryColor(template.category))}>
                  {template.category === "gsuite" ? "GSuite" : template.category}
                </Badge>
              </div>
            </div>

            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                {template.description}
              </p>
            )}

            {/* Template metadata */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                <span>{template.usage_count || 0} uses</span>
              </div>
              {template.default_model && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span className="truncate max-w-[100px]" title={template.default_model}>
                    {template.default_model.split('-')[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Required credentials */}
            {template.required_credentials.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.required_credentials.map((cred) => (
                  <Badge key={cred} variant="outline" className="text-xs capitalize">
                    <Key className="h-3 w-3 mr-1" />
                    {cred}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              className="w-full bg-primary hover:bg-primary/90 group-hover:shadow-lg transition-all"
              onClick={() => onUseTemplate(template)}
              data-testid={`button-use-template-${template.id}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CredentialsGrid({
  credentials,
  loading,
  onValidate,
  onDelete,
  onAddNew,
  getStatusIcon,
}: {
  credentials: any[];
  loading: boolean;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  getStatusIcon: (status: CredentialStatus) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="w-40 h-4 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No credentials stored
        </h3>
        <p className="text-muted-foreground mb-4">
          Add integration credentials to use with automations
        </p>
        <Button onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {credentials.map((credential) => (
        <Card
          key={credential.id}
          className="p-6 hover:border-primary/30 transition-colors"
          data-testid={`card-credential-${credential.id}`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{credential.label}</h3>
                <Badge className="mt-2 capitalize">{credential.integration_type}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(credential.status)}
                <Badge
                  variant={credential.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {credential.status}
                </Badge>
              </div>
            </div>

            {credential.last_validated_at && (
              <p className="text-xs text-muted-foreground">
                Last validated: {new Date(credential.last_validated_at).toLocaleString()}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onValidate(credential.id)}
                data-testid={`button-validate-credential-${credential.id}`}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Validate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(credential.id)}
                className="text-destructive hover:text-destructive"
                data-testid={`button-delete-credential-${credential.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
