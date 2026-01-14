import { useState } from "react";
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
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useN8NWorkflows } from "@/hooks/useN8NWorkflows";
import { n8nService, N8NWorkflow, N8NExecution } from "@/services/n8nService";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type ViewState = 'list' | 'detail';

const Agents = () => {
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  
  // Detail view state
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8NWorkflow | null>(null);
  const [executions, setExecutions] = useState<N8NExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  
  const { toast } = useToast();
  const { 
    workflows: n8nWorkflows, 
    loading: n8nLoading, 
    error: n8nError, 
    hasCredentials, 
    refetch: refetchN8N, 
    toggleActive 
  } = useN8NWorkflows();

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

  const handleDisconnect = () => {
    n8nService.removeCredentials();
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
      // Refresh selected workflow if viewing detail
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
        return <Loader2 className="h-4 w-4 text-accent-blue animate-spin" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-text-tertiary" />;
      default:
        return <Clock className="h-4 w-4 text-text-tertiary" />;
    }
  };

  // Not connected state
  if (!hasCredentials) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-background">
        <GlassCard className="w-full max-w-md">
          <GlassCardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                <Link2 className="h-6 w-6 text-accent-blue" />
              </div>
              <h1 className="text-lg font-semibold text-text-primary mb-1">
                Connect n8n
              </h1>
              <p className="text-sm text-text-secondary">
                Enter your n8n instance URL and API key
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-tertiary mb-1.5 block">Instance URL</label>
                <GlassInput
                  type="url"
                  placeholder="https://your-n8n.example.com"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  variant="minimal"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-xs text-text-tertiary mb-1.5 block">API Key</label>
                <div className="relative">
                  <GlassInput
                    type={showApiKey ? "text" : "password"}
                    placeholder="n8n_api_..."
                    value={n8nApiKey}
                    onChange={(e) => setN8nApiKey(e.target.value)}
                    variant="minimal"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
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

            <p className="text-xs text-text-quaternary text-center mt-4">
              Generate an API key in n8n under Settings → API
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // Workflow detail view
  if (viewState === 'detail' && selectedWorkflow) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              selectedWorkflow.active ? "bg-green-500" : "bg-text-quaternary"
            )} />
            <div>
              <h1 className="text-base font-medium text-text-primary">{selectedWorkflow.name}</h1>
              <p className="text-xs text-text-tertiary">
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
          <div className="px-4 border-b border-border-primary">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="executions" className="text-xs">Executions</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 p-4 mt-0">
            <div className="space-y-4">
              {/* Workflow Info */}
              <GlassCard>
                <GlassCardContent className="p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3">Workflow Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">ID</span>
                      <span className="text-text-secondary font-mono text-xs">{selectedWorkflow.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Created</span>
                      <span className="text-text-secondary">{formatDateTime(selectedWorkflow.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Updated</span>
                      <span className="text-text-secondary">{formatDateTime(selectedWorkflow.updatedAt)}</span>
                    </div>
                    {selectedWorkflow.tags && selectedWorkflow.tags.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-tertiary">Tags</span>
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
                </GlassCardContent>
              </GlassCard>

              {/* Nodes */}
              {selectedWorkflow.nodes && selectedWorkflow.nodes.length > 0 && (
                <GlassCard>
                  <GlassCardContent className="p-4">
                    <h3 className="text-sm font-medium text-text-primary mb-3">
                      Nodes ({selectedWorkflow.nodes.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedWorkflow.nodes.slice(0, 10).map((node, index) => (
                        <div 
                          key={node.id || index} 
                          className="flex items-center gap-2 text-sm p-2 rounded bg-surface-graphite/30"
                        >
                          <Play className="h-3 w-3 text-accent-blue" />
                          <span className="text-text-primary">{node.name}</span>
                          <span className="text-text-quaternary text-xs ml-auto">
                            {node.type.replace('n8n-nodes-base.', '')}
                          </span>
                        </div>
                      ))}
                      {selectedWorkflow.nodes.length > 10 && (
                        <p className="text-xs text-text-tertiary text-center">
                          +{selectedWorkflow.nodes.length - 10} more nodes
                        </p>
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions" className="flex-1 mt-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-primary">
              <span className="text-xs text-text-tertiary">
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
                    <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
                  </div>
                ) : executions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-8 w-8 text-text-quaternary mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">No executions yet</p>
                    <p className="text-xs text-text-tertiary">Run the workflow to see execution logs</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((exec) => (
                      <div 
                        key={exec.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border-primary bg-surface-graphite/30"
                      >
                        {getStatusIcon(exec.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-secondary">
                              #{exec.id.slice(-6)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                exec.status === 'success' && "border-green-500/30 text-green-500",
                                exec.status === 'error' && "border-red-500/30 text-red-500",
                                exec.status === 'running' && "border-accent-blue/30 text-accent-blue"
                              )}
                            >
                              {exec.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {formatDateTime(exec.startedAt)}
                            {exec.data?.resultData?.error && (
                              <span className="text-red-400 ml-2">
                                {exec.data.resultData.error.message.slice(0, 50)}...
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-text-quaternary">
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

  // Workflow list view
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Workflow className="h-4 w-4 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-base font-medium text-text-primary">Workflows</h1>
            <p className="text-xs text-text-tertiary">{n8nWorkflows.length} connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetchN8N} disabled={n8nLoading}>
            <RefreshCw className={cn("h-4 w-4", n8nLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDisconnect}>
            <XCircle className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {n8nLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : n8nError ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-400 mb-3">{n8nError}</p>
            <Button variant="outline" size="sm" onClick={refetchN8N}>
              Retry
            </Button>
          </div>
        ) : n8nWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <Workflow className="h-10 w-10 text-text-quaternary mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-1">No workflows found</p>
            <p className="text-xs text-text-tertiary">Create workflows in n8n to see them here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {n8nWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleViewWorkflow(workflow)}
                className="flex items-center justify-between p-3 rounded-lg border border-border-primary bg-surface-graphite/30 hover:bg-surface-graphite/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    workflow.active ? "bg-green-500" : "bg-text-quaternary"
                  )} />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {workflow.name}
                    </h3>
                    <p className="text-xs text-text-tertiary">
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
                    className="text-text-tertiary hover:text-text-primary"
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
                      workflow.active ? "text-green-500 hover:text-red-400" : "text-text-tertiary hover:text-green-500"
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

                  <ChevronRight className="h-4 w-4 text-text-quaternary group-hover:text-text-tertiary" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;