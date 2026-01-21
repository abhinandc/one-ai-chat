import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Bot,
  Settings,
  Workflow,
  ChevronDown,
  Layers,
  Activity,
  Cpu,
  GitBranch,
  MousePointer2
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  parseAutomationWithAI,
  mapChannelSlugToId,
  generateAutomationSummary,
  validateAutomationRequirements,
  type ParsedAutomation
} from "@/services/automationAI";

// Animated gradient border component
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
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Animated gradient border */}
      <div className={cn(
        "absolute inset-0 rounded-xl transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-xy" />
      </div>
      {/* Content with padding for border effect */}
      <div className="absolute inset-[1px] rounded-[11px] bg-card">
        {children}
      </div>
      {/* Spacer for content */}
      <div className="invisible">
        {children}
      </div>
    </motion.div>
  );
};

// Floating particle effect component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          initial={{
            x: Math.random() * 100 + "%",
            y: "100%",
            opacity: 0
          }}
          animate={{
            y: "-10%",
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Canvas workflow node
interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'ai';
  label: string;
  icon: string;
  x: number;
  y: number;
  connected?: string[];
}

// Simple canvas-based workflow visualization
const WorkflowCanvas = ({
  nodes,
  onNodeClick
}: {
  nodes: WorkflowNode[];
  onNodeClick?: (node: WorkflowNode) => void;
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const nodeColors = {
    trigger: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500' },
    action: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
    condition: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500' },
    ai: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500' }
  };

  return (
    <div ref={canvasRef} className="relative w-full h-64 bg-muted/30 rounded-xl border border-border overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map((node, i) => {
          if (i < nodes.length - 1) {
            const nextNode = nodes[i + 1];
            return (
              <motion.path
                key={`line-${i}`}
                d={`M ${node.x + 60} ${node.y + 25} C ${node.x + 100} ${node.y + 25}, ${nextNode.x - 40} ${nextNode.y + 25}, ${nextNode.x} ${nextNode.y + 25}`}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="8 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              />
            );
          }
          return null;
        })}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => {
        const colors = nodeColors[node.type];
        return (
          <motion.div
            key={node.id}
            className={cn(
              "absolute flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all",
              colors.bg, colors.border,
              "hover:shadow-lg hover:shadow-primary/10"
            )}
            style={{ left: node.x, top: node.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onNodeClick?.(node)}
          >
            <div className={cn("w-6 h-6 rounded flex items-center justify-center", colors.text)}>
              {node.type === 'trigger' && <Zap className="w-4 h-4" />}
              {node.type === 'action' && <Play className="w-4 h-4" />}
              {node.type === 'condition' && <GitBranch className="w-4 h-4" />}
              {node.type === 'ai' && <Sparkles className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-foreground">{node.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

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

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  communication: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  productivity: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  crm: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  developer: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  project: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  ai: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  general: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  gsuite: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  slack: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  jira: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  github: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
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
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("automations");
  const [isCreating, setIsCreating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedAutomation, setParsedAutomation] = useState<ParsedAutomation | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sample workflow nodes for the builder
  const sampleWorkflowNodes: WorkflowNode[] = [
    { id: '1', type: 'trigger', label: 'Email Received', icon: 'mail', x: 40, y: 100 },
    { id: '2', type: 'ai', label: 'AI Analysis', icon: 'sparkles', x: 200, y: 100 },
    { id: '3', type: 'condition', label: 'Priority Check', icon: 'git-branch', x: 360, y: 100 },
    { id: '4', type: 'action', label: 'Send Slack', icon: 'hash', x: 520, y: 100 },
  ];

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
    setIsParsing(true);

    // Parse the natural language using AI
    const { parsed, error: parseError } = await parseAutomationWithAI(naturalLanguageInput);

    if (parseError || !parsed) {
      toast({
        title: "Could not understand automation",
        description: parseError || "Please try rephrasing your automation description",
        variant: "destructive"
      });
      setIsParsing(false);
      return;
    }

    // Check if required integrations are connected
    const connectedSlugs = new Set(
      integrations.map(i => (i.channel as unknown as IntegrationChannel)?.slug).filter(Boolean)
    );
    const validation = validateAutomationRequirements(parsed, connectedSlugs);

    if (!validation.valid) {
      toast({
        title: "Missing integrations",
        description: `Please connect: ${validation.missingChannels.join(', ')}`,
        variant: "destructive"
      });
      setActiveTab("integrations");
      setIsParsing(false);
      return;
    }

    // Show confirmation dialog with parsed automation
    setParsedAutomation(parsed);
    setShowConfirmDialog(true);
    setIsParsing(false);
  };

  const handleConfirmAutomation = async () => {
    if (!parsedAutomation) return;
    setIsCreating(true);

    // Map channel slugs to IDs
    const triggerChannelId = mapChannelSlugToId(parsedAutomation.trigger.channel_slug, channels);
    const actionChannelId = mapChannelSlugToId(parsedAutomation.action.channel_slug, channels);

    const result = await createRule({
      name: parsedAutomation.name,
      description: parsedAutomation.description,
      natural_language_rule: naturalLanguageInput,
      trigger_channel_id: triggerChannelId,
      action_channel_id: actionChannelId,
      is_automated: parsedAutomation.aiProcessing.enabled,
      is_enabled: true,
    });

    if (!result.error) {
      toast({
        title: "Automation created",
        description: generateAutomationSummary(parsedAutomation)
      });
      setNaturalLanguageInput("");
      setParsedAutomation(null);
      setShowConfirmDialog(false);
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
    setIsCreating(false);
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    setIsCreating(true);
    const result = await createRule({
      name: template.name,
      description: template.description,
      natural_language_rule: template.natural_language_example || template.name,
      is_automated: true,
      is_enabled: false,
    });

    if (!result.error) {
      toast({ title: "Template added", description: `"${template.name}" has been added to your automations` });
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
    setIsCreating(false);
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
      {/* Hero Section with Particles */}
      <div className="relative p-8 border-b border-border overflow-hidden">
        <FloatingParticles />

        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Cpu className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">AI-Powered Process Automation</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Build Intelligent Workflows
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Describe what you want to automate in natural language, and let AI build the workflow for you
            </p>
          </motion.div>

          {/* Natural Language Input with glow effect */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-50" />
            <div className="relative flex gap-3 p-2 rounded-xl bg-card border border-border shadow-xl">
              <div className="relative flex-1">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <GlassInput
                  placeholder="When I receive an email from a VIP client, analyze it with AI and notify me on Slack..."
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateFromNaturalLanguage()}
                  className="pl-12 h-14 text-base border-0 bg-transparent focus-visible:ring-0"
                />
              </div>
              <Button
                onClick={handleCreateFromNaturalLanguage}
                disabled={!naturalLanguageInput.trim() || isParsing || isCreating}
                size="lg"
                className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : isCreating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Workflow className="h-5 w-5 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Quick suggestions */}
          <motion.div
            className="flex items-center justify-center gap-2 mt-6 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-xs text-muted-foreground">Try:</span>
            {[
              "Summarize my emails daily",
              "Alert me on high-priority tickets",
              "Draft responses to customers"
            ].map((suggestion, i) => (
              <motion.button
                key={i}
                onClick={() => setNaturalLanguageInput(suggestion)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
            <TabsList className="bg-transparent p-1">
              <TabsTrigger value="automations" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                <Activity className="h-4 w-4" />
                My Automations
                {rules.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{rules.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                <Layers className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="builder" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                <MousePointer2 className="h-4 w-4" />
                Visual Builder
              </TabsTrigger>
              <TabsTrigger value="integrations" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                <Plug className="h-4 w-4" />
                Integrations
                {integrations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{integrations.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <GlassInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56 h-9"
                  variant="minimal"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* My Automations Tab */}
            <TabsContent value="automations" className="p-6 mt-0">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-8 w-8 text-primary" />
                    </motion.div>
                  </div>
                ) : rules.length === 0 ? (
                  <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                      <Workflow className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No automations yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Create your first automation using natural language above or explore our templates
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" onClick={() => setActiveTab("templates")}>
                        <Layers className="h-4 w-4 mr-2" />
                        Browse Templates
                      </Button>
                      <Button onClick={() => setActiveTab("builder")}>
                        <MousePointer2 className="h-4 w-4 mr-2" />
                        Visual Builder
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule, index) => {
                      const TriggerIcon = rule.trigger_channel ? getIcon(rule.trigger_channel.icon) : Zap;
                      const ActionIcon = rule.action_channel ? getIcon(rule.action_channel.icon) : ArrowRight;

                      return (
                        <motion.div
                          key={rule.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <AnimatedBorderCard isActive={rule.is_enabled}>
                            <div className="p-5">
                              <div className="flex items-center gap-4">
                                {/* Workflow visualization */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <motion.div
                                    className={cn(
                                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                      rule.is_enabled ? "bg-primary/10 shadow-lg shadow-primary/10" : "bg-muted"
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <TriggerIcon className={cn(
                                      "h-6 w-6 transition-colors",
                                      rule.is_enabled ? "text-primary" : "text-muted-foreground"
                                    )} />
                                  </motion.div>
                                  <div className="flex items-center">
                                    <div className={cn(
                                      "w-8 h-[2px] transition-colors",
                                      rule.is_enabled ? "bg-gradient-to-r from-primary to-primary/50" : "bg-muted"
                                    )} />
                                    <ChevronRight className={cn(
                                      "h-4 w-4 -ml-1",
                                      rule.is_enabled ? "text-primary" : "text-muted-foreground"
                                    )} />
                                  </div>
                                  <motion.div
                                    className={cn(
                                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                      rule.is_enabled ? "bg-emerald-500/10 shadow-lg shadow-emerald-500/10" : "bg-muted"
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <ActionIcon className={cn(
                                      "h-6 w-6 transition-colors",
                                      rule.is_enabled ? "text-emerald-500" : "text-muted-foreground"
                                    )} />
                                  </motion.div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {rule.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                                    {rule.natural_language_rule}
                                  </p>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-4 shrink-0">
                                  {rule.trigger_count > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Activity className="h-3.5 w-3.5" />
                                      {rule.trigger_count} runs
                                    </div>
                                  )}

                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      rule.is_automated
                                        ? "border-primary/30 text-primary bg-primary/5"
                                        : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                                    )}
                                  >
                                    {rule.is_automated ? 'Auto' : 'Manual'}
                                  </Badge>

                                  <Switch
                                    checked={rule.is_enabled}
                                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                                    className="data-[state=checked]:bg-primary"
                                  />

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </AnimatedBorderCard>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="p-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Featured Templates */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      <h3 className="text-lg font-semibold text-foreground">Featured Templates</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.filter(t => t.is_featured).map((template, index) => {
                        const Icon = getIcon(template.icon);
                        const colors = categoryColors[template.category] || categoryColors.general;
                        const triggerChannel = channels.find(c => c.slug === template.trigger_channel_slug);
                        const actionChannel = channels.find(c => c.slug === template.action_channel_slug);
                        const TriggerIcon = triggerChannel ? getIcon(triggerChannel.icon) : Zap;
                        const ActionIcon = actionChannel ? getIcon(actionChannel.icon) : ArrowRight;

                        return (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <AnimatedBorderCard onClick={() => handleUseTemplate(template)}>
                              <div className="p-5">
                                <div className="flex items-start gap-4 mb-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                    colors.bg, colors.border, "border"
                                  )}>
                                    <Icon className={cn("h-6 w-6", colors.text)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                      {template.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {template.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Mini workflow visualization */}
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                                    <TriggerIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                  </div>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
                                    <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {template.use_count} uses
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                  <Badge variant="outline" className={cn("text-xs capitalize", colors.text, colors.border)}>
                                    {template.category}
                                  </Badge>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </AnimatedBorderCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* All Templates */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">All Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredTemplates.filter(t => !t.is_featured).map((template, index) => {
                        const Icon = getIcon(template.icon);
                        const colors = categoryColors[template.category] || categoryColors.general;

                        return (
                          <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="group cursor-pointer"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <GlassCard className="p-4 hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                  colors.bg
                                )}>
                                  <Icon className={cn("h-5 w-5", colors.text)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {template.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {template.description}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                              </div>
                            </GlassCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Visual Builder Tab */}
            <TabsContent value="builder" className="p-6 mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Visual Workflow Builder</h3>
                    <p className="text-sm text-muted-foreground">Drag and drop to create custom automations</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Node
                  </Button>
                </div>

                <WorkflowCanvas nodes={sampleWorkflowNodes} />

                <div className="grid grid-cols-4 gap-4">
                  {[
                    { type: 'trigger', label: 'Triggers', icon: Zap, color: 'text-emerald-500', items: ['Email Received', 'Schedule', 'Webhook', 'Event'] },
                    { type: 'ai', label: 'AI Actions', icon: Sparkles, color: 'text-purple-500', items: ['Analyze', 'Summarize', 'Generate', 'Classify'] },
                    { type: 'condition', label: 'Logic', icon: GitBranch, color: 'text-amber-500', items: ['If/Then', 'Filter', 'Wait', 'Loop'] },
                    { type: 'action', label: 'Actions', icon: Play, color: 'text-blue-500', items: ['Send Email', 'Post Message', 'Update Record', 'API Call'] },
                  ].map((category, i) => (
                    <GlassCard key={i} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <category.icon className={cn("h-4 w-4", category.color)} />
                        <span className="text-sm font-medium text-foreground">{category.label}</span>
                      </div>
                      <div className="space-y-2">
                        {category.items.map((item, j) => (
                          <motion.div
                            key={j}
                            className="text-xs text-muted-foreground px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                            whileHover={{ x: 2 }}
                          >
                            {item}
                          </motion.div>
                        ))}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="p-6 mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Connected Integrations */}
                  {integrations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <h3 className="text-lg font-semibold text-foreground">Connected ({integrations.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {integrations.map((integration, index) => {
                          const channel = integration.channel as unknown as IntegrationChannel;
                          if (!channel) return null;
                          const Icon = getIcon(channel.icon);
                          const colors = categoryColors[channel.category] || categoryColors.general;

                          return (
                            <motion.div
                              key={integration.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <GlassCard className="p-4 border-emerald-500/20">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    colors.bg
                                  )}>
                                    <Icon className={cn("h-6 w-6", colors.text)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground">{channel.name}</h4>
                                    <p className="text-xs text-emerald-500">Connected</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => disconnectIntegration(integration.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    Disconnect
                                  </Button>
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Integrations */}
                  {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-foreground mb-6 capitalize flex items-center gap-2">
                        <Plug className="h-5 w-5 text-muted-foreground" />
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {categoryChannels.map((channel, index) => {
                          const Icon = getIcon(channel.icon);
                          const isConnected = connectedChannelIds.has(channel.id);
                          const isConnecting = connectingChannel === channel.id;
                          const colors = categoryColors[category] || categoryColors.general;

                          if (isConnected) return null;

                          return (
                            <motion.div
                              key={channel.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <GlassCard className="p-4 hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-105",
                                    colors.bg
                                  )}>
                                    <Icon className={cn("h-6 w-6", colors.text)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground">{channel.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConnectChannel(channel.id)}
                                    disabled={isConnecting}
                                    className="shrink-0"
                                  >
                                    {isConnecting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Connect'
                                    )}
                                  </Button>
                                </div>
                              </GlassCard>
                            </motion.div>
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

      {/* Automation Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Confirm Automation
            </DialogTitle>
            <DialogDescription>
              Review the parsed automation before creating
            </DialogDescription>
          </DialogHeader>

          {parsedAutomation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{parsedAutomation.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm text-foreground">{parsedAutomation.description}</p>
              </div>

              {/* Workflow visualization */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trigger</p>
                    <p className="text-sm font-medium capitalize">
                      {parsedAutomation.trigger.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground" />

                {parsedAutomation.aiProcessing.enabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">AI</p>
                        <p className="text-sm font-medium capitalize">
                          {parsedAutomation.aiProcessing.task}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Send className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Action</p>
                    <p className="text-sm font-medium capitalize">
                      {parsedAutomation.action.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {parsedAutomation.conditions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Conditions</Label>
                  <div className="space-y-1">
                    {parsedAutomation.conditions.map((c, i) => (
                      <Badge key={i} variant="outline" className="mr-2">
                        {c.field} {c.operator.replace('_', ' ')} "{c.value}"
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span>Confidence: {Math.round((parsedAutomation.confidence || 0.8) * 100)}%</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setParsedAutomation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAutomation}
              disabled={isCreating}
              className="bg-primary"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add CSS for gradient animation */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
