import { useState } from "react";
import { Search, Filter, Star, Download, ExternalLink, Zap, Code, Database, Image, FileText, Calculator } from "lucide-react";
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

const mockTools: Tool[] = [
  {
    id: "1",
    name: "Code Analyzer",
    description: "Advanced static code analysis tool with AI-powered suggestions for optimization and bug detection",
    category: "Development",
    tags: ["code-analysis", "debugging", "optimization"],
    rating: 4.8,
    downloads: "50K+",
    icon: <Code className="h-6 w-6" />,
    pricing: "free",
    featured: true,
    author: "DevTools Inc",
    version: "2.1.0",
    lastUpdated: new Date("2024-02-01")
  },
  {
    id: "2",
    name: "Data Visualizer",
    description: "Create stunning charts and graphs from your data with AI-assisted design recommendations",
    category: "Analytics",
    tags: ["visualization", "charts", "data-analysis"],
    rating: 4.6,
    downloads: "35K+",
    icon: <Database className="h-6 w-6" />,
    pricing: "freemium",
    featured: true,
    author: "DataViz Pro",
    version: "1.5.2",
    lastUpdated: new Date("2024-01-28")
  },
  {
    id: "3",
    name: "Image Generator",
    description: "AI-powered image generation tool with multiple styles and customization options",
    category: "Creative",
    tags: ["image-generation", "ai-art", "creative"],
    rating: 4.9,
    downloads: "120K+",
    icon: <Image className="h-6 w-6" />,
    pricing: "paid",
    featured: true,
    author: "Creative AI",
    version: "3.0.1",
    lastUpdated: new Date("2024-02-05")
  },
  {
    id: "4",
    name: "Document Parser",
    description: "Extract and structure data from documents using advanced OCR and natural language processing",
    category: "Productivity",
    tags: ["ocr", "document-processing", "data-extraction"],
    rating: 4.5,
    downloads: "28K+",
    icon: <FileText className="h-6 w-6" />,
    pricing: "freemium",
    featured: false,
    author: "DocTools",
    version: "1.8.3",
    lastUpdated: new Date("2024-01-25")
  },
  {
    id: "5",
    name: "API Tester",
    description: "Comprehensive API testing suite with automated test generation and performance monitoring",
    category: "Development",
    tags: ["api-testing", "automation", "monitoring"],
    rating: 4.7,
    downloads: "42K+",
    icon: <Zap className="h-6 w-6" />,
    pricing: "free",
    featured: false,
    author: "API Masters",
    version: "2.3.1",
    lastUpdated: new Date("2024-01-30")
  },
  {
    id: "6",
    name: "Smart Calculator",
    description: "Advanced calculator with natural language input and step-by-step solution explanations",
    category: "Productivity",
    tags: ["calculator", "math", "problem-solving"],
    rating: 4.4,
    downloads: "85K+",
    icon: <Calculator className="h-6 w-6" />,
    pricing: "free",
    featured: true,
    author: "MathTools",
    version: "1.2.0",
    lastUpdated: new Date("2024-02-03")
  }
];

const categories = ["All", "Development", "Analytics", "Creative", "Productivity", "Marketing"];

export default function ToolsGallery() {
  const [tools] = useState<Tool[]>(mockTools);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

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
            <Button className="bg-accent-blue hover:bg-accent-blue/90">
              <Download className="h-4 w-4 mr-2" />
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
          {/* Featured Tools */}
          {featuredTools.length > 0 && (
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
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Tools */}
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
                />
              ))}
            </div>
          </section>

          {sortedTools.length === 0 && (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No tools found</h3>
              <p className="text-text-secondary">Try adjusting your search or filters</p>
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
  formatDate 
}: { 
  tool: Tool; 
  featured?: boolean;
  getPricingColor: (pricing: string) => string;
  formatDate: (date: Date) => string;
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
          <Button size="sm" className="flex-1">
            <Zap className="h-3 w-3 mr-1" />
            Install Tool
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}