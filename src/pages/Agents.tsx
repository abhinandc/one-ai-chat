import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Power,
  PowerOff,
  RefreshCw,
  Loader2,
  ExternalLink,
  Workflow,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  History,
  Bot,
  Plus,
  Sparkles,
  Settings,
  Share2,
  Copy,
  Trash2,
  Globe,
  Lock,
  Users,
  Pencil,
  Zap,
  Brain,
  Code,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useN8NWorkflows } from "@/hooks/useN8NWorkflows";
import { n8nService, N8NWorkflow, N8NExecution } from "@/services/n8nService";
import { customAgentsService, CustomAgent, NewAgentData } from "@/services/customAgentsService";
import { n8nConfigService } from "@/services/n8nConfigService";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModels } from "@/hooks/useModels";

// Animated gradient border card
const AnimatedBorderCard = ({
  children,
  className,
  isActive = false,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  return (
    <motion.div
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer group",
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      {/* Animated gradient border */}
      <div className={cn(
        "absolute inset-0 rounded-xl transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-xy" />
      </div>

      {/* Inner content with slight inset for border effect */}
      <div className="absolute inset-[1px] rounded-[11px] bg-card">
        {children}
      </div>

      {/* Invisible content for sizing */}
      <div className="invisible">{children}</div>
    </motion.div>
  );
};

// Floating particles background
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

// Agent Card Component
const AgentCard = ({
  agent,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublic
}: {
  agent: CustomAgent;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
}) => {
  const getAgentIcon = () => {
    if (agent.tools.includes('code')) return <Code className="h-5 w-5" />;
    if (agent.tools.includes('search')) return <Globe className="h-5 w-5" />;
    if (agent.tools.includes('analysis')) return <Brain className="h-5 w-5" />;
    return <Bot className="h-5 w-5" />;
  };

  return (
    <AnimatedBorderCard isActive={false}>
      <div className="p-4 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary">
              {getAgentIcon()}
            </div>
            <div>
              <h3 className="font-medium text-sm">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {agent.is_public ? (
              <Globe className="h-3.5 w-3.5 text-primary" />
            ) : agent.is_shared ? (
              <Users className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        {agent.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {agent.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {agent.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>{agent.use_count} uses</span>
          </div>
          <div className="flex items-center gap-1">
            {agent.is_own && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); onTogglePublic(); }}
                >
                  {agent.is_public ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {agent.is_own && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 ml-1"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </div>
    </AnimatedBorderCard>
  );
};

type ViewState = 'list' | 'detail';

const Agents = () => {
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("agents");

  // Custom agents state
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [newAgent, setNewAgent] = useState<NewAgentData>({
    name: '',
    description: '',
    system_prompt: '',
    model: '', // Will be set dynamically from virtual keys
    temperature: 0.7,
    max_tokens: 2048,
    tools: [],
    is_shared: false,
    is_public: false,
    tags: []
  });

  // Detail view state
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null);
  const [executions, setExecutions] = useState<N8NExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  const { toast } = useToast();
  const user = useCurrentUser();
  const userEmail = user?.email || "";

  // Get models from virtual keys
  const { models, loading: modelsLoading } = useModels(userEmail);

  // Set default model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !newAgent.model) {
      setNewAgent(prev => ({ ...prev, model: models[0].id }));
    }
  }, [models, newAgent.model]);

  const {
    workflows: n8nWorkflows,
    loading: n8nLoading,
    error: n8nError,
    hasCredentials,
    refetch: refetchN8N,
    toggleActive
  } = useN8NWorkflows();

  // Load custom agents
  useEffect(() => {
    if (userEmail) {
      loadAgents();
    }
  }, [userEmail]);

  const loadAgents = async () => {
    if (!userEmail) return;

    setLoadingAgents(true);
    try {
      const data = await customAgentsService.getAgents(userEmail, { includePublic: true });
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleConnect = async () => {
    if (!n8nUrl.trim() || !n8nApiKey.trim()) {
      toast({
        title: "Missing credentials",
        description: "Please enter both URL and API key",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    try {
      const result = await n8nService.testConnection({ url: n8nUrl, apiKey: n8nApiKey });

      if (result.success) {
        n8nService.saveCredentials({ url: n8nUrl, apiKey: n8nApiKey });
        // Also save to Supabase
        await n8nConfigService.saveConfig(userEmail, n8nUrl, n8nApiKey);
        toast({
          title: "Connected",
          description: "Successfully connected to your n8n instance"
        });
        setN8nUrl("");
        setN8nApiKey("");
        refetchN8N();
      } else {
        toast({
          title: "Connection failed",
          description: result.error || "Could not connect to n8n",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    n8nService.removeCredentials();
    await n8nConfigService.removeConfig(userEmail);
    toast({
      title: "Disconnected",
      description: "n8n connection removed"
    });
    refetchN8N();
  };

  const handleToggleWorkflow = async (workflowId: string, currentActive: boolean) => {
    setTogglingWorkflow(workflowId);
    try {
      await toggleActive(workflowId, !currentActive);
      toast({
        title: currentActive ? "Workflow paused" : "Workflow activated",
        description: `Workflow is now ${currentActive ? 'inactive' : 'active'}`,
      });
      if (selectedWorkflow?.id === workflowId) {
        const updated = await n8nService.getWorkflow(workflowId);
        setSelectedWorkflow(updated);
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Could not toggle workflow",
        variant: "destructive"
      });
    } finally {
      setTogglingWorkflow(null);
    }
  };

  const handleViewWorkflow = async (workflow: N8NWorkflow) => {
    setSelectedWorkflow(workflow);
    setViewState('detail');
    setLoadingExecutions(true);

    try {
      const execs = await n8nService.getExecutions(workflow.id);
      setExecutions(execs);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      setExecutions([]);
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedWorkflow(null);
    setExecutions([]);
  };

  const handleOpenInN8N = (workflowId: string) => {
    const url = n8nService.getN8NEditorUrl(workflowId);
    if (url) window.open(url, '_blank');
  };

  const refreshExecutions = async () => {
    if (!selectedWorkflow) return;
    setLoadingExecutions(true);
    try {
      const execs = await n8nService.getExecutions(selectedWorkflow.id);
      setExecutions(execs);
    } catch (error) {
      console.error('Failed to refresh executions:', error);
    } finally {
      setLoadingExecutions(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim() || !newAgent.system_prompt.trim()) {
      toast({
        title: "Missing fields",
        description: "Name and system prompt are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const agentId = await customAgentsService.createAgent(userEmail, newAgent);
      if (agentId) {
        toast({ title: "Agent created", description: "Your custom agent is ready to use" });
        setShowCreateModal(false);
        setNewAgent({
          name: '',
          description: '',
          system_prompt: '',
          model: models[0]?.id || '', // Use first available model from virtual keys
          temperature: 0.7,
          max_tokens: 2048,
          tools: [],
          is_shared: false,
          is_public: false,
          tags: []
        });
        loadAgents();
      }
    } catch (error) {
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;

    try {
      const success = await customAgentsService.updateAgent(userEmail, editingAgent.id, newAgent);
      if (success) {
        toast({ title: "Agent updated" });
        setEditingAgent(null);
        setShowCreateModal(false);
        loadAgents();
      }
    } catch (error) {
      toast({
        title: "Failed to update agent",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const success = await customAgentsService.deleteAgent(userEmail, agentId);
      if (success) {
        toast({ title: "Agent deleted" });
        loadAgents();
      }
    } catch (error) {
      toast({
        title: "Failed to delete agent",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateAgent = async (agentId: string) => {
    try {
      const newId = await customAgentsService.duplicateAgent(userEmail, agentId);
      if (newId) {
        toast({ title: "Agent duplicated" });
        loadAgents();
      }
    } catch (error) {
      toast({
        title: "Failed to duplicate agent",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublic = async (agent: CustomAgent) => {
    try {
      const newStatus = await customAgentsService.togglePublic(userEmail, agent.id);
      if (newStatus !== null) {
        toast({ title: newStatus ? "Agent is now public" : "Agent is now private" });
        loadAgents();
      }
    } catch (error) {
      toast({
        title: "Failed to update visibility",
        variant: "destructive"
      });
    }
  };

  const handleStartChat = (agent: CustomAgent) => {
    // Navigate to chat with this agent selected
    toast({ title: "Starting chat", description: `Chatting with ${agent.name}` });
    // TODO: Navigate to /chat?agent=agent.id
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExecutionDuration = (exec: N8NExecution) => {
    if (!exec.stoppedAt) return 'Running...';
    const start = new Date(exec.startedAt).getTime();
    const end = new Date(exec.stoppedAt).getTime();
    const ms = end - start;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getStatusIcon = (status: N8NExecution['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Workflow detail view
  if (viewState === 'detail' && selectedWorkflow) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              selectedWorkflow.active ? "bg-green-500" : "bg-muted-foreground"
            )} />
            <div>
              <h1 className="text-base font-medium">{selectedWorkflow.name}</h1>
              <p className="text-xs text-muted-foreground">
                {selectedWorkflow.active ? 'Active' : 'Inactive'} • Updated {formatDate(selectedWorkflow.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleWorkflow(selectedWorkflow.id, selectedWorkflow.active)}
              disabled={togglingWorkflow === selectedWorkflow.id}
            >
              {togglingWorkflow === selectedWorkflow.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : selectedWorkflow.active ? (
                <Power className="h-4 w-4 text-green-500" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleOpenInN8N(selectedWorkflow.id)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content with Tabs */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="executions" className="text-xs">Executions</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              <AnimatedBorderCard>
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-3">Workflow Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID</span>
                      <span className="font-mono text-xs">{selectedWorkflow.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDateTime(selectedWorkflow.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated</span>
                      <span>{formatDateTime(selectedWorkflow.updatedAt)}</span>
                    </div>
                    {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tags</span>
                        <div className="flex gap-1">
                          {selectedWorkflow.tags.map(tag => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedBorderCard>

              {selectedWorkflow.nodes && selectedWorkflow.nodes.length > 0 && (
                <AnimatedBorderCard>
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-3">
                      Nodes ({selectedWorkflow.nodes.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedWorkflow.nodes.slice(0, 10).map((node, index) => (
                        <div
                          key={node.id || index}
                          className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30"
                        >
                          <Play className="h-3 w-3 text-primary" />
                          <span>{node.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {node.type.replace('n8n-nodes-base.', '')}
                          </span>
                        </div>
                      ))}
                      {selectedWorkflow.nodes.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{selectedWorkflow.nodes.length - 10} more nodes
                        </p>
                      )}
                    </div>
                  </div>
                </AnimatedBorderCard>
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="flex-1 mt-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-xs text-muted-foreground">
                {executions.length} execution{executions.length !== 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={refreshExecutions} disabled={loadingExecutions}>
                <RefreshCw className={cn("h-3 w-3", loadingExecutions && "animate-spin")} />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                {loadingExecutions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : executions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm">No executions yet</p>
                    <p className="text-xs text-muted-foreground">Run the workflow to see execution logs</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((exec) => (
                      <div
                        key={exec.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        {getStatusIcon(exec.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">
                              #{exec.id.slice(-6)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                exec.status === 'success' && "border-green-500/30 text-green-500",
                                exec.status === 'error' && "border-red-500/30 text-red-500",
                                exec.status === 'running' && "border-primary/30 text-primary"
                              )}
                            >
                              {exec.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(exec.startedAt)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getExecutionDuration(exec)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Main view
  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      <FloatingParticles />

      {/* Header */}
      <div className="relative z-10 p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Agents</h1>
              <p className="text-sm text-muted-foreground">Custom AI agents & n8n workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAgents}
              disabled={loadingAgents}
            >
              <RefreshCw className={cn("h-4 w-4", loadingAgents && "animate-spin")} />
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col relative z-10">
        <div className="px-6 border-b">
          <TabsList className="bg-transparent">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              Custom Agents
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="h-4 w-4" />
              n8n Workflows
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Custom Agents Tab */}
        <TabsContent value="agents" className="flex-1 p-6 mt-0 overflow-auto">
          {loadingAgents ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No agents yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first custom AI agent to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <AgentCard
                      agent={agent}
                      onSelect={() => handleStartChat(agent)}
                      onEdit={() => {
                        setEditingAgent(agent);
                        setNewAgent({
                          name: agent.name,
                          description: agent.description || '',
                          system_prompt: agent.system_prompt,
                          model: agent.model,
                          temperature: agent.temperature,
                          max_tokens: agent.max_tokens,
                          tools: agent.tools,
                          is_shared: agent.is_shared,
                          is_public: agent.is_public,
                          tags: agent.tags
                        });
                        setShowCreateModal(true);
                      }}
                      onDuplicate={() => handleDuplicateAgent(agent.id)}
                      onDelete={() => handleDeleteAgent(agent.id)}
                      onTogglePublic={() => handleTogglePublic(agent)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* n8n Workflows Tab */}
        <TabsContent value="workflows" className="flex-1 p-6 mt-0 overflow-auto">
          {!hasCredentials ? (
            <div className="max-w-md mx-auto">
              <AnimatedBorderCard>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Link2 className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-1">Connect n8n</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter your n8n instance URL and API key
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs">Instance URL</Label>
                      <Input
                        type="url"
                        placeholder="https://your-n8n.example.com"
                        value={n8nUrl}
                        onChange={(e) => setN8nUrl(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">API Key</Label>
                      <div className="relative mt-1.5">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          placeholder="n8n_api_..."
                          value={n8nApiKey}
                          onChange={(e) => setN8nApiKey(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting || !n8nUrl.trim() || !n8nApiKey.trim()}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Generate an API key in n8n under Settings → API
                  </p>
                </div>
              </AnimatedBorderCard>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {n8nWorkflows.length} workflow{n8nWorkflows.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={refetchN8N} disabled={n8nLoading}>
                    <RefreshCw className={cn("h-4 w-4", n8nLoading && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {n8nLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : n8nError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-3">{n8nError}</p>
                  <Button variant="outline" size="sm" onClick={refetchN8N}>
                    Retry
                  </Button>
                </div>
              ) : n8nWorkflows.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm mb-1">No workflows found</p>
                  <p className="text-xs text-muted-foreground">Create workflows in n8n to see them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {n8nWorkflows.map((workflow) => (
                    <AnimatedBorderCard
                      key={workflow.id}
                      onClick={() => handleViewWorkflow(workflow)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            workflow.active ? "bg-green-500" : "bg-muted-foreground"
                          )} />
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium truncate">
                              {workflow.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Updated {formatDate(workflow.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {workflow.tags && workflow.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                              {workflow.tags[0].name}
                            </Badge>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInN8N(workflow.id);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWorkflow(workflow.id, workflow.active);
                            }}
                            disabled={togglingWorkflow === workflow.id}
                            className={cn(
                              workflow.active ? "text-green-500 hover:text-red-400" : "text-muted-foreground hover:text-green-500"
                            )}
                          >
                            {togglingWorkflow === workflow.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : workflow.active ? (
                              <Power className="h-4 w-4" />
                            ) : (
                              <PowerOff className="h-4 w-4" />
                            )}
                          </Button>

                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </AnimatedBorderCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 p-6 mt-0 overflow-auto">
          <div className="max-w-2xl space-y-6">
            <AnimatedBorderCard>
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Default Agent Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Default Model</Label>
                    <Select defaultValue={models[0]?.id || ""}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsLoading ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : models.length === 0 ? (
                          <SelectItem value="" disabled>No models available</SelectItem>
                        ) : (
                          models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Temperature: 0.7</Label>
                    <Slider
                      defaultValue={[0.7]}
                      min={0}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Make new agents public by default</Label>
                      <p className="text-xs text-muted-foreground">Others can discover and use your agents</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </AnimatedBorderCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Agent Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) setEditingAgent(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAgent ? 'Edit Agent' : 'Create Custom Agent'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input
                  placeholder="My Custom Agent"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="col-span-2">
                <Label>Description</Label>
                <Input
                  placeholder="A brief description of what this agent does"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Model</Label>
                <Select
                  value={newAgent.model}
                  onValueChange={(value) => setNewAgent({ ...newAgent, model: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsLoading ? (
                      <SelectItem value="" disabled>Loading...</SelectItem>
                    ) : models.length === 0 ? (
                      <SelectItem value="" disabled>No models available</SelectItem>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Temperature: {newAgent.temperature}</Label>
                <Slider
                  value={[newAgent.temperature || 0.7]}
                  onValueChange={([value]) => setNewAgent({ ...newAgent, temperature: value })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="mt-3"
                />
              </div>

              <div className="col-span-2">
                <Label>System Prompt *</Label>
                <Textarea
                  placeholder="You are a helpful assistant that..."
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              <div className="col-span-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  placeholder="coding, analysis, creative"
                  value={newAgent.tags?.join(', ') || ''}
                  onChange={(e) => setNewAgent({
                    ...newAgent,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newAgent.is_shared}
                    onCheckedChange={(checked) => setNewAgent({ ...newAgent, is_shared: checked })}
                  />
                  <Label className="text-sm">Share with team</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newAgent.is_public}
                    onCheckedChange={(checked) => setNewAgent({ ...newAgent, is_public: checked })}
                  />
                  <Label className="text-sm">Make public</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={editingAgent ? handleUpdateAgent : handleCreateAgent}>
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Agents;
