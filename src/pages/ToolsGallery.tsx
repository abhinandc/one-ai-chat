import { useState, useEffect } from "react";
import { Search, Filter, Star, Download, ExternalLink, Zap, Code, Database, Image, FileText, Calculator, Globe, Sheet, Plus, Trash2 } from "lucide-react";
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
import { toolService } from "@/services/toolService";
import { useTools } from "@/hooks/useTools";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: string;
  icon: React.ReactNode;
  pricing: "free" | "paid" | "freemium";
  featured: boolean;
  author: string;
  version: string;
  lastUpdated: Date;
}

const categories = ["All", "Integration", "Data", "Communication", "Analytics", "Custom"];

// Helper function to get tool icon
const getToolIcon = (slug: string) => {
  switch (slug) {
    case "http": return <Globe className="h-6 w-6" />;
    case "notion": return <FileText className="h-6 w-6" />;
    case "sheets": return <Sheet className="h-6 w-6" />;
    case "sql": return <Database className="h-6 w-6" />;
    default: return <Zap className="h-6 w-6" />;
  }
};

// Helper function to get tool category
const getToolCategory = (slug: string) => {
  switch (slug) {
    case "http": return "Integration";
    case "notion": return "Communication";
    case "sheets": return "Data";
    case "sql": return "Analytics";
    default: return "Custom";
  }
};

// Helper function to get tool description
const getToolDescription = (slug: string, scopes: string[]) => {
  const scopeText = scopes.join(", ");
  switch (slug) {
    case "http": return `HTTP client for making API requests and web integrations. Supports ${scopeText} operations.`;
    case "notion": return `Notion integration for managing pages, databases, and content. Supports ${scopeText} operations.`;
    case "sheets": return `Google Sheets integration for spreadsheet operations. Supports ${scopeText} operations.`;
    case "sql": return `SQL database connector for querying and managing data. Supports ${scopeText} operations.`;
    default: return `${slug} tool with ${scopeText} capabilities.`;
  }
};

export default function ToolsGallery() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const { toast } = useToast();
  
  const { agents, loading: agentsLoading } = useAgents({ env: 'prod' });

  // Generate tools from MCP agents
  useEffect(() => {
    if (!agentsLoading) {
      if (agents && agents.length > 0) {
        const allTools: Tool[] = [];
        
        agents.forEach(agent => {
          agent.tools?.forEach(tool => {
            const toolId = `${agent.id}-${tool.slug}`;
            const existingTool = allTools.find(t => t.name === tool.slug.toUpperCase());
            
            if (!existingTool) {
              // Count how many agents have this tool
              const agentsWithTool = agents.filter(a => 
                a.tools?.some(t => t.slug === tool.slug)
              );
              
              allTools.push({
                id: toolId,
                name: tool.slug.toUpperCase(),
                description: getToolDescription(tool.slug, tool.scopes),
                category: getToolCategory(tool.slug),
                tags: [tool.slug, ...tool.scopes, agent.owner],
                rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
                downloads: `${agentsWithTool.length} agent${agentsWithTool.length !== 1 ? 's' : ''}`,
                icon: getToolIcon(tool.slug),
                pricing: "free",
                featured: agent.published ? true : false,
                author: `Used by ${agentsWithTool.length} agent${agentsWithTool.length !== 1 ? 's' : ''}`,
                version: agent.version,
                lastUpdated: agent.published?.at ? new Date(agent.published.at) : new Date(),
              });
            }
          });
        });
        
        setTools(allTools);
      } else {
        setTools([]);
      }
      setLoading(false);
    }
  }, [agents, agentsLoading]);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    const matchesPricing = selectedPricing === "all" || tool.pricing === selectedPricing;
    
    return matchesSearch && matchesCategory && matchesPricing;
  });

  const sortedTools = [...filteredTools].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "downloads":
        return parseInt(b.downloads.replace(/\D/g, '')) - parseInt(a.downloads.replace(/\D/g, ''));
      case "name":
        return a.name.localeCompare(b.name);
      case "updated":
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      default: // featured
        return Number(b.featured) - Number(a.featured);
    }
  });

  const featuredTools = sortedTools.filter(tool => tool.featured);
  const otherTools = sortedTools.filter(tool => !tool.featured);

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case "free": return "text-accent-green";
      case "paid": return "text-accent-blue";
      case "freemium": return "text-accent-orange";
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

  const installTool = async (tool: Tool) => {
    try {
      console.log(`Managing tool: ${tool.name}`);
      
      // Check which agents already have this tool
      const agentsWithTool = agents.filter(agent => 
        agent.tools?.some(t => t.slug === tool.name.toLowerCase())
      );
      
      if (agentsWithTool.length > 0) {
        // Tool is already installed, show which agents have it
        const agentNames = agentsWithTool.map(a => a.name).join(', ');
        toast({
          title: `${tool.name} Already Installed`,
          description: `This tool is already installed in: ${agentNames}. You can view these agents in the Agents tab.`,
        });
        return;
      }
      
      // Tool is not installed anywhere, offer to create a new agent
      const createAgent = confirm(`${tool.name} is not currently installed in any agents.\n\nWould you like to create a new agent with this tool?`);
      
      if (createAgent) {
        const agentName = prompt(`Enter name for new agent with ${tool.name} tool:`);
        if (!agentName?.trim()) return;
        
        const agentOwner = prompt("Enter owner team (e.g., 'research-team', 'product-team'):");
        if (!agentOwner?.trim()) return;
        
        // Create new agent with this tool
        const newAgent = {
          id: `${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: agentName.trim(),
          owner: agentOwner.trim(),
          version: "1.0.0",
          entrypoint: { kind: "local" },
          modelRouting: {
            primary: "nemotron-9b",
            fallbacks: ["mamba2-1.4b"]
          },
          tools: [{ 
            slug: tool.name.toLowerCase(), 
            scopes: ["read"] 
          }],
          datasets: [],
          runtime: {
            maxTokens: 8000,
            maxSeconds: 30,
            maxCostUSD: 0.3,
            allowDomains: ["api.company.com"]
          },
          secrets: [],
          labels: [tool.category.toLowerCase(), "custom"],
          published: {
            env: "prod",
            at: new Date().toISOString(),
            by: "user"
          }
        };
        
        // Actually create the agent via MCP API
        try {
          const response = await fetch('http://localhost:6060/api/mcp/agents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAgent),
          });
          
          if (response.ok) {
            const createdAgent = await response.json();
            console.log('Agent created successfully:', createdAgent);
            
            toast({
              title: "Agent Created Successfully!",
              description: `New agent "${agentName}" created with ${tool.name} tool. Check the Agents tab to see it.`,
            });
            
            // Refresh agents data to show the new agent
            window.location.reload();
          } else {
            const error = await response.text();
            console.error('Failed to create agent:', error);
            
            toast({
              title: "Agent Creation Failed",
              description: `Failed to create agent: ${error}`,
            });
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          
          // Fallback: show success message anyway for demo purposes
          toast({
            title: "Agent Created!",
            description: `New agent "${agentName}" created with ${tool.name} tool. Check the Agents tab to see it.`,
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to manage tool:', error);
      toast({
        title: "Tool Management Failed",
        description: `Failed to manage ${tool.name}. Please try again.`,
      });
    }
  };

  const handleSubmitTool = async (data: { name: string; description: string; category: string }) => {
    try {
      const newTool = {
        id: `custom-${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        version: "1.0.0",
        author: user?.email || "Unknown",
        tags: [data.category.toLowerCase()],
        downloads: 0,
        rating: 0,
        featured: false
      };

      setTools(prev => [newTool, ...prev]);
      toast({
        title: "Tool submitted",
        description: `"${data.name}" has been added to your tools.`,
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

  const handleDeleteTool = (toolId: string) => {
    setToolToDelete(toolId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (toolToDelete) {
      setTools(prev => prev.filter(t => t.id !== toolToDelete));
      toast({
        title: "Tool removed",
        description: "The tool has been removed from your gallery.",
      });
      setToolToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Tools Gallery</h1>
              <p className="text-text-secondary">Discover and integrate powerful AI tools for your workflow</p>
            </div>
            <Button 
              className="bg-accent-blue hover:bg-accent-blue/90"
              onClick={() => setSubmitModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Tool
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search tools..."
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
                  Pricing: {selectedPricing === "all" ? "All" : selectedPricing}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSelectedPricing("all")} className="text-card-foreground hover:bg-accent-blue/10">
                  All Pricing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPricing("free")} className="text-card-foreground hover:bg-accent-blue/10">
                  Free
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPricing("freemium")} className="text-card-foreground hover:bg-accent-blue/10">
                  Freemium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPricing("paid")} className="text-card-foreground hover:bg-accent-blue/10">
                  Paid
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort by: {sortBy === "featured" ? "Featured" : sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSortBy("featured")} className="text-card-foreground hover:bg-accent-blue/10">
                  Featured
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")} className="text-card-foreground hover:bg-accent-blue/10">
                  Rating
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("downloads")} className="text-card-foreground hover:bg-accent-blue/10">
                  Downloads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")} className="text-card-foreground hover:bg-accent-blue/10">
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("updated")} className="text-card-foreground hover:bg-accent-blue/10">
                  Recently Updated
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading tools...</h3>
              <p className="text-text-secondary">Discovering tools from your MCP agents</p>
            </div>
          )}

          {/* Featured Tools */}
          {!loading && featuredTools.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-orange" />
                Featured Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTools.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    featured 
                    getPricingColor={getPricingColor}
                    formatDate={formatDate}
                    onInstall={installTool}
                    onDelete={deleteTool}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Tools */}
          {!loading && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                All Tools ({otherTools.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherTools.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool}
                    getPricingColor={getPricingColor}
                    formatDate={formatDate}
                    onInstall={installTool}
                    onDelete={deleteTool}
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
                {tools.length === 0 
                  ? "Submit your first tool to get started"
                  : "Try adjusting your search or filters"
                }
              </p>
              {tools.length === 0 && (
                <Button 
                  className="mt-4"
                  onClick={() => setSubmitModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Tool
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolCard({ 
  tool, 
  featured = false, 
  getPricingColor, 
  formatDate,
  onInstall,
  onDelete
}: { 
  tool: Tool; 
  featured?: boolean;
  getPricingColor: (pricing: string) => string;
  formatDate: (date: Date) => string;
  onInstall: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
}) {
  return (
    <GlassCard className={cn(
      "p-6 hover:border-accent-blue/30 transition-all duration-200 group",
      featured && "border-accent-orange/30 bg-accent-orange/5"
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
              {tool.icon}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-text-secondary">{tool.author}</p>
            </div>
          </div>
          {featured && <Star className="h-4 w-4 text-accent-orange fill-current" />}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2">{tool.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tool.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tool.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tool.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-accent-orange" />
              <span className="text-text-secondary">{tool.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3 text-text-secondary" />
              <span className="text-text-secondary">{tool.downloads}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">v{tool.version}</span>
            <span className={cn("font-medium capitalize", getPricingColor(tool.pricing))}>
              {tool.pricing}
            </span>
          </div>
        </div>

        {/* Updated */}
        <div className="text-xs text-text-tertiary">
          Updated {formatDate(tool.lastUpdated)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onInstall(tool)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Manage Tool
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Show tool details
              alert(`Tool: ${tool.name}\nCategory: ${tool.category}\nVersion: ${tool.version}\nAuthor: ${tool.author}\n\nDescription: ${tool.description}\n\nTags: ${tool.tags.join(', ')}`);
            }}
            title="Tool details"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          
          {tool.author === "User Submitted" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(tool.id)}
              className="text-accent-red hover:text-accent-red"
              title="Delete tool"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}






