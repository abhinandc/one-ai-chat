import { useState, useEffect } from "react";
import { Search, Filter, Star, Download, Zap, Code, Database, Globe, Plus, Trash2 } from "lucide-react";
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
import { toolService, ToolInstallation, ToolSubmission } from "@/services/toolService";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CreateToolModal } from "@/components/modals/CreateToolModal";
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

interface DisplayTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  type: 'installed' | 'submitted';
  createdAt: Date;
}

const categories = ["All", "Integration", "Data", "Communication", "Analytics", "Custom"];

const getToolIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("http") || lowerName.includes("api")) return <Globe className="h-6 w-6" />;
  if (lowerName.includes("sql") || lowerName.includes("database")) return <Database className="h-6 w-6" />;
  if (lowerName.includes("code")) return <Code className="h-6 w-6" />;
  return <Zap className="h-6 w-6" />;
};

export default function ToolsGallery() {
  const [installedTools, setInstalledTools] = useState<ToolInstallation[]>([]);
  const [submissions, setSubmissions] = useState<ToolSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const user = useCurrentUser();

  useEffect(() => {
    const loadTools = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [installed, submitted] = await Promise.all([
          toolService.getInstalledTools(user.email),
          toolService.getToolSubmissions(user.email)
        ]);
        setInstalledTools(installed);
        setSubmissions(submitted);
      } catch (error) {
        console.error("Failed to load tools:", error);
        toast({
          title: "Failed to load tools",
          description: "Could not fetch tools from the database.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, [user?.email, toast]);

  const displayTools: DisplayTool[] = [
    ...installedTools.map(t => ({
      id: t.id,
      name: t.tool_name,
      description: `Installed tool connected to agent ${t.agent_id}`,
      category: "Integration",
      tags: ["installed", t.status],
      status: t.status,
      type: 'installed' as const,
      createdAt: new Date(t.installed_at)
    })),
    ...submissions.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      tags: ["submitted", s.status],
      status: s.status,
      type: 'submitted' as const,
      createdAt: new Date(s.submitted_at)
    }))
  ];

  const filteredTools = displayTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const handleSubmitTool = async (data: { name: string; description: string; category: string }) => {
    if (!user?.email) return;

    try {
      const submission = await toolService.submitTool({
        user_email: user.email,
        name: data.name,
        description: data.description,
        category: data.category,
        implementation: ""
      });

      setSubmissions(prev => [submission, ...prev]);
      toast({
        title: "Tool submitted",
        description: `"${data.name}" has been submitted for review.`,
      });
    } catch (error) {
      console.error("Failed to submit tool:", error);
      toast({
        title: "Failed to submit",
        description: "Could not submit the tool. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUninstallTool = (toolId: string) => {
    setToolToDelete(toolId);
    setDeleteDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!toolToDelete || !user?.email) return;

    try {
      await toolService.uninstallTool(toolToDelete, user.email);
      setInstalledTools(prev => prev.filter(t => t.id !== toolToDelete));
      toast({
        title: "Tool uninstalled",
        description: "The tool has been removed.",
      });
    } catch (error) {
      console.error("Failed to uninstall tool:", error);
      toast({
        title: "Failed to uninstall",
        description: "Could not uninstall the tool. Please try again.",
        variant: "destructive"
      });
    } finally {
      setToolToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-accent-green";
      case "approved": return "text-accent-green";
      case "pending": return "text-accent-orange";
      case "inactive": return "text-text-secondary";
      case "rejected": return "text-accent-red";
      case "error": return "text-accent-red";
      default: return "text-text-secondary";
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Tools Gallery</h1>
              <p className="text-text-secondary">Manage and discover AI tools for your workflow</p>
            </div>
            <Button 
              className="bg-accent-blue hover:bg-accent-blue/90"
              onClick={() => setSubmitModalOpen(true)}
              data-testid="button-submit-tool"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Tool
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  variant="search"
                  data-testid="input-search-tools"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-filter-category">
                  <Filter className="h-4 w-4 mr-2" />
                  Category: {selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => setSelectedCategory(category)} 
                    className="text-card-foreground hover:bg-accent-blue/10"
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-sort">
                  Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSortBy("newest")} className="text-card-foreground hover:bg-accent-blue/10">
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")} className="text-card-foreground hover:bg-accent-blue/10">
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")} className="text-card-foreground hover:bg-accent-blue/10">
                  Name
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {loading && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading tools...</h3>
              <p className="text-text-secondary">Fetching tools from database</p>
            </div>
          )}

          {!loading && installedTools.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-green" />
                Installed Tools ({installedTools.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTools.filter(t => t.type === 'installed').map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onUninstall={handleUninstallTool}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && submissions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-accent-orange" />
                My Submissions ({submissions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTools.filter(t => t.type === 'submitted').map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onUninstall={handleUninstallTool}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && sortedTools.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No tools found</h3>
              <p className="text-text-secondary">
                {displayTools.length === 0 
                  ? "Submit your first tool to get started"
                  : "Try adjusting your search or filters"
                }
              </p>
              {displayTools.length === 0 && (
                <Button 
                  className="mt-4"
                  onClick={() => setSubmitModalOpen(true)}
                  data-testid="button-submit-first-tool"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Tool
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateToolModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        onSubmit={handleSubmitTool}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to uninstall this tool? This will also remove the associated agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUninstall} className="bg-destructive text-destructive-foreground">
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToolCard({ 
  tool,
  getStatusColor, 
  formatDate,
  onUninstall
}: { 
  tool: DisplayTool;
  getStatusColor: (status: string) => string;
  formatDate: (date: Date) => string;
  onUninstall: (toolId: string) => void;
}) {
  return (
    <GlassCard className="p-6 hover:border-accent-blue/30 transition-all duration-200 group" data-testid={`card-tool-${tool.id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
              {getToolIcon(tool.name)}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-text-secondary capitalize">{tool.type}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-text-secondary line-clamp-2">{tool.description}</p>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs capitalize", getStatusColor(tool.status))}>
            {tool.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tool.category}
          </Badge>
        </div>

        <div className="text-xs text-text-tertiary">
          Added {formatDate(tool.createdAt)}
        </div>

        {tool.type === 'installed' && (
          <div className="flex items-center gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-accent-red hover:text-accent-red"
              onClick={() => onUninstall(tool.id)}
              data-testid={`button-uninstall-tool-${tool.id}`}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Uninstall
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
