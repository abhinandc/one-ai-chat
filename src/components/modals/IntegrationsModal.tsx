import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Globe, Mail, MessageSquare, Database, Calendar, FileText } from "lucide-react";
import { useState } from "react";

interface IntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTEGRATIONS = [
  { id: "gsuite", name: "Google Workspace", icon: Mail, connected: true, category: "Productivity" },
  { id: "slack", name: "Slack", icon: MessageSquare, connected: true, category: "Communication" },
  { id: "jira", name: "Jira Software", icon: Globe, connected: false, category: "Project Mgmt" },
  { id: "notion", name: "Notion", icon: FileText, connected: false, category: "Productivity" },
  { id: "supabase", name: "Supabase", icon: Database, connected: true, category: "Database" },
  { id: "stripe", name: "Stripe", icon: Globe, connected: false, category: "Finance" },
  { id: "openai", name: "OpenAI", icon: Globe, connected: true, category: "AI Model" },
  { id: "anthropic", name: "Anthropic", icon: Globe, connected: false, category: "AI Model" },
];

export function IntegrationsModal({ open, onOpenChange }: IntegrationsModalProps) {
  const [search, setSearch] = useState("");

  const filtered = INTEGRATIONS.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle>Integrations</DialogTitle>
          <DialogDescription>
            Connect your favorite tools to power your automations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="Search tools..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/50 border-input"
            />
        </div>

        <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-3">
                {filtered.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                        <div 
                            key={tool.id} 
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-background border border-border">
                                    <ToolIcon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">{tool.name}</h4>
                                    <p className="text-xs text-muted-foreground">{tool.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {tool.connected && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                        Connected
                                    </Badge>
                                )}
                                <Button 
                                    variant={tool.connected ? "outline" : "default"}
                                    size="sm"
                                    className={tool.connected ? "text-muted-foreground hover:text-foreground" : "bg-primary text-primary-foreground"}
                                >
                                    {tool.connected ? "Configure" : "Connect"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
