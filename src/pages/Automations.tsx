import { useState, useMemo } from "react";
import { 
  Plus, 
  Sparkles, 
  Zap, 
  Plug, 
  Loader2,
  Search,
  ArrowRight,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle,
  Mail,
  MessageCircle,
  Hash,
  Users,
  Globe,
  Calendar,
  Table,
  FileText,
  Briefcase,
  Cloud,
  CheckSquare,
  Github,
  Code,
  Star,
  RefreshCw,
  Sun,
  AlertCircle,
  UserPlus,
  Send,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { 
  useIntegrationChannels, 
  useUserIntegrations, 
  useAutomationRules,
  WorkflowTemplate,
  IntegrationChannel 
} from "@/hooks/useIntegrationChannels";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  'message-circle': MessageCircle,
  hash: Hash,
  users: Users,
  globe: Globe,
  calendar: Calendar,
  table: Table,
  'file-text': FileText,
  briefcase: Briefcase,
  cloud: Cloud,
  'check-square': CheckSquare,
  github: Github,
  code: Code,
  sparkles: Sparkles,
  star: Star,
  'refresh-cw': RefreshCw,
  sun: Sun,
  'alert-circle': AlertCircle,
  'user-plus': UserPlus,
};

const getIcon = (iconName: string | null) => {
  if (!iconName) return Zap;
  return iconMap[iconName] || Zap;
};

const categoryColors: Record<string, string> = {
  communication: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  productivity: 'bg-green-500/10 text-green-400 border-green-500/20',
  crm: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  developer: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  project: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ai: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  general: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function AutomationsPage() {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  
  const { channels, templates, loading: channelsLoading } = useIntegrationChannels();
  const { integrations, connectIntegration, disconnectIntegration } = useUserIntegrations(currentUser?.email || null);
  const { rules, loading: rulesLoading, createRule, toggleRule, deleteRule } = useAutomationRules(currentUser?.email || null);

  // UI State
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Connected channel IDs
  const connectedChannelIds = useMemo(() => 
    new Set(integrations.map(i => i.channel_id)), 
    [integrations]
  );

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, IntegrationChannel[]> = {};
    channels.forEach(channel => {
      if (!grouped[channel.category]) grouped[channel.category] = [];
      grouped[channel.category].push(channel);
    });
    return grouped;
  }, [channels]);

  const handleCreateFromNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;

    const result = await createRule({
      name: naturalLanguageInput.slice(0, 50),
      natural_language_rule: naturalLanguageInput,
      is_automated: true,
      is_enabled: true,
    });

    if (!result.error) {
      toast({ title: "Rule created", description: "Your automation rule has been created" });
      setNaturalLanguageInput("");
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    const result = await createRule({
      name: template.name,
      description: template.description,
      natural_language_rule: template.natural_language_example || template.name,
      is_automated: true,
      is_enabled: false,
    });

    if (!result.error) {
      toast({ title: "Template added", description: `"${template.name}" has been added to your automations` });
      setShowCreateModal(false);
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  const handleConnectChannel = async (channelId: string) => {
    setConnectingChannel(channelId);
    const error = await connectIntegration(channelId);
    if (!error) {
      toast({ title: "Connected", description: "Integration connected successfully" });
    } else {
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    }
    setConnectingChannel(null);
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await toggleRule(id, enabled);
    toast({ 
      title: enabled ? "Activated" : "Paused", 
      description: `Automation is now ${enabled ? 'active' : 'paused'}`
    });
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
    toast({ title: "Deleted", description: "Automation removed" });
  };

  const loading = channelsLoading || rulesLoading;

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative p-6 md:p-8 border-b border-border-primary">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border-primary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border-primary))_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 mb-4">
            <Bot className="h-4 w-4 text-accent-blue" />
            <span className="text-xs font-medium text-accent-blue">AI-Powered Automations</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
            What would you like to automate?
          </h1>
          <p className="text-sm text-text-tertiary mb-6">
            Describe your workflow in natural language
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-blue" />
              <GlassInput
                placeholder="When I receive an email from a VIP client, notify me on Slack..."
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFromNaturalLanguage()}
                className="pl-10 h-12 text-base"
                variant="minimal"
              />
            </div>
            <Button 
              onClick={handleCreateFromNaturalLanguage}
              disabled={!naturalLanguageInput.trim()}
              className="h-12 px-6"
            >
              <Send className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-text-quaternary">
            <button 
              onClick={() => setNaturalLanguageInput("When I receive an email from a VIP, notify me")}
              className="hover:text-text-secondary transition-colors"
            >
              "Notify me on VIP emails"
            </button>
            <span>•</span>
            <button 
              onClick={() => setNaturalLanguageInput("Every morning at 9am, send me a summary of pending tasks")}
              className="hover:text-text-secondary transition-colors"
            >
              "Daily task summary"
            </button>
            <span>•</span>
            <button 
              onClick={() => setNaturalLanguageInput("When a new deal closes, update the revenue spreadsheet")}
              className="hover:text-text-secondary transition-colors"
            >
              "Sync closed deals"
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="automations" className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border-primary">
            <TabsList className="bg-transparent">
              <TabsTrigger value="automations" className="text-sm">
                My Automations
                {rules.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{rules.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-sm">Templates</TabsTrigger>
              <TabsTrigger value="integrations" className="text-sm">
                Integrations
                {integrations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{integrations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-quaternary" />
                <GlassInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                  variant="minimal"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* My Automations Tab */}
            <TabsContent value="automations" className="p-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-accent-blue" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">No automations yet</h3>
                  <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
                    Create your first automation using natural language or start with a template
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const TriggerIcon = rule.trigger_channel ? getIcon(rule.trigger_channel.icon) : Zap;
                    const ActionIcon = rule.action_channel ? getIcon(rule.action_channel.icon) : ArrowRight;
                    
                    return (
                      <GlassCard key={rule.id} className="group hover:border-border-secondary transition-colors">
                        <GlassCardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Icons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                rule.is_enabled ? "bg-accent-blue/10" : "bg-surface-graphite"
                              )}>
                                <TriggerIcon className={cn(
                                  "h-5 w-5",
                                  rule.is_enabled ? "text-accent-blue" : "text-text-quaternary"
                                )} />
                              </div>
                              <ArrowRight className="h-4 w-4 text-text-quaternary" />
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                rule.is_enabled ? "bg-green-500/10" : "bg-surface-graphite"
                              )}>
                                <ActionIcon className={cn(
                                  "h-5 w-5",
                                  rule.is_enabled ? "text-green-400" : "text-text-quaternary"
                                )} />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-text-primary truncate">
                                {rule.name}
                              </h3>
                              <p className="text-xs text-text-tertiary truncate mt-0.5">
                                {rule.natural_language_rule}
                              </p>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                              {rule.trigger_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-text-quaternary">
                                  <Clock className="h-3 w-3" />
                                  {rule.trigger_count} runs
                                </div>
                              )}
                              
                              <Badge variant="outline" className={cn(
                                "text-xs",
                                rule.is_automated 
                                  ? "border-accent-blue/30 text-accent-blue" 
                                  : "border-amber-500/30 text-amber-400"
                              )}>
                                {rule.is_automated ? 'Auto' : 'Manual'}
                              </Badge>

                              <Switch
                                checked={rule.is_enabled}
                                onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                              />

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </GlassCardContent>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="p-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
                </div>
              ) : (
                <>
                  {/* Featured Templates */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      Featured Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.filter(t => t.is_featured).map((template) => {
                        const Icon = getIcon(template.icon);
                        const triggerChannel = channels.find(c => c.slug === template.trigger_channel_slug);
                        const actionChannel = channels.find(c => c.slug === template.action_channel_slug);
                        const TriggerIcon = triggerChannel ? getIcon(triggerChannel.icon) : Zap;
                        const ActionIcon = actionChannel ? getIcon(actionChannel.icon) : ArrowRight;

                        return (
                          <GlassCard 
                            key={template.id} 
                            className="group cursor-pointer hover:border-accent-blue/30 transition-all"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <GlassCardContent className="p-5">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                  categoryColors[template.category] || categoryColors.general
                                )}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                                    {template.name}
                                  </h4>
                                  <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                                    {template.description}
                                  </p>
                                </div>
                              </div>

                              {/* Flow visualization */}
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-graphite/50">
                                <div className="w-8 h-8 rounded-lg bg-surface-graphite flex items-center justify-center">
                                  <TriggerIcon className="h-4 w-4 text-text-secondary" />
                                </div>
                                <ArrowRight className="h-3 w-3 text-text-quaternary" />
                                <div className="w-8 h-8 rounded-lg bg-surface-graphite flex items-center justify-center">
                                  <ActionIcon className="h-4 w-4 text-text-secondary" />
                                </div>
                                <span className="text-xs text-text-quaternary ml-auto">
                                  {template.use_count} uses
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {template.category}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-text-quaternary group-hover:text-accent-blue transition-colors" />
                              </div>
                            </GlassCardContent>
                          </GlassCard>
                        );
                      })}
                    </div>
                  </div>

                  {/* All Templates */}
                  <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-4">All Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.filter(t => !t.is_featured).map((template) => {
                        const Icon = getIcon(template.icon);

                        return (
                          <GlassCard 
                            key={template.id} 
                            className="group cursor-pointer hover:border-border-secondary transition-colors"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <GlassCardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                  categoryColors[template.category] || categoryColors.general
                                )}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-text-primary truncate">
                                    {template.name}
                                  </h4>
                                  <p className="text-xs text-text-tertiary truncate">
                                    {template.description}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-text-quaternary shrink-0" />
                              </div>
                            </GlassCardContent>
                          </GlassCard>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="p-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Connected Integrations */}
                  {integrations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Connected ({integrations.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {integrations.map((integration) => {
                          const channel = integration.channel as unknown as IntegrationChannel;
                          if (!channel) return null;
                          const Icon = getIcon(channel.icon);

                          return (
                            <GlassCard key={integration.id} className="border-green-500/20">
                              <GlassCardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    categoryColors[channel.category]
                                  )}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-text-primary">{channel.name}</h4>
                                    <p className="text-xs text-green-400">Connected</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => disconnectIntegration(integration.id)}
                                    className="text-text-tertiary hover:text-red-400"
                                  >
                                    Disconnect
                                  </Button>
                                </div>
                              </GlassCardContent>
                            </GlassCard>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Integrations by Category */}
                  {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-text-secondary mb-4 capitalize flex items-center gap-2">
                        <Plug className="h-4 w-4" />
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryChannels.map((channel) => {
                          const Icon = getIcon(channel.icon);
                          const isConnected = connectedChannelIds.has(channel.id);
                          const isConnecting = connectingChannel === channel.id;

                          if (isConnected) return null;

                          return (
                            <GlassCard 
                              key={channel.id} 
                              className="group hover:border-border-secondary transition-colors"
                            >
                              <GlassCardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    categoryColors[category]
                                  )}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-text-primary">{channel.name}</h4>
                                    <p className="text-xs text-text-tertiary truncate">{channel.description}</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConnectChannel(channel.id)}
                                    disabled={isConnecting}
                                  >
                                    {isConnecting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Connect'
                                    )}
                                  </Button>
                                </div>
                              </GlassCardContent>
                            </GlassCard>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
