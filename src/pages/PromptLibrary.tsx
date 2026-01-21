import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Star, Copy, BookOpen, Heart, Plus, Trash2, Zap, Edit2, Share2, Globe, Lock, Download, Sparkles, Users, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { promptService, PromptTemplate, ExternalPrompt, PromptFeed, PromptShare } from "@/services/promptService";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
import { EditPromptModal } from "@/components/modals/EditPromptModal";
import { SharePromptModal } from "@/components/modals/SharePromptModal";
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
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "General", "Development", "Content", "Analytics", "Creative"];

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [externalPrompts, setExternalPrompts] = useState<ExternalPrompt[]>([]);
  const [dailyPrompts, setDailyPrompts] = useState<ExternalPrompt[]>([]);
  const [dailyPicksDate, setDailyPicksDate] = useState<string>("");
  const [feeds, setFeeds] = useState<PromptFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedFeed, setSelectedFeed] = useState<string>("all");
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("my-prompts");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected prompt for actions
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [promptShares, setPromptShares] = useState<PromptShare[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  const { toast } = useToast();
  const user = useCurrentUser();

  // Load user prompts
  useEffect(() => {
    const loadPrompts = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [data, liked] = await Promise.all([
          promptService.getPrompts(user.email),
          promptService.getUserLikedPrompts(user.email)
        ]);
        setPrompts(data);
        setLikedPrompts(liked);
      } catch (error) {
        console.error("Failed to load prompts:", error);
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

  // Load external prompts and feeds when tab changes
  useEffect(() => {
    if (activeTab === "community" && externalPrompts.length === 0) {
      loadExternalPrompts();
    }
  }, [activeTab]);

  const loadExternalPrompts = async () => {
    setLoadingExternal(true);
    setLoadingDaily(true);
    try {
      const [promptsData, feedsData, dailyData] = await Promise.all([
        promptService.getExternalPrompts({ limit: 50 }),
        promptService.getPromptFeeds(),
        promptService.getDailyPrompts(6)
      ]);
      setExternalPrompts(promptsData);
      setFeeds(feedsData);
      setDailyPrompts(dailyData);
      setDailyPicksDate(promptService.getDailyPicksDate());
    } catch (error) {
      console.error("Failed to load external prompts:", error);
      toast({
        title: "Failed to load community prompts",
        description: "Could not fetch external prompts.",
        variant: "destructive"
      });
    } finally {
      setLoadingExternal(false);
      setLoadingDaily(false);
    }
  };

  const refreshDailyPicks = async () => {
    // Clear current prompts first for smooth exit animation
    setDailyPrompts([]);
    setLoadingDaily(true);

    // Small delay to let exit animation play
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const dailyData = await promptService.getDailyPrompts(6);
      setLoadingDaily(false);
      setDailyPrompts(dailyData);
      setDailyPicksDate(promptService.getDailyPicksDate());
      toast({
        title: "Daily picks refreshed",
        description: "Showing today's featured prompts.",
      });
    } catch (error) {
      console.error("Failed to refresh daily picks:", error);
      setLoadingDaily(false);
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || prompt.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const myPrompts = filteredPrompts.filter(prompt => prompt.user_email === user?.email && !prompt.is_public);
  const publicPrompts = filteredPrompts.filter(prompt => prompt.is_public);
  const sharedWithMe = filteredPrompts.filter(
    prompt => prompt.user_email !== user?.email && !prompt.is_public
  );

  // Filter external prompts
  const filteredExternalPrompts = externalPrompts.filter(prompt => {
    const matchesSearch = searchQuery === "" ||
                         prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesFeed = selectedFeed === "all" || prompt.feed_id === selectedFeed;

    return matchesSearch && matchesCategory && matchesFeed;
  });

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
      console.error("Failed to like prompt:", error);
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
      console.error("Failed to create prompt:", error);
      toast({
        title: "Failed to create",
        description: "Could not create the prompt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditPrompt = async (data: { title: string; description: string; content: string; category: string; difficulty: string; is_public: boolean }) => {
    if (!user?.email || !selectedPrompt) return;

    try {
      const updatedPrompt = await promptService.updatePrompt(selectedPrompt.id, user.email, {
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        difficulty: data.difficulty as "beginner" | "intermediate" | "advanced",
        is_public: data.is_public
      });

      setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
      toast({
        title: "Prompt updated",
        description: `"${data.title}" has been updated.`,
      });
    } catch (error) {
      console.error("Failed to update prompt:", error);
      toast({
        title: "Failed to update",
        description: "Could not update the prompt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const usePrompt = (prompt: PromptTemplate | ExternalPrompt) => {
    const processedContent = prompt.content.replace(
      '{user_input}',
      'Please follow the instructions above and help the user with their request.'
    );
    const encodedPrompt = encodeURIComponent(processedContent);
    window.location.href = `/chat?prompt=${encodedPrompt}&title=${encodeURIComponent(prompt.title)}`;
  };

  const handleDeletePrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPrompt || !user?.email) return;

    try {
      await promptService.deletePrompt(selectedPrompt.id, user.email);
      setPrompts(prev => prev.filter(p => p.id !== selectedPrompt.id));
      toast({
        title: "Prompt deleted",
        description: "The prompt has been removed from your library.",
      });
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      toast({
        title: "Failed to delete",
        description: "Could not delete the prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSelectedPrompt(null);
      setDeleteDialogOpen(false);
    }
  };

  const openEditModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setEditModalOpen(true);
  };

  const openShareModal = async (prompt: PromptTemplate) => {
    if (!user?.email) return;

    setSelectedPrompt(prompt);
    setShareModalOpen(true);
    setLoadingShares(true);

    try {
      const shares = await promptService.getPromptShares(prompt.id, user.email);
      setPromptShares(shares);
    } catch (error) {
      console.error("Failed to load shares:", error);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async (email: string, canEdit: boolean) => {
    if (!user?.email || !selectedPrompt) return;

    try {
      const success = await promptService.sharePrompt(selectedPrompt.id, user.email, email, canEdit);
      if (success) {
        const shares = await promptService.getPromptShares(selectedPrompt.id, user.email);
        setPromptShares(shares);
        toast({
          title: "Prompt shared",
          description: `Shared with ${email}`,
        });
      }
    } catch (error) {
      console.error("Failed to share prompt:", error);
      toast({
        title: "Failed to share",
        description: "Could not share the prompt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnshare = async (email: string) => {
    if (!user?.email || !selectedPrompt) return;

    try {
      await promptService.unsharePrompt(selectedPrompt.id, user.email, email);
      setPromptShares(prev => prev.filter(s => s.shared_with !== email));
      toast({
        title: "Share removed",
        description: `Removed access for ${email}`,
      });
    } catch (error) {
      console.error("Failed to unshare prompt:", error);
      toast({
        title: "Failed to remove share",
        description: "Could not remove access. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportPrompt = async (externalPrompt: ExternalPrompt) => {
    if (!user?.email) return;

    try {
      const newId = await promptService.importExternalPrompt(user.email, externalPrompt.id);
      if (newId) {
        // Refresh prompts
        const data = await promptService.getPrompts(user.email);
        setPrompts(data);
        setActiveTab("my-prompts");
        toast({
          title: "Prompt imported",
          description: `"${externalPrompt.title}" added to your library.`,
        });
      }
    } catch (error) {
      console.error("Failed to import prompt:", error);
      toast({
        title: "Failed to import",
        description: "Could not import the prompt. Please try again.",
        variant: "destructive"
      });
    }
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
      <div className="border-b border-border-primary/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Library</h1>
              <p className="text-text-secondary">Discover and use proven AI prompt templates</p>
            </div>
            <Button
              className="bg-accent-blue hover:bg-accent-blue/90"
              onClick={() => setCreateModalOpen(true)}
              data-testid="button-create-prompt"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <GlassInput
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  variant="search"
                  data-testid="input-search-prompts"
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
                <Button variant="outline" size="sm" data-testid="button-filter-difficulty">
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

            {activeTab === "community" && feeds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Feed: {selectedFeed === "all" ? "All" : feeds.find(f => f.id === selectedFeed)?.name || "All"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border-primary shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setSelectedFeed("all")} className="text-card-foreground hover:bg-accent-blue/10">
                    All Feeds
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {feeds.map((feed) => (
                    <DropdownMenuItem
                      key={feed.id}
                      onClick={() => setSelectedFeed(feed.id)}
                      className="text-card-foreground hover:bg-accent-blue/10"
                    >
                      {feed.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 bg-muted/30">
              <TabsTrigger value="my-prompts" className="data-[state=active]:bg-background">
                <Lock className="h-4 w-4 mr-2" />
                My Prompts ({myPrompts.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="data-[state=active]:bg-background">
                <Globe className="h-4 w-4 mr-2" />
                Public ({publicPrompts.length})
              </TabsTrigger>
              <TabsTrigger value="community" className="data-[state=active]:bg-background">
                <Sparkles className="h-4 w-4 mr-2" />
                Community
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {loading && activeTab !== "community" && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading prompts...</h3>
              <p className="text-text-secondary">Fetching prompts from database</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "my-prompts" && !loading && (
              <motion.div
                key="my-prompts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {sharedWithMe.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent-blue" />
                      Shared With Me ({sharedWithMe.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sharedWithMe.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onCopy={copyPrompt}
                          onLike={toggleLike}
                          onUse={usePrompt}
                          onEdit={openEditModal}
                          onShare={openShareModal}
                          onDelete={handleDeletePrompt}
                          isLiked={likedPrompts.includes(prompt.id)}
                          getDifficultyColor={getDifficultyColor}
                          isOwner={false}
                          currentUserEmail={user?.email}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">
                    My Prompts ({myPrompts.length})
                  </h2>
                  {myPrompts.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">No prompts yet</h3>
                      <p className="text-text-secondary mb-4">
                        Create your first prompt to get started
                      </p>
                      <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Prompt
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onCopy={copyPrompt}
                          onLike={toggleLike}
                          onUse={usePrompt}
                          onEdit={openEditModal}
                          onShare={openShareModal}
                          onDelete={handleDeletePrompt}
                          isLiked={likedPrompts.includes(prompt.id)}
                          getDifficultyColor={getDifficultyColor}
                          isOwner={true}
                          currentUserEmail={user?.email}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === "public" && !loading && (
              <motion.div
                key="public"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent-orange" />
                    Public Prompts ({publicPrompts.length})
                  </h2>
                  {publicPrompts.length === 0 ? (
                    <div className="text-center py-12">
                      <Globe className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">No public prompts</h3>
                      <p className="text-text-secondary">
                        Be the first to share a prompt with everyone!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publicPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          featured
                          onCopy={copyPrompt}
                          onLike={toggleLike}
                          onUse={usePrompt}
                          onEdit={openEditModal}
                          onShare={openShareModal}
                          onDelete={handleDeletePrompt}
                          isLiked={likedPrompts.includes(prompt.id)}
                          getDifficultyColor={getDifficultyColor}
                          isOwner={prompt.user_email === user?.email}
                          currentUserEmail={user?.email}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === "community" && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Daily Picks Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-accent-orange/20 to-accent-red/20">
                        <Calendar className="h-5 w-5 text-accent-orange" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                          Daily Picks
                          <Star className="h-4 w-4 text-accent-orange fill-current" />
                        </h2>
                        <p className="text-sm text-text-secondary">{dailyPicksDate || "Today's featured prompts"}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshDailyPicks}
                      disabled={loadingDaily}
                      className="gap-2"
                    >
                      <RefreshCw className={cn("h-4 w-4", loadingDaily && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {loadingDaily && dailyPrompts.length === 0 ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                      </motion.div>
                    ) : dailyPrompts.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-center py-8 bg-gradient-to-br from-accent-orange/5 to-accent-red/5 rounded-xl border border-accent-orange/20"
                      >
                        <Calendar className="h-12 w-12 text-accent-orange/50 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-text-primary mb-1">No daily picks yet</h3>
                        <p className="text-text-secondary text-sm">Check back tomorrow for fresh recommendations</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`daily-${dailyPrompts.map(p => p.id).join('-')}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {dailyPrompts.map((prompt, index) => (
                          <motion.div
                            key={prompt.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.05,
                              ease: [0.25, 0.1, 0.25, 1]
                            }}
                          >
                            <DailyPickCard
                              prompt={prompt}
                              rank={index + 1}
                              onCopy={copyPrompt}
                              onUse={usePrompt}
                              onImport={handleImportPrompt}
                              getDifficultyColor={getDifficultyColor}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* All Community Prompts */}
                {loadingExternal ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">Loading community prompts...</h3>
                    <p className="text-text-secondary">Fetching curated templates</p>
                  </div>
                ) : (
                  <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      All Community Prompts ({filteredExternalPrompts.length})
                    </h2>
                    {filteredExternalPrompts.length === 0 ? (
                      <div className="text-center py-12">
                        <Sparkles className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-text-primary mb-2">No community prompts available</h3>
                        <p className="text-text-secondary">
                          Check back later for new prompts from the community
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExternalPrompts.map((prompt) => (
                          <ExternalPromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onCopy={copyPrompt}
                            onUse={usePrompt}
                            onImport={handleImportPrompt}
                            getDifficultyColor={getDifficultyColor}
                            feedName={feeds.find(f => f.id === prompt.feed_id)?.name}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreatePromptModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreatePrompt}
      />

      <EditPromptModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        prompt={selectedPrompt}
        onSubmit={handleEditPrompt}
      />

      <SharePromptModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        promptTitle={selectedPrompt?.title || ""}
        shares={promptShares}
        onShare={handleShare}
        onUnshare={handleUnshare}
        loading={loadingShares}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPrompt?.title}"? This action cannot be undone.
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

// User prompt card with edit/share/delete
function PromptCard({
  prompt,
  featured = false,
  onCopy,
  onLike,
  onUse,
  onEdit,
  onShare,
  onDelete,
  isLiked,
  getDifficultyColor,
  isOwner,
  currentUserEmail
}: {
  prompt: PromptTemplate;
  featured?: boolean;
  onCopy: (content: string, title: string) => void;
  onLike: (id: string) => void;
  onUse: (prompt: PromptTemplate) => void;
  onEdit: (prompt: PromptTemplate) => void;
  onShare: (prompt: PromptTemplate) => void;
  onDelete: (prompt: PromptTemplate) => void;
  isLiked: boolean;
  getDifficultyColor: (difficulty: string) => string;
  isOwner: boolean;
  currentUserEmail?: string;
}) {
  return (
    <GlassCard className={cn(
      "p-6 hover:border-accent-blue/30 transition-all duration-200 group",
      featured && "border-accent-orange/30 bg-accent-orange/5"
    )} data-testid={`card-prompt-${prompt.id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              {prompt.is_public ? (
                <Globe className="h-4 w-4 text-accent-orange flex-shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-text-tertiary flex-shrink-0" />
              )}
              {featured && <Star className="h-4 w-4 text-accent-orange fill-current flex-shrink-0" />}
            </div>
            <p className="text-sm text-text-secondary truncate">{prompt.user_email}</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary line-clamp-2">{prompt.description}</p>

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
              <Heart className={cn("h-3 w-3", isLiked ? "text-accent-red fill-current" : "text-text-secondary")} />
              <span className="text-text-secondary">{prompt.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-text-secondary" />
              <span className="text-text-secondary">{prompt.uses_count}</span>
            </div>
          </div>
          <span className="text-text-tertiary">{prompt.category}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onUse(prompt)}
            data-testid={`button-use-prompt-${prompt.id}`}
          >
            <Zap className="h-3 w-3 mr-1" />
            Use Prompt
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onCopy(prompt.content, prompt.title)}
            title="Copy to clipboard"
            data-testid={`button-copy-prompt-${prompt.id}`}
          >
            <Copy className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onLike(prompt.id)}
            title="Like prompt"
            data-testid={`button-like-prompt-${prompt.id}`}
          >
            <Heart className={cn("h-3 w-3", isLiked && "text-accent-red fill-current")} />
          </Button>

          {isOwner && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(prompt)}
                title="Edit prompt"
              >
                <Edit2 className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => onShare(prompt)}
                title="Share prompt"
              >
                <Share2 className="h-3 w-3" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(prompt)}
                className="text-accent-red hover:text-accent-red"
                title="Delete prompt"
                data-testid={`button-delete-prompt-${prompt.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// External/Community prompt card
function ExternalPromptCard({
  prompt,
  onCopy,
  onUse,
  onImport,
  getDifficultyColor,
  feedName
}: {
  prompt: ExternalPrompt;
  onCopy: (content: string, title: string) => void;
  onUse: (prompt: ExternalPrompt) => void;
  onImport: (prompt: ExternalPrompt) => void;
  getDifficultyColor: (difficulty: string) => string;
  feedName?: string;
}) {
  return (
    <GlassCard className="p-6 hover:border-primary/30 transition-all duration-200 group border-primary/10 bg-primary/5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            </div>
            {prompt.author && (
              <p className="text-sm text-text-secondary truncate">by {prompt.author}</p>
            )}
          </div>
        </div>

        {prompt.description && (
          <p className="text-sm text-text-secondary line-clamp-2">{prompt.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs", getDifficultyColor(prompt.difficulty))}>
            {prompt.difficulty}
          </Badge>
          {feedName && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              {feedName}
            </Badge>
          )}
          {prompt.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary">{prompt.category}</span>
        </div>

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onUse(prompt)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Use Prompt
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
            onClick={() => onImport(prompt)}
            title="Import to my library"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// Daily Pick card with special styling and rank
function DailyPickCard({
  prompt,
  rank,
  onCopy,
  onUse,
  onImport,
  getDifficultyColor
}: {
  prompt: ExternalPrompt;
  rank: number;
  onCopy: (content: string, title: string) => void;
  onUse: (prompt: ExternalPrompt) => void;
  onImport: (prompt: ExternalPrompt) => void;
  getDifficultyColor: (difficulty: string) => string;
}) {
  const rankColors = [
    "from-amber-500 to-orange-500", // #1
    "from-slate-400 to-slate-500",  // #2
    "from-amber-700 to-amber-800",  // #3
    "from-primary/60 to-primary/40", // #4+
    "from-primary/60 to-primary/40",
    "from-primary/60 to-primary/40",
  ];

  return (
    <GlassCard className="p-5 hover:border-accent-orange/40 transition-all duration-200 group border-accent-orange/20 bg-gradient-to-br from-accent-orange/5 to-transparent relative overflow-hidden">
        {/* Rank badge */}
        <div className={cn(
          "absolute -top-1 -left-1 w-8 h-8 rounded-br-xl flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br shadow-lg",
          rankColors[rank - 1] || rankColors[3]
        )}>
          {rank}
        </div>

        <div className="space-y-3 pl-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors line-clamp-1">
                {prompt.title}
              </h3>
              {prompt.author && (
                <p className="text-xs text-text-secondary truncate mt-0.5">by {prompt.author}</p>
              )}
            </div>
            <Star className="h-4 w-4 text-accent-orange fill-current flex-shrink-0" />
          </div>

          {prompt.description && (
            <p className="text-sm text-text-secondary line-clamp-2">{prompt.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge className={cn("text-xs", getDifficultyColor(prompt.difficulty))}>
              {prompt.difficulty}
            </Badge>
            {prompt.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 bg-accent-orange hover:bg-accent-orange/90"
              onClick={() => onUse(prompt)}
            >
              <Zap className="h-3 w-3 mr-1" />
              Use
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCopy(prompt.content, prompt.title)}
              title="Copy to clipboard"
            >
              <Copy className="h-3 w-3" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onImport(prompt)}
              title="Import to my library"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </GlassCard>
  );
}
