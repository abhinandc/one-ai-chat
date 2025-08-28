import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Search, ExternalLink, Settings, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, Citation } from "@/types";

interface InspectorProps {
  conversation?: Conversation;
  citations?: Citation[];
  onUpdateSettings?: (settings: any) => void;
}

export function Inspector({ conversation, citations = [], onUpdateSettings }: InspectorProps) {
  const [activeTab, setActiveTab] = useState("context");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCitations = citations.filter(citation =>
    citation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    citation.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full bg-surface-graphite/30 border-l border-border-primary/50 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-lg border-b border-border-secondary/50">
          <h2 className="text-lg font-semibold text-text-primary mb-lg">Inspector</h2>
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="context" className="text-xs h-8 flex items-center justify-center">Context</TabsTrigger>
            <TabsTrigger value="variables" className="text-xs h-8 flex items-center justify-center">Variables</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-8 flex items-center justify-center">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="context" className="p-lg space-y-lg m-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <GlassInput
                placeholder="Search context..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                variant="search"
              />
            </div>

            {/* Citations */}
            <div className="space-y-md">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-medium text-text-primary">Retrieved Context</h3>
                <span className="text-xs text-text-tertiary">({filteredCitations.length})</span>
              </div>

              {filteredCitations.length > 0 ? (
                <div className="space-y-sm">
                  {filteredCitations.map((citation) => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-lg">
                  <Database className="h-8 w-8 text-text-quaternary mx-auto mb-md" />
                  <p className="text-sm text-text-tertiary">No context retrieved yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variables" className="p-lg space-y-lg m-0">
            <div className="space-y-md">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-medium text-text-primary">Prompt Variables</h3>
              </div>

              {/* Example variables */}
              <div className="space-y-md">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-sm">
                    User Name
                  </label>
                  <GlassInput
                    placeholder="Enter user name..."
                    variant="minimal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-sm">
                    Company
                  </label>
                  <GlassInput
                    placeholder="Enter company name..."
                    variant="minimal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-sm">
                    Context
                  </label>
                  <textarea
                    placeholder="Additional context..."
                    className="w-full h-20 px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-lg space-y-lg m-0">
            {conversation && (
              <ConversationSettings 
                conversation={conversation} 
                onUpdate={onUpdateSettings}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <GlassCard className="p-md hover:border-accent-blue/30 hover:bg-surface-graphite/40 transition-colors">
      <div className="space-y-sm">
        <div className="flex items-start justify-between gap-sm">
          <h4 className="text-sm font-medium text-text-primary line-clamp-2">
            {citation.title}
          </h4>
          <div className="flex items-center gap-xs">
            <span className="text-xs text-text-tertiary">
              {Math.round(citation.relevance * 100)}%
            </span>
            {citation.url && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-text-secondary line-clamp-3">
          {citation.snippet}
        </p>
        
        <div className="text-xs text-text-quaternary">
          Source: {citation.source}
        </div>
      </div>
    </GlassCard>
  );
}

function ConversationSettings({ conversation, onUpdate }: { 
  conversation: Conversation; 
  onUpdate?: (settings: any) => void;
}) {
  const [settings, setSettings] = useState(conversation.settings);

  const handleUpdate = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdate?.(newSettings);
  };

  return (
    <div className="space-y-lg">
      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Model
        </label>
        <select
          value={settings.model}
          onChange={(e) => handleUpdate("model", e.target.value)}
          className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3">Claude 3</option>
          <option value="llama-2">Llama 2</option>
        </select>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Provider
        </label>
        <select
          value={settings.provider}
          onChange={(e) => handleUpdate("provider", e.target.value as "litellm" | "openwebui")}
          className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
        >
          <option value="litellm">LiteLLM</option>
          <option value="openwebui">OpenWebUI</option>
        </select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Temperature: {settings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => handleUpdate("temperature", parseFloat(e.target.value))}
          className="w-full h-2 bg-surface-graphite rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Top P */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Top P: {settings.topP}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.topP}
          onChange={(e) => handleUpdate("topP", parseFloat(e.target.value))}
          className="w-full h-2 bg-surface-graphite rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Max Tokens
        </label>
        <input
          type="number"
          value={settings.maxTokens}
          onChange={(e) => handleUpdate("maxTokens", parseInt(e.target.value))}
          className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
          min="1"
          max="4096"
        />
      </div>

      {/* Tools */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-sm">
          Enabled Tools
        </label>
        <div className="space-y-sm">
          {["web_search", "calculator", "code_interpreter"].map((tool) => (
            <label key={tool} className="flex items-center gap-sm">
              <input
                type="checkbox"
                checked={settings.tools?.includes(tool) || false}
                onChange={(e) => {
                  const tools = settings.tools || [];
                  if (e.target.checked) {
                    handleUpdate("tools", [...tools, tool]);
                  } else {
                    handleUpdate("tools", tools.filter(t => t !== tool));
                  }
                }}
                className="rounded border-border-primary"
              />
              <span className="text-sm text-text-primary capitalize">
                {tool.replace("_", " ")}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}