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
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useN8NWorkflows } from "@/hooks/useN8NWorkflows";
import { n8nService } from "@/services/n8nService";
import { Badge } from "@/components/ui/badge";

const Agents = () => {
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [togglingWorkflow, setTogglingWorkflow] = useState<string | null>(null);
  
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

  const handleOpenInN8N = (workflowId: string) => {
    const url = n8nService.getN8NEditorUrl(workflowId);
    if (url) window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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

  // Connected state
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
                className="flex items-center justify-between p-3 rounded-lg border border-border-primary bg-surface-graphite/30 hover:bg-surface-graphite/50 transition-colors"
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
                    onClick={() => handleOpenInN8N(workflow.id)}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleWorkflow(workflow.id, workflow.active)}
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
