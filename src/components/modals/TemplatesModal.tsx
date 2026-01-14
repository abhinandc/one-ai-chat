import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Mail, 
  MessageSquare, 
  Zap, 
  Clock, 
  FileText,
  Webhook,
  Bot
} from "lucide-react";
import { useState } from "react";

interface TemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (templateId: string) => void;
}

const TEMPLATES = [
  {
    id: "scratch",
    title: "Start from Scratch",
    description: "Build an automation with a blank canvas.",
    icon: Plus,
    color: "bg-zinc-500/10 text-zinc-100",
    tags: []
  },
  {
    id: "email-summary",
    title: "Email Summarizer",
    description: "When a new email arrives, summarize it with AI and slack it.",
    icon: Mail,
    color: "bg-blue-500/10 text-blue-400",
    tags: ["AI", "Productivity"]
  },
  {
    id: "lead-notify",
    title: "New Lead Notification",
    description: "Post to Slack when a form is submitted via Webhook.",
    icon: Webhook,
    color: "bg-purple-500/10 text-purple-400",
    tags: ["Sales", "Slack"]
  },
  {
    id: "support-triage",
    title: "Support Triage",
    description: "Classify incoming tickets and assign to the right agent.",
    icon: Bot,
    color: "bg-green-500/10 text-green-400",
    tags: ["Support", "AI"]
  },
  {
    id: "daily-report",
    title: "Daily Standup Report",
    description: "Collect status from linear/jira and email the team.",
    icon: Clock,
    color: "bg-orange-500/10 text-orange-400",
    tags: ["Reporting"]
  }
];

export function TemplatesModal({ open, onOpenChange, onSelect }: TemplatesModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0 bg-[#0a0a0a] border-white/10 text-foreground overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border bg-card/50">
          <DialogTitle className="text-xl">Create Automation</DialogTitle>
          <DialogDescription>
            Choose a template or start from scratch.
          </DialogDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 bg-background border-input"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-background/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((t) => (
              <div 
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  "relative group flex flex-col p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                  selected === t.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                )}
              >
                 <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2.5 rounded-lg", t.color)}>
                       <t.icon className="h-5 w-5" />
                    </div>
                    {selected === t.id && (
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    )}
                 </div>
                 
                 <h3 className="font-medium text-foreground mb-1">{t.title}</h3>
                 <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                    {t.description}
                 </p>
                 
                 {t.tags.length > 0 && (
                   <div className="flex gap-1.5 mt-4">
                      {t.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-muted text-muted-foreground">
                            {tag}
                        </Badge>
                      ))}
                   </div>
                 )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-border bg-card/50">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
            </Button>
            <Button 
                onClick={() => selected && onSelect(selected)}
                disabled={!selected}
                className="min-w-[120px]"
            >
                Create
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
