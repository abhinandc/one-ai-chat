import { useState } from "react";
import { Search, Filter, Star, Copy, Edit, BookOpen, Bookmark, Hash, Heart } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  likes: number;
  uses: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  featured: boolean;
  createdAt: Date;
}

const mockPrompts: PromptTemplate[] = [
  {
    id: "1",
    title: "Code Review Assistant",
    description: "Comprehensive code review with best practices and suggestions",
    content: `Please review the following code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security considerations
5. Maintainability

Code:
{code}

Please format your response with clear sections for each area.`,
    category: "Development",
    tags: ["code-review", "programming", "best-practices"],
    author: "DevExpert",
    likes: 245,
    uses: 1200,
    difficulty: "intermediate",
    featured: true,
    createdAt: new Date("2024-01-15")
  },
  {
    id: "2",
    title: "Content Writing Assistant",
    description: "Create engaging blog posts and articles with SEO optimization",
    content: `Write a comprehensive blog post about {topic} that includes:

1. **Compelling Headline**: Create an attention-grabbing title
2. **Introduction**: Hook the reader with an interesting opening
3. **Main Content**: 
   - Break into clear sections with subheadings
   - Include practical examples
   - Add actionable insights
4. **SEO Elements**:
   - Naturally incorporate keywords: {keywords}
   - Include meta description suggestion
5. **Conclusion**: Summarize key points and include a call-to-action

Target audience: {audience}
Tone: {tone}
Word count: {word_count} words`,
    category: "Content",
    tags: ["writing", "seo", "blog", "marketing"],
    author: "ContentPro",
    likes: 189,
    uses: 850,
    difficulty: "beginner",
    featured: true,
    createdAt: new Date("2024-02-01")
  },
  {
    id: "3",
    title: "Data Analysis Expert",
    description: "Analyze datasets and provide insights with visualizations",
    content: `Analyze the following dataset and provide insights:

Dataset: {dataset_description}
Data: {data}

Please provide:

1. **Data Overview**:
   - Summary statistics
   - Data quality assessment
   - Missing values analysis

2. **Key Insights**:
   - Trends and patterns
   - Correlations
   - Outliers and anomalies

3. **Visualizations**:
   - Suggest appropriate charts/graphs
   - Provide code for creating them

4. **Recommendations**:
   - Actionable insights
   - Next steps for analysis

5. **Business Impact**:
   - How findings relate to business goals
   - Potential opportunities`,
    category: "Analytics",
    tags: ["data-analysis", "statistics", "visualization"],
    author: "DataScientist",
    likes: 156,
    uses: 420,
    difficulty: "advanced",
    featured: false,
    createdAt: new Date("2024-01-20")
  },
  {
    id: "4",
    title: "Creative Writing Prompt",
    description: "Generate creative stories with character development",
    content: `Create a compelling short story with the following elements:

**Setting**: {setting}
**Genre**: {genre}
**Main Character**: {character_description}
**Conflict**: {conflict_type}

Story Requirements:
- Length: {word_count} words
- Include dialogue
- Show character development
- Create emotional engagement
- Use descriptive language
- Build to a satisfying conclusion

Style Notes:
- Tone: {tone}
- Perspective: {narrative_perspective}
- Target audience: {audience}

Please ensure the story has a clear beginning, middle, and end with proper character arc.`,
    category: "Creative",
    tags: ["storytelling", "creative-writing", "fiction"],
    author: "StoryMaster",
    likes: 203,
    uses: 670,
    difficulty: "intermediate",
    featured: true,
    createdAt: new Date("2024-01-10")
  },
  {
    id: "5",
    title: "Business Strategy Consultant",
    description: "Strategic business analysis and recommendations",
    content: `Provide a comprehensive business strategy analysis for {company_name} in the {industry} industry.

**Current Situation**:
{current_situation}

**Analysis Framework**:

1. **SWOT Analysis**:
   - Strengths
   - Weaknesses  
   - Opportunities
   - Threats

2. **Market Analysis**:
   - Industry trends
   - Competitive landscape
   - Target market assessment

3. **Strategic Recommendations**:
   - Short-term actions (3-6 months)
   - Medium-term strategy (6-18 months)
   - Long-term vision (2-5 years)

4. **Implementation Plan**:
   - Key milestones
   - Resource requirements
   - Success metrics

5. **Risk Assessment**:
   - Potential challenges
   - Mitigation strategies

Please provide actionable insights with specific recommendations.`,
    category: "Business",
    tags: ["strategy", "consulting", "analysis", "planning"],
    author: "BizConsultant",
    likes: 178,
    uses: 390,
    difficulty: "advanced",
    featured: false,
    createdAt: new Date("2024-01-25")
  },
  {
    id: "6",
    title: "Email Marketing Template",
    description: "High-converting email campaigns with personalization",
    content: `Create a high-converting email for {campaign_type}:

**Email Details**:
- Target audience: {audience}
- Goal: {campaign_goal}
- Product/Service: {product_service}

**Email Structure**:

1. **Subject Line**: 
   - Create 3 compelling options
   - A/B testing variations

2. **Preview Text**:
   - Complement the subject line
   - Increase open rates

3. **Email Body**:
   - Personalized greeting
   - Attention-grabbing opening
   - Clear value proposition
   - Social proof/testimonials
   - Strong call-to-action
   - Contact information

4. **Design Notes**:
   - Mobile-responsive layout
   - Visual hierarchy
   - Brand consistency

**Personalization Variables**:
- {first_name}
- {company}
- {previous_purchase}
- {location}

Tone: {tone}
Email length: {length} words`,
    category: "Marketing",
    tags: ["email", "marketing", "conversion", "personalization"],
    author: "EmailExpert",
    likes: 312,
    uses: 950,
    difficulty: "beginner",
    featured: true,
    createdAt: new Date("2024-02-05")
  }
];

const categories = ["All", "Development", "Content", "Analytics", "Creative", "Business", "Marketing"];

export default function PromptLibrary() {
  const [prompts] = useState<PromptTemplate[]>(mockPrompts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || prompt.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const featuredPrompts = filteredPrompts.filter(prompt => prompt.featured);
  const otherPrompts = filteredPrompts.filter(prompt => !prompt.featured);

  const copyPrompt = (content: string, title: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Prompt copied!",
      description: `"${title}" has been copied to your clipboard.`,
    });
  };

  const toggleLike = (promptId: string) => {
    setLikedPrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-accent-green";
      case "intermediate": return "text-accent-orange";
      case "advanced": return "text-accent-red";
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
              <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Library</h1>
              <p className="text-text-secondary">Discover and use proven AI prompt templates</p>
            </div>
            <Button className="bg-accent-blue hover:bg-accent-blue/90">
              <Edit className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search prompts..."
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
                  Difficulty: {selectedDifficulty === "all" ? "All" : selectedDifficulty}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border-border-primary shadow-lg z-50">
                <DropdownMenuItem onClick={() => setSelectedDifficulty("all")} className="text-card-foreground hover:bg-accent-blue/10">
                  All Levels
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDifficulty("beginner")} className="text-card-foreground hover:bg-accent-blue/10">
                  Beginner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDifficulty("intermediate")} className="text-card-foreground hover:bg-accent-blue/10">
                  Intermediate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedDifficulty("advanced")} className="text-card-foreground hover:bg-accent-blue/10">
                  Advanced
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
          {/* Featured Prompts */}
          {featuredPrompts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-orange" />
                Featured Prompts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPrompts.map((prompt) => (
                  <PromptCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    featured 
                    onCopy={copyPrompt}
                    onLike={toggleLike}
                    isLiked={likedPrompts.includes(prompt.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Prompts */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              All Prompts ({otherPrompts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPrompts.map((prompt) => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt} 
                  onCopy={copyPrompt}
                  onLike={toggleLike}
                  isLiked={likedPrompts.includes(prompt.id)}
                />
              ))}
            </div>
          </section>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No prompts found</h3>
              <p className="text-text-secondary">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PromptCard({ 
  prompt, 
  featured = false, 
  onCopy, 
  onLike, 
  isLiked 
}: { 
  prompt: PromptTemplate; 
  featured?: boolean;
  onCopy: (content: string, title: string) => void;
  onLike: (id: string) => void;
  isLiked: boolean;
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-accent-green";
      case "intermediate": return "text-accent-orange";
      case "advanced": return "text-accent-red";
      default: return "text-text-secondary";
    }
  };

  return (
    <GlassCard className={cn(
      "p-6 hover:border-accent-blue/30 transition-all duration-200 group",
      featured && "border-accent-orange/30 bg-accent-orange/5"
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              {featured && <Star className="h-4 w-4 text-accent-orange fill-current flex-shrink-0" />}
            </div>
            <p className="text-sm text-text-secondary">by {prompt.author}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2">{prompt.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs", getDifficultyColor(prompt.difficulty))}>
            {prompt.difficulty}
          </Badge>
          {prompt.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Hash className="h-2 w-2 mr-1" />
              {tag}
            </Badge>
          ))}
          {prompt.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{prompt.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className={cn("h-3 w-3", isLiked ? "text-accent-red fill-current" : "text-text-secondary")} />
              <span className="text-text-secondary">{prompt.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-3 w-3 text-text-secondary" />
              <span className="text-text-secondary">{prompt.uses}</span>
            </div>
          </div>
          <span className="text-text-tertiary">{prompt.category}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onCopy(prompt.content, prompt.title)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Prompt
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onLike(prompt.id)}
          >
            <Heart className={cn("h-3 w-3", isLiked && "text-accent-red fill-current")} />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}