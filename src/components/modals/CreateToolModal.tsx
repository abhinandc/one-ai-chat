import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    category: string;
  }) => void;
}

export function CreateToolModal({ open, onOpenChange, onSubmit }: CreateToolModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Integration");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onSubmit({ name, description, category });
      setName("");
      setDescription("");
      setCategory("Integration");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Submit New Tool</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Add a new tool to your OneAI toolkit
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name" className="text-text-primary">
                Tool Name
              </Label>
              <GlassInput
                id="tool-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., HTTP Client"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-text-primary">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-surface-graphite border-border-primary text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border-primary">
                  <SelectItem value="Integration">Integration</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-text-primary">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this tool does and how it helps..."
                className="min-h-[100px] bg-surface-graphite border-border-primary text-text-primary"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent-blue hover:bg-accent-blue/90">
              Submit Tool
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
