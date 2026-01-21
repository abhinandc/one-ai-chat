import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PromptTemplate } from "@/services/promptService";

interface EditPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptTemplate | null;
  onSubmit: (data: {
    title: string;
    description: string;
    content: string;
    category: string;
    difficulty: string;
    is_public: boolean;
  }) => void;
}

export function EditPromptModal({ open, onOpenChange, prompt, onSubmit }: EditPromptModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description);
      setContent(prompt.content);
      setCategory(prompt.category);
      setDifficulty(prompt.difficulty);
      setIsPublic(prompt.is_public);
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({ title, description, content, category, difficulty, is_public: isPublic });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card border-border-primary max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Edit Prompt Template</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Update your prompt template details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-text-primary">
                Prompt Title
              </Label>
              <GlassInput
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Code Review Assistant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-text-primary">
                Description
              </Label>
              <GlassInput
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this prompt does"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-text-primary">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-surface-graphite border-border-primary text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border-primary">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Content">Content</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-difficulty" className="text-text-primary">
                  Difficulty
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-surface-graphite border-border-primary text-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border-primary">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-text-primary">
                Prompt Content
              </Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your prompt template here... Use {variable_name} for variables."
                className="min-h-[200px] bg-surface-graphite border-border-primary text-text-primary font-mono text-sm"
                required
              />
              <p className="text-xs text-text-tertiary">
                Tip: Use {"{variable_name}"} syntax for dynamic variables
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border-primary">
              <div>
                <Label htmlFor="edit-public" className="text-text-primary font-medium">
                  Make Public
                </Label>
                <p className="text-xs text-text-secondary mt-0.5">
                  Public prompts are visible to all employees
                </p>
              </div>
              <Switch
                id="edit-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent-blue hover:bg-accent-blue/90">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
