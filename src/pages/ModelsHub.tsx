import { useState } from "react";
import { Search, Filter, Star, Download, ExternalLink, Cpu, Zap, Brain } from "lucide-react";
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

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: string[];
  stars: number;
  downloads: string;
  size: string;
  type: "text" | "image" | "audio" | "multimodal";
  pricing: "free" | "paid" | "freemium";
  featured: boolean;
}

const mockModels: Model[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Most capable GPT model for complex reasoning tasks",
    tags: ["reasoning", "coding", "analysis"],
    stars: 95,
    downloads: "10M+",
    size: "175B",
    type: "text",
    pricing: "paid",
    featured: true
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Advanced AI assistant for complex reasoning and analysis",
    tags: ["reasoning", "writing", "analysis"],
    stars: 92,
    downloads: "5M+",
    size: "Unknown",
    type: "text",
    pricing: "paid",
    featured: true
  },
  {
    id: "llama-2-70b",
    name: "Llama 2 70B",
    provider: "Meta",
    description: "Open-source large language model",
    tags: ["open-source", "general"],
    stars: 88,
    downloads: "8M+",
    size: "70B",
    type: "text",
    pricing: "free",
    featured: false
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "OpenAI",
    description: "Advanced text-to-image generation model",
    tags: ["image-generation", "creative"],
    stars: 89,
    downloads: "3M+",
    size: "Unknown",
    type: "image",
    pricing: "paid",
    featured: true
  },
  {
    id: "whisper",
    name: "Whisper",
    provider: "OpenAI",
    description: "Automatic speech recognition system",
    tags: ["speech", "transcription"],
    stars: 94,
    downloads: "12M+",
    size: "1.5B",
    type: "audio",
    pricing: "free",
    featured: false
  },
  {
    id: "gpt-4-vision",
    name: "GPT-4 Vision",
    provider: "OpenAI",
    description: "GPT-4 with vision capabilities",
    tags: ["vision", "multimodal"],
    stars: 91,
    downloads: "2M+",
    size: "Unknown",
    type: "multimodal",
    pricing: "paid",
    featured: true
  }
];

export default function ModelsHub() {
  const [models] = useState<Model[]>(mockModels);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPricing, setSelectedPricing] = useState<string>("all");

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "all" || model.type === selectedType;
    const matchesPricing = selectedPricing === "all" || model.pricing === selectedPricing;
    
    return matchesSearch && matchesType && matchesPricing;
  });

  const featuredModels = filteredModels.filter(model => model.featured);
  const otherModels = filteredModels.filter(model => !model.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return "🖼️";
      case "audio": return "🎵";
      case "multimodal": return "🔄";
      default: return "💬";
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case "free": return "text-accent-green";
      case "paid": return "text-accent-blue";
      case "freemium": return "text-accent-orange";
      default: return "text-text-secondary";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Models Hub</h1>
              <p className="text-text-secondary">Discover and integrate AI models for your applications</p>
            </div>
            <Button className="bg-accent-blue hover:bg-accent-blue/90">
              <Download className="h-4 w-4 mr-2" />
              Deploy Model
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search models..."
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
                  Type: {selectedType === "all" ? "All" : selectedType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSelectedType("all")} className="text-card-foreground hover:bg-accent-blue/10">
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("text")} className="text-card-foreground hover:bg-accent-blue/10">
                  💬 Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("image")} className="text-card-foreground hover:bg-accent-blue/10">
                  🖼️ Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("audio")} className="text-card-foreground hover:bg-accent-blue/10">
                  🎵 Audio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType("multimodal")} className="text-card-foreground hover:bg-accent-blue/10">
                  🔄 Multimodal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Featured Models */}
          {featuredModels.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-orange" />
                Featured Models
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredModels.map((model) => (
                  <ModelCard key={model.id} model={model} featured getTypeIcon={getTypeIcon} getPricingColor={getPricingColor} />
                ))}
              </div>
            </section>
          )}

          {/* All Models */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              All Models ({otherModels.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherModels.map((model) => (
                <ModelCard key={model.id} model={model} getTypeIcon={getTypeIcon} getPricingColor={getPricingColor} />
              ))}
            </div>
          </section>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No models found</h3>
              <p className="text-text-secondary">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model, featured = false, getTypeIcon, getPricingColor }: { model: Model; featured?: boolean; getTypeIcon: (type: string) => string; getPricingColor: (pricing: string) => string }) {
  return (
    <GlassCard className={cn(
      "p-6 hover:border-accent-blue/30 transition-all duration-200 group",
      featured && "border-accent-orange/30 bg-accent-orange/5"
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getTypeIcon(model.type)}</div>
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                {model.name}
              </h3>
              <p className="text-sm text-text-secondary">{model.provider}</p>
            </div>
          </div>
          {featured && <Star className="h-4 w-4 text-accent-orange fill-current" />}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2">{model.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {model.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{model.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-accent-orange" />
              <span className="text-text-secondary">{model.stars}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3 text-text-secondary" />
              <span className="text-text-secondary">{model.downloads}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">{model.size}</span>
            <span className={cn("font-medium capitalize", getPricingColor(model.pricing))}>
              {model.pricing}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              // Use model functionality - navigate to playground with this model
              window.location.href = `/playground?model=${model.id}`;
            }}
          >
            <Zap className="h-3 w-3 mr-1" />
            Use Model
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/models/${model.id}`, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}