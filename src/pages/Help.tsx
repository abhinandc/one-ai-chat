import { useState } from "react";
import { Search, Book, MessageCircle, Video, FileText, ExternalLink, ChevronRight, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  popularity: number;
  lastUpdated: Date;
  helpful: number;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  views: number;
  category: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Getting Started with OneAI",
    description: "Learn the basics of using OneAI platform and its core features",
    category: "Getting Started",
    readTime: "5 min",
    popularity: 95,
    lastUpdated: new Date("2024-02-01"),
    helpful: 234
  },
  {
    id: "2",
    title: "Setting Up Your First Automation",
    description: "Step-by-step guide to creating your first AI automation workflow",
    category: "Automations",
    readTime: "8 min",
    popularity: 87,
    lastUpdated: new Date("2024-01-28"),
    helpful: 189
  },
  {
    id: "3",
    title: "Model Configuration Best Practices",
    description: "Optimize your AI models for better performance and accuracy",
    category: "Models",
    readTime: "12 min",
    popularity: 92,
    lastUpdated: new Date("2024-01-25"),
    helpful: 156
  },
  {
    id: "4",
    title: "Prompt Engineering Guide",
    description: "Master the art of writing effective prompts for better AI responses",
    category: "Prompts",
    readTime: "15 min",
    popularity: 98,
    lastUpdated: new Date("2024-02-03"),
    helpful: 312
  }
];

const tutorials: Tutorial[] = [
  {
    id: "1",
    title: "OneAI Platform Overview",
    description: "Complete overview of the OneAI platform and its capabilities",
    duration: "12:34",
    difficulty: "beginner",
    views: 15420,
    category: "Overview"
  },
  {
    id: "2",
    title: "Building Your First Chatbot",
    description: "Create an intelligent chatbot from scratch using OneAI tools",
    duration: "28:45",
    difficulty: "intermediate",
    views: 8934,
    category: "Chatbots"
  },
  {
    id: "3",
    title: "Advanced Automation Workflows",
    description: "Learn to create complex multi-step automation workflows",
    duration: "35:22",
    difficulty: "advanced",
    views: 5672,
    category: "Automations"
  },
  {
    id: "4",
    title: "API Integration Tutorial",
    description: "Integrate OneAI with external services using our REST API",
    duration: "22:18",
    difficulty: "intermediate",
    views: 7123,
    category: "API"
  }
];

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I get started with OneAI?",
    answer: "To get started with OneAI, simply create an account, choose your plan, and follow our getting started guide. You can begin with our free tier which includes basic features and gradually upgrade as your needs grow.",
    category: "Getting Started",
    helpful: 156
  },
  {
    id: "2",
    question: "What AI models are available?",
    answer: "OneAI supports a wide range of AI models including GPT-4, Claude 3, Llama 2, DALL-E, and many more. You can access models from OpenAI, Anthropic, Meta, Google, and other leading AI providers through our unified interface.",
    category: "Models",
    helpful: 203
  },
  {
    id: "3",
    question: "Can I create custom automations?",
    answer: "Yes! OneAI provides a powerful automation builder that allows you to create custom workflows. You can chain multiple AI operations, set triggers, and integrate with external services to build sophisticated automation pipelines.",
    category: "Automations",
    helpful: 178
  },
  {
    id: "4",
    question: "Is there an API available?",
    answer: "Yes, OneAI provides a comprehensive REST API that allows you to integrate our services into your applications. The API includes endpoints for model inference, automation management, and data processing.",
    category: "API",
    helpful: 134
  }
];

const quickActions = [
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: <MessageCircle className="h-6 w-6" />,
    action: "contact"
  },
  {
    title: "API Documentation",
    description: "Explore our comprehensive API docs",
    icon: <Book className="h-6 w-6" />,
    action: "docs"
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: <Video className="h-6 w-6" />,
    action: "videos"
  },
  {
    title: "Community Forum",
    description: "Join discussions with other users",
    icon: <MessageCircle className="h-6 w-6" />,
    action: "forum"
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Getting Started", "Models", "Automations", "Prompts", "API"];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-accent-green bg-accent-green/10";
      case "intermediate": return "text-accent-orange bg-accent-orange/10";
      case "advanced": return "text-accent-red bg-accent-red/10";
      default: return "text-text-secondary";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Help Center</h1>
            <p className="text-lg text-text-secondary mb-6">
              Find answers, tutorials, and resources to help you succeed with OneAI
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <GlassInput
                  placeholder="Search for help articles, tutorials, or FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                  variant="search"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <GlassCard key={index} className="p-4 hover:border-accent-blue/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{action.title}</h3>
                    <p className="text-sm text-text-secondary">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary ml-auto" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* Category Filters */}
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

            <TabsContent value="articles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <GlassCard key={article.id} className="p-6 hover:border-accent-blue/30 transition-colors group cursor-pointer">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1">{article.category}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {article.readTime}
                        </Badge>
                      </div>

                      <p className="text-sm text-text-secondary line-clamp-3">
                        {article.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-accent-orange" />
                            <span className="text-text-secondary">{article.popularity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 text-text-secondary" />
                            <span className="text-text-secondary">{article.helpful}</span>
                          </div>
                        </div>
                        <span className="text-text-tertiary">
                          {article.lastUpdated.toLocaleDateString()}
                        </span>
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-3 w-3 mr-2" />
                        Read Article
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutorials.map((tutorial) => (
                  <GlassCard key={tutorial.id} className="p-6 hover:border-accent-blue/30 transition-colors group cursor-pointer">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                            {tutorial.title}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1">{tutorial.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getDifficultyColor(tutorial.difficulty))}>
                            {tutorial.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tutorial.duration}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-text-secondary">
                        {tutorial.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3 text-text-secondary" />
                          <span className="text-text-secondary">{tutorial.views.toLocaleString()} views</span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <Video className="h-3 w-3 mr-2" />
                        Watch Tutorial
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <GlassCard key={faq.id} className="p-6 hover:border-accent-blue/30 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-text-primary flex-1">
                          {faq.question}
                        </h3>
                        <Badge variant="secondary" className="text-xs ml-4">
                          {faq.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-text-secondary leading-relaxed">
                        {faq.answer}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-text-secondary" />
                          <span className="text-sm text-text-secondary">
                            {faq.helpful} people found this helpful
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Helpful
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* No Results */}
          {((filteredArticles.length === 0 && searchQuery) || 
            (filteredFAQs.length === 0 && searchQuery)) && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No results found</h3>
              <p className="text-text-secondary">Try different keywords or browse by category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}