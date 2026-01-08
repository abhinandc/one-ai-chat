import { useState, useEffect } from "react";
import { Search, Filter, Star, Copy, BookOpen, Heart, Plus, Trash2, Zap } from "lucide-react";
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
import { promptService, PromptTemplate } from "@/services/promptService";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CreatePromptModal } from "@/components/modals/CreatePromptModal";
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

const categories = ["All", "research", "product", "executive", "vip", "General"];

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [likedPrompts, setLikedPrompts] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const user = useCurrentUser();

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

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || prompt.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const featuredPrompts = filteredPrompts.filter(prompt => prompt.is_public);
  const otherPrompts = filteredPrompts.filter(prompt => !prompt.is_public);

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

  const usePrompt = (prompt: PromptTemplate) => {
    const processedContent = prompt.content.replace(
      '{user_input}', 
      'Please follow the instructions above and help the user with their request.'
    );
    const encodedPrompt = encodeURIComponent(processedContent);
    window.location.href = `/chat?prompt=${encodedPrompt}&title=${encodeURIComponent(prompt.title)}`;
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
      console.error("Failed to delete prompt:", error);
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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {loading && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-text-quaternary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Loading prompts...</h3>
              <p className="text-text-secondary">Fetching prompts from database</p>
            </div>
          )}

          {!loading && featuredPrompts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-accent-orange" />
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
                    onUse={usePrompt}
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
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                My Prompts ({otherPrompts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPrompts.map((prompt) => (
                  <PromptCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    onCopy={copyPrompt}
                    onLike={toggleLike}
                    onUse={usePrompt}
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
              <BookOpen className="h-16 w-16 text-text-quaternary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No prompts found</h3>
              <p className="text-text-secondary">
                {prompts.length === 0 
                  ? "Create your first prompt to get started"
                  : "Try adjusting your search or filters"
                }
              </p>
              {prompts.length === 0 && (
                <Button 
                  className="mt-4"
                  onClick={() => setCreateModalOpen(true)}
                  data-testid="button-create-first-prompt"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Prompt
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

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
}: { 
  prompt: PromptTemplate; 
  featured?: boolean;
  onCopy: (content: string, title: string) => void;
  onLike: (id: string) => void;
  onUse: (prompt: PromptTemplate) => void;
  onDelete: (id: string) => void;
  isLiked: boolean;
  getDifficultyColor: (difficulty: string) => string;
  isOwner: boolean;
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
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onDelete(prompt.id)}
              className="text-accent-red hover:text-accent-red"
              title="Delete prompt"
              data-testid={`button-delete-prompt-${prompt.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
