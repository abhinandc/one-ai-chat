import { useState } from "react";
import { Search, Book, MessageCircle, Video, FileText, ExternalLink, ChevronRight, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    title: "Getting Started with OneEdge Platform",
    description: "Complete guide to setting up your OneEdge environment with LiteLLM, vLLM, and Ollama integration",
    category: "Getting Started",
    readTime: "8 min",
    popularity: 98,
    lastUpdated: new Date("2024-02-15"),
    helpful: 456
  },
  {
    id: "2",
    title: "Deploying Models with vLLM",
    description: "Learn how to deploy and manage AI models using vLLM for high-performance inference",
    category: "Models",
    readTime: "12 min",
    popularity: 94,
    lastUpdated: new Date("2024-02-12"),
    helpful: 389
  },
  {
    id: "3",
    title: "Creating Intelligent Agents",
    description: "Build powerful AI agents with custom tools, capabilities, and MCP integration",
    category: "Agents",
    readTime: "15 min",
    popularity: 96,
    lastUpdated: new Date("2024-02-10"),
    helpful: 423
  },
  {
    id: "4",
    title: "OnePass MCP Service Guide",
    description: "Understand and configure the OnePass Model Context Protocol for agent management",
    category: "MCP",
    readTime: "10 min",
    popularity: 91,
    lastUpdated: new Date("2024-02-08"),
    helpful: 267
  },
  {
    id: "5",
    title: "Prompt Library Management",
    description: "Organize and optimize your prompt templates for consistent AI interactions",
    category: "Prompts",
    readTime: "7 min",
    popularity: 89,
    lastUpdated: new Date("2024-02-05"),
    helpful: 234
  },
  {
    id: "6",
    title: "Tools Gallery Integration",
    description: "Discover, install, and manage AI tools across your agent ecosystem",
    category: "Tools",
    readTime: "9 min",
    popularity: 87,
    lastUpdated: new Date("2024-02-03"),
    helpful: 198
  },
  {
    id: "7",
    title: "Playground Advanced Features",
    description: "Master the AI Playground with streaming, model switching, and session management",
    category: "Playground",
    readTime: "11 min",
    popularity: 93,
    lastUpdated: new Date("2024-02-01"),
    helpful: 345
  },
  {
    id: "8",
    title: "Docker Deployment Guide",
    description: "Deploy OneEdge infrastructure using Docker Compose with Nginx and OAuth2 proxy",
    category: "Deployment",
    readTime: "20 min",
    popularity: 85,
    lastUpdated: new Date("2024-01-30"),
    helpful: 156
  }
];

const tutorials: Tutorial[] = [
  {
    id: "1",
    title: "OneEdge Platform Complete Setup",
    description: "End-to-end setup of OneEdge with Docker, LiteLLM, vLLM, and Ollama integration",
    duration: "24:15",
    difficulty: "beginner",
    views: 18750,
    category: "Setup"
  },
  {
    id: "2",
    title: "Model Deployment with vLLM",
    description: "Deploy and optimize AI models using vLLM for production workloads",
    duration: "19:32",
    difficulty: "intermediate",
    views: 12340,
    category: "Models"
  },
  {
    id: "3",
    title: "Building Intelligent Agents",
    description: "Create sophisticated AI agents with custom tools and MCP integration",
    duration: "31:48",
    difficulty: "intermediate",
    views: 9876,
    category: "Agents"
  },
  {
    id: "4",
    title: "OnePass MCP Configuration",
    description: "Configure and manage the OnePass Model Context Protocol service",
    duration: "16:22",
    difficulty: "advanced",
    views: 6543,
    category: "MCP"
  },
  {
    id: "5",
    title: "Chat Interface Customization",
    description: "Customize the OneEdge chat interface with system prompts and model switching",
    duration: "14:55",
    difficulty: "beginner",
    views: 11234,
    category: "Chat"
  },
  {
    id: "6",
    title: "Playground Power Features",
    description: "Master streaming responses, session management, and model comparison",
    duration: "22:08",
    difficulty: "intermediate",
    views: 8765,
    category: "Playground"
  },
  {
    id: "7",
    title: "Docker Infrastructure Deep Dive",
    description: "Advanced Docker deployment with Nginx, OAuth2, and Cloudflare tunnels",
    duration: "38:44",
    difficulty: "advanced",
    views: 4321,
    category: "Infrastructure"
  },
  {
    id: "8",
    title: "Troubleshooting Common Issues",
    description: "Diagnose and fix common OneEdge deployment and configuration problems",
    duration: "26:17",
    difficulty: "intermediate",
    views: 7890,
    category: "Troubleshooting"
  }
];

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I deploy OneEdge with Docker?",
    answer: "OneEdge uses Docker Compose for easy deployment. Run 'docker compose -f docker-compose-oneai.yml up -d' in the docker directory. This will start all services including vLLM, LiteLLM, OnePass MCP, and the OneEdge UI with Nginx reverse proxy.",
    category: "Getting Started",
    helpful: 289
  },
  {
    id: "2",
    question: "Which AI models are supported?",
    answer: "OneEdge supports models through vLLM (Nemotron, Qwen, Llama, etc.), Ollama (local models), and LiteLLM proxy (OpenAI, Anthropic, Google, etc.). You can deploy models locally or connect to external APIs through our unified interface.",
    category: "Models",
    helpful: 345
  },
  {
    id: "3",
    question: "What is OnePass MCP?",
    answer: "OnePass MCP (Model Context Protocol) is our agent management service that handles AI agents, tools, capabilities, datasets, guardrails, and routing. It provides a unified API for managing your AI ecosystem at http://localhost:6060.",
    category: "MCP",
    helpful: 234
  },
  {
    id: "4",
    question: "How do I create and manage agents?",
    answer: "Use the Agents tab to create AI agents with custom tools and capabilities. Agents are managed through the OnePass MCP service and can be configured with specific roles, tools, and guardrails for different use cases.",
    category: "Agents",
    helpful: 198
  },
  {
    id: "5",
    question: "Can I use custom prompts and templates?",
    answer: "Yes! The Prompt Library allows you to create, organize, and reuse prompt templates. You can create custom prompts or use system prompts from existing agents. Prompts support variables and can be loaded directly into chat conversations.",
    category: "Prompts",
    helpful: 167
  },
  {
    id: "6",
    question: "How does the Tools Gallery work?",
    answer: "The Tools Gallery shows available AI tools from your agents. You can install tools by creating new agents, manage existing tool assignments, and submit custom tools. Tools are shared across agents and managed through the MCP service.",
    category: "Tools",
    helpful: 143
  },
  {
    id: "7",
    question: "What's the difference between Chat and Playground?",
    answer: "Chat provides a conversational interface with message history, system prompts, and model switching. Playground offers a more experimental environment with streaming toggles, session management, and side-by-side prompt/response comparison.",
    category: "Chat",
    helpful: 212
  },
  {
    id: "8",
    question: "How do I troubleshoot connection issues?",
    answer: "Check that all Docker containers are running with 'docker ps'. Verify services at http://localhost:3010 (UI), http://localhost:8000 (vLLM), http://localhost:4000 (LiteLLM), and http://localhost:6060 (MCP). Check container logs for specific error messages.",
    category: "Troubleshooting",
    helpful: 156
  },
  {
    id: "9",
    question: "Can I integrate with external services?",
    answer: "Yes! OneEdge supports integration through LiteLLM for external AI APIs, custom tools in agents, and REST API endpoints. You can connect to OpenAI, Anthropic, Google, and other services while maintaining a unified interface.",
    category: "Integration",
    helpful: 189
  },
  {
    id: "10",
    question: "How do I configure Nginx and OAuth2?",
    answer: "OneEdge includes Nginx reverse proxy and OAuth2-proxy for authentication. Configuration files are in the nginx and oauth2-proxy directories. The setup supports Google SSO, Cloudflare tunnels, and custom domain routing.",
    category: "Configuration",
    helpful: 134
  }
];

const quickActions = [
  {
    title: "OneEdge Documentation",
    description: "Complete setup and usage guides",
    icon: <Book className="h-6 w-6" />,
    action: "docs"
  },
  {
    title: "MCP API Reference",
    description: "OnePass MCP service endpoints",
    icon: <FileText className="h-6 w-6" />,
    action: "api"
  },
  {
    title: "Docker Setup Guide",
    description: "Deploy OneEdge with Docker Compose",
    icon: <Video className="h-6 w-6" />,
    action: "docker"
  },
  {
    title: "GitHub Repository",
    description: "Source code and issue tracking",
    icon: <ExternalLink className="h-6 w-6" />,
    action: "github"
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [helpfulItems, setHelpfulItems] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{ title: string; content: string }>({ title: "", content: "" });
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  const categories = ["All", "Getting Started", "Models", "Agents", "MCP", "Prompts", "Tools", "Playground", "Deployment", "Chat", "Troubleshooting", "Integration", "Configuration"];

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
      case "beginner": return "text-green-600 bg-green-500/10";
      case "intermediate": return "text-orange-500 bg-orange-500/10";
      case "advanced": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground";
    }
  };

  const handleHelpful = (type: 'article' | 'faq', id: string, currentCount: number) => {
    const key = `${type}-${id}`;
    const isAlreadyMarked = helpfulItems.has(key);
    
    if (isAlreadyMarked) {
      // Remove helpful mark
      const newHelpfulItems = new Set(helpfulItems);
      newHelpfulItems.delete(key);
      setHelpfulItems(newHelpfulItems);
      setHelpfulCounts(prev => ({
        ...prev,
        [key]: Math.max(0, (prev[key] || currentCount) - 1)
      }));
    } else {
      // Add helpful mark
      const newHelpfulItems = new Set(helpfulItems);
      newHelpfulItems.add(key);
      setHelpfulItems(newHelpfulItems);
      setHelpfulCounts(prev => ({
        ...prev,
        [key]: (prev[key] || currentCount) + 1
      }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl p-8 mb-6">
              <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
              <p className="text-lg text-muted-foreground mb-0">
                Find answers, tutorials, and resources to help you succeed with OneEdge
              </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help articles, tutorials, or FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => {
                  if (action.action === "docs") {
                    alert("OneEdge Documentation\n\nComplete setup and usage guides for:\n- Docker deployment with docker-compose-oneai.yml\n- vLLM model configuration\n- OnePass MCP service setup\n- Agent creation and management\n- Chat interface customization\n\nThis would normally open comprehensive documentation.");
                  } else if (action.action === "api") {
                    try {
                      window.open("http://localhost:6060/api", "_blank");
                    } catch (e) {
                      alert("MCP API Reference\n\nOnePass MCP service endpoints:\n- GET /api/mcp/agents - List agents\n- POST /api/mcp/agents - Create agent\n- GET /api/mcp/tools - List tools\n- GET /api/mcp/capabilities - List capabilities\n\nService running at: http://localhost:6060");
                    }
                  } else if (action.action === "docker") {
                    setDialogContent({ title: "Docker Setup Guide", content: "Deploy OneEdge with Docker Compose:\n\n1. Navigate to F:/LLM_STATE/docker\n2. Run: docker compose -f docker-compose-oneai.yml up -d\n3. Access UI at: http://localhost:3010\n4. Check services: vLLM (8000), LiteLLM (4000), MCP (6060)" }); setDialogOpen(true);
                  } else if (action.action === "github") {
                    alert("GitHub Repository\n\nOneEdge Platform Source Code\n\nFeatures:\n- Docker-based deployment\n- Multi-model support (vLLM, Ollama, LiteLLM)\n- Agent management with MCP\n- Modern React UI with Shadcn\n\nThis would normally open the GitHub repository.");
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md h-12">
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
                    selectedCategory === category && "bg-primary hover:bg-primary/90"
                  )}
                >
                  {category}
                </Button>
              ))}
            </div>

            <TabsContent value="articles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="p-6 hover:border-primary/30 transition-colors group cursor-pointer">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{article.category}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {article.readTime}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-orange-500" />
                            <span className="text-muted-foreground">{article.popularity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {helpfulCounts[`article-${article.id}`] || article.helpful}
                            </span>
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {article.lastUpdated.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setDialogContent({ title: article.title, content: article.description }); setDialogOpen(true);
                          }}
                        >
                          <FileText className="h-3 w-3 mr-2" />
                          Read Article
                        </Button>
                        <Button
                          variant={helpfulItems.has(`article-${article.id}`) ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleHelpful('article', article.id, article.helpful)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="p-6 hover:border-primary/30 transition-colors group cursor-pointer">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {tutorial.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{tutorial.category}</p>
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

                      <p className="text-sm text-muted-foreground">
                        {tutorial.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{tutorial.views.toLocaleString()} views</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDialogContent({ title: tutorial.title, content: `Duration: ${tutorial.duration}\nDifficulty: ${tutorial.difficulty}\n\n${tutorial.description}` }); setDialogOpen(true);
                        }}
                      >
                        <Video className="h-3 w-3 mr-2" />
                        Watch Tutorial
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <Card key={faq.id} className="p-6 hover:border-primary/30 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground flex-1">
                          {faq.question}
                        </h3>
                        <Badge variant="secondary" className="text-xs ml-4">
                          {faq.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {helpfulCounts[`faq-${faq.id}`] || faq.helpful} people found this helpful
                          </span>
                        </div>
                        <Button
                          variant={helpfulItems.has(`faq-${faq.id}`) ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleHelpful('faq', faq.id, faq.helpful)}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {helpfulItems.has(`faq-${faq.id}`) ? "Helpful!" : "Helpful"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* No Results */}
          {((filteredArticles.length === 0 && searchQuery) ||
            (filteredFAQs.length === 0 && searchQuery)) && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">Try different keywords or browse by category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



