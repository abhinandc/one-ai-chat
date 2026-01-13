import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Star,
  Copy,
  BookOpen,
  Heart,
  Plus,
  Trash2,
  Zap,
  Play,
  Settings,
  ChevronRight,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { promptService, PromptTemplate } from "@/services/promptService";
import { logger } from "@/lib/logger";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModels } from "@/hooks/useModels";
import { apiClient } from "@/services/api";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";

const categories = ["All", "research", "product", "executive", "vip", "General"];

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [externalPrompts, setExternalPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'community'>('library');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedFeed, setSelectedFeed] = useState<string>("all");
  const [feeds, setFeeds] = useState<any[]>([]);
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const { toast } = useToast();
  const user = useCurrentUser();

  // Playground state
  const { models, loading: modelsLoading } = useModels();
  const [playgroundModel, setPlaygroundModel] = useState("");
  const [playgroundTemperature, setPlaygroundTemperature] = useState(0.7);
  const [playgroundMaxTokens, setPlaygroundMaxTokens] = useState(2048);
  const [playgroundPrompt, setPlaygroundPrompt] = useState("");
  const [playgroundResponse, setPlaygroundResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadPrompts = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await promptService.getPrompts(user.email);
        setPrompts(data);
      } catch (error) {
        logger.error("Failed to load prompts", error);
        toast({
          title: "Failed to load prompts",
          description: "Could not fetch prompts from the database.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [user?.email, toast]);

  // Load external prompts and feeds for Community tab
  useEffect(() => {
    const loadExternalPrompts = async () => {
      if (activeTab !== 'community') return;

      try {
        setExternalLoading(true);
        const { promptFeedService } = await import('@/services/promptFeedService');

        // Load feeds
        const feedsData = await promptFeedService.getFeeds();
        setFeeds(feedsData.filter(f => f.is_active));

        // Load external prompts
        const filters: any = {};
        if (selectedFeed !== 'all') filters.feed_id = selectedFeed;
        if (selectedCategory !== 'All') filters.category = selectedCategory;
        if (selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty;
        if (searchQuery) filters.search = searchQuery;

        const promptsData = await promptFeedService.getExternalPrompts(filters);
        setExternalPrompts(promptsData);
      } catch (error) {
        logger.error("Failed to load external prompts", error);
        toast({
          title: "Failed to load community prompts",
          description: "Could not fetch prompts from external sources.",
          variant: "destructive"
        });
      } finally {
        setExternalLoading(false);
      }
    };

    loadExternalPrompts();
  }, [activeTab, selectedFeed, selectedCategory, selectedDifficulty, searchQuery, toast]);

  // Set default model when models load
  useEffect(() => {
    if (models.length > 0 && !playgroundModel) {
      setPlaygroundModel(models[0].id);
    }
  }, [models, playgroundModel]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "all" || prompt.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [prompts, searchQuery, selectedCategory, selectedDifficulty]);

  const featuredPrompts = filteredPrompts.filter(prompt => prompt.is_public);
  const myPrompts = filteredPrompts.filter(prompt => !prompt.is_public);

  const copyPrompt = (content: string, title: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Prompt copied!",
      description: `"${title}" has been copied to your clipboard.`,
    });
  };

  const toggleLike = async (promptId: string) => {
    if (!user?.email) return;

    try {
      await promptService.likePrompt(promptId, user.email);

      setLikedPrompts(prev =>
        prev.includes(promptId)
          ? prev.filter(id => id !== promptId)
          : [...prev, promptId]
      );

      setPrompts(prev => prev.map(prompt =>
        prompt.id === promptId
          ? { ...prompt, likes_count: likedPrompts.includes(promptId) ? prompt.likes_count - 1 : prompt.likes_count + 1 }
          : prompt
      ));
    } catch (error) {
      logger.error("Failed to like prompt", error);
    }
  };

  const handleCreatePrompt = async (data: { title: string; description: string; content: string; category: string; difficulty: string }) => {
    if (!user?.email) return;

    try {
      const newPrompt = await promptService.createPrompt({
        user_email: user.email,
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        tags: [],
        is_public: false,
        difficulty: data.difficulty as "beginner" | "intermediate" | "advanced"
      });

      setPrompts(prev => [newPrompt, ...prev]);
      toast({
        title: "Prompt created",
        description: `"${data.title}" has been added to your library.`,
      });
    } catch (error) {
      logger.error("Failed to create prompt", error);
      toast({
        title: "Failed to create",
        description: "Could not create the prompt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePrompt = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!promptToDelete || !user?.email) return;

    try {
      await promptService.deletePrompt(promptToDelete, user.email);
      setPrompts(prev => prev.filter(p => p.id !== promptToDelete));
      toast({
        title: "Prompt deleted",
        description: "The prompt has been removed from your library.",
      });
    } catch (error) {
      logger.error("Failed to delete prompt", error);
      toast({
        title: "Failed to delete",
        description: "Could not delete the prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPromptToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const openInPlayground = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setPlaygroundPrompt(prompt.content);
    setPlaygroundResponse("");
    setPlaygroundOpen(true);
  };

  const handleImportPrompt = async (externalPromptId: string, title: string) => {
    if (!user?.id) return;

    try {
      const { promptFeedService } = await import('@/services/promptFeedService');
      await promptFeedService.importToLibrary(externalPromptId, user.id);

      toast({
        title: "Prompt Imported",
        description: `"${title}" has been added to your library.`,
      });

      // Reload prompts
      const data = await promptService.getPrompts(user.email!);
      setPrompts(data);
    } catch (error) {
      logger.error("Failed to import prompt", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import prompt.",
        variant: "destructive"
      });
    }
  };

  const generateResponse = async () => {
    if (!playgroundPrompt.trim() || !playgroundModel) {
      toast({
        title: "Missing input",
        description: "Please enter a prompt and select a model.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPlaygroundResponse("");

    try {
      const stream = await apiClient.createChatCompletionStream({
        model: playgroundModel,
        messages: [{ role: "user", content: playgroundPrompt }],
        temperature: playgroundTemperature,
        max_tokens: playgroundMaxTokens,
        stream: true,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let response = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                response += content;
                setPlaygroundResponse(response);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      toast({
        title: "Response generated",
        description: `Generated using ${playgroundModel}`,
      });
    } catch (error) {
      logger.error("Generation error", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate response.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-600";
      case "intermediate": return "text-orange-500";
      case "advanced": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex bg-background">
      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", playgroundOpen && "mr-96")}>
        {/* Header */}
        <div className="border-b border-border p-6 shrink-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Prompt Library</h1>
                <p className="text-muted-foreground">Discover, create, and test AI prompt templates</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={playgroundOpen ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlaygroundOpen(!playgroundOpen)}
                  className="gap-2"
                >
                  {playgroundOpen ? (
                    <>
                      <PanelRightClose className="h-4 w-4" />
                      Hide Playground
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="h-4 w-4" />
                      Playground
                    </>
                  )}
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setCreateModalOpen(true)}
                  data-testid="button-create-prompt"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prompt
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'community')} className="mb-4">
              <TabsList>
                <TabsTrigger value="library">My Library</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-prompts"
                  />
                </div>
              </div>

              {activeTab === 'community' && feeds.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Feed: {selectedFeed === 'all' ? 'All' : feeds.find(f => f.id === selectedFeed)?.name || 'All'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-card border-border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => setSelectedFeed('all')}>All Feeds</DropdownMenuItem>
                    {feeds.map((feed) => (
                      <DropdownMenuItem key={feed.id} onClick={() => setSelectedFeed(feed.id)}>
                        {feed.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-filter-category">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border-border shadow-lg z-50">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="text-card-foreground hover:bg-primary/10"
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-filter-difficulty">
                    Difficulty: {selectedDifficulty === "all" ? "All" : selectedDifficulty}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setSelectedDifficulty("all")}>All Levels</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDifficulty("beginner")}>Beginner</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDifficulty("intermediate")}>Intermediate</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedDifficulty("advanced")}>Advanced</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'library' ? (
              <>
                {loading && (
                  <div className="text-center py-12">
                    {/* Skeleton loader - NO spinners per Constitution */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="skeleton w-16 h-16 rounded-xl" />
                      <div className="skeleton w-40 h-5 rounded" />
                      <div className="skeleton w-56 h-4 rounded" />
                    </div>
                  </div>
                )}

                {!loading && featuredPrompts.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-orange-500" />
                  Public Prompts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      featured
                      onCopy={copyPrompt}
                      onLike={toggleLike}
                      onUse={openInPlayground}
                      onDelete={handleDeletePrompt}
                      isLiked={likedPrompts.includes(prompt.id)}
                      getDifficultyColor={getDifficultyColor}
                      isOwner={prompt.user_email === user?.email}
                    />
                  ))}
                </div>
              </section>
            )}

                {!loading && (
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      My Prompts ({myPrompts.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onCopy={copyPrompt}
                          onLike={toggleLike}
                          onUse={openInPlayground}
                          onDelete={handleDeletePrompt}
                          isLiked={likedPrompts.includes(prompt.id)}
                          getDifficultyColor={getDifficultyColor}
                          isOwner={prompt.user_email === user?.email}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {!loading && filteredPrompts.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No prompts found</h3>
                    <p className="text-muted-foreground">
                      {prompts.length === 0
                        ? "Create your first prompt to get started"
                        : "Try adjusting your search or filters"
                      }
                    </p>
                    {prompts.length === 0 && (
                      <Button
                        className="mt-4"
                        onClick={() => setCreateModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Prompt
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Community Tab */}
                {externalLoading && (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="skeleton w-16 h-16 rounded-xl" />
                      <div className="skeleton w-40 h-5 rounded" />
                      <div className="skeleton w-56 h-4 rounded" />
                    </div>
                  </div>
                )}

                {!externalLoading && externalPrompts.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Community Prompts ({externalPrompts.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {externalPrompts.map((prompt) => (
                        <ExternalPromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onImport={handleImportPrompt}
                          onUse={(content: string) => {
                            setPlaygroundPrompt(content);
                            setPlaygroundOpen(true);
                          }}
                          getDifficultyColor={getDifficultyColor}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {!externalLoading && externalPrompts.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No community prompts available</h3>
                    <p className="text-muted-foreground">
                      {feeds.length === 0
                        ? "Ask your admin to configure community prompt feeds"
                        : "Try adjusting your search or filters"
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Playground Panel */}
      <div
        className={cn(
          "fixed right-0 top-14 bottom-12 w-96 bg-card border-l border-border transition-transform duration-300 z-40",
          playgroundOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Playground Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Playground</h3>
                {selectedPrompt && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    Testing: {selectedPrompt.title}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPlaygroundOpen(false)}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Model Settings */}
          <div className="p-4 border-b border-border space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Model</label>
              <Select value={playgroundModel} onValueChange={setPlaygroundModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {modelsLoading ? (
                    <SelectItem value="loading" disabled>Loading models...</SelectItem>
                  ) : models.length === 0 ? (
                    <SelectItem value="none" disabled>No models available</SelectItem>
                  ) : (
                    models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Temperature</label>
                <span className="text-xs text-muted-foreground">{playgroundTemperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[playgroundTemperature]}
                onValueChange={([value]) => setPlaygroundTemperature(value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Max Tokens</label>
                <span className="text-xs text-muted-foreground">{playgroundMaxTokens}</span>
              </div>
              <Slider
                value={[playgroundMaxTokens]}
                onValueChange={([value]) => setPlaygroundMaxTokens(value)}
                min={64}
                max={4096}
                step={64}
              />
            </div>
          </div>

          {/* Prompt Input */}
          <div className="flex-1 flex flex-col p-4 min-h-0">
            <label className="text-xs font-medium text-muted-foreground mb-2">Prompt</label>
            <textarea
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="flex-1 min-h-[120px] p-3 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <Button
              className="mt-3 w-full"
              onClick={generateResponse}
              disabled={isGenerating || !playgroundPrompt.trim() || !playgroundModel}
              loading={isGenerating}
            >
              {!isGenerating && (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Response
                </>
              )}
            </Button>
          </div>

          {/* Response */}
          <div className="flex-1 flex flex-col p-4 border-t border-border min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Response</label>
              {playgroundResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(playgroundResponse);
                    toast({ title: "Response copied!" });
                  }}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}
            </div>
            <div className="flex-1 p-3 bg-muted/50 border border-border/50 rounded-lg overflow-y-auto">
              {playgroundResponse ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {playgroundResponse}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isGenerating ? "Generating response..." : "Response will appear here"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePromptModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreatePrompt}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PromptCardProps {
  prompt: PromptTemplate;
  featured?: boolean;
  onCopy: (content: string, title: string) => void;
  onLike: (id: string) => void;
  onUse: (prompt: PromptTemplate) => void;
  onDelete: (id: string) => void;
  isLiked: boolean;
  getDifficultyColor: (difficulty: string) => string;
  isOwner: boolean;
}

function PromptCard({
  prompt,
  featured = false,
  onCopy,
  onLike,
  onUse,
  onDelete,
  isLiked,
  getDifficultyColor,
  isOwner
}: PromptCardProps) {
  return (
    <Card
      className={cn(
        "p-6 hover:border-primary/30 transition-all duration-200 group",
        featured && "border-orange-500/30 bg-orange-500/5"
      )}
      data-testid={`card-prompt-${prompt.id}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              {featured && <Star className="h-4 w-4 text-orange-500 fill-current flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{prompt.user_email}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{prompt.description}</p>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs", getDifficultyColor(prompt.difficulty))}>
            {prompt.difficulty}
          </Badge>
          {prompt.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {prompt.tags && prompt.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{prompt.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className={cn("h-3 w-3", isLiked ? "text-destructive fill-current" : "text-muted-foreground")} />
              <span className="text-muted-foreground">{prompt.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{prompt.uses_count}</span>
            </div>
          </div>
          <span className="text-muted-foreground">{prompt.category}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onUse(prompt)}
            data-testid={`button-use-prompt-${prompt.id}`}
          >
            <Play className="h-3 w-3 mr-1" />
            Test in Playground
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onCopy(prompt.content, prompt.title)}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onLike(prompt.id)}
            title="Like prompt"
          >
            <Heart className={cn("h-3 w-3", isLiked && "text-destructive fill-current")} />
          </Button>

          {isOwner && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(prompt.id)}
              className="text-destructive hover:text-destructive"
              title="Delete prompt"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ExternalPromptCardProps {
  prompt: any;
  onImport: (promptId: string, title: string) => void;
  onUse: (content: string) => void;
  getDifficultyColor: (difficulty: string) => string;
}

function ExternalPromptCard({
  prompt,
  onImport,
  onUse,
  getDifficultyColor
}: ExternalPromptCardProps) {
  return (
    <Card
      className="p-6 hover:border-primary/30 transition-all duration-200 group border-purple-500/20 bg-purple-500/5"
      data-testid={`card-external-prompt-${prompt.id}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                Community
              </Badge>
            </div>
            {prompt.author && (
              <p className="text-sm text-muted-foreground truncate">
                by {prompt.author}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {prompt.description || 'No description available'}
        </p>

        <div className="flex flex-wrap gap-2">
          {prompt.difficulty && (
            <Badge className={cn("text-xs", getDifficultyColor(prompt.difficulty))}>
              {prompt.difficulty}
            </Badge>
          )}
          {prompt.category && (
            <Badge variant="outline" className="text-xs">
              {prompt.category}
            </Badge>
          )}
          {prompt.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {prompt.tags && prompt.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{prompt.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{prompt.uses_count}</span>
            </div>
          </div>
          {prompt.source_url && (
            <a
              href={prompt.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Source
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onImport(prompt.id, prompt.title)}
            data-testid={`button-import-prompt-${prompt.id}`}
          >
            <Plus className="h-3 w-3 mr-1" />
            Import to Library
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onUse(prompt.content)}
            title="Test in playground"
          >
            <Play className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(prompt.content);
            }}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
