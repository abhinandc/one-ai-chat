import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Search, ExternalLink, Settings, Database, Brain, Variable } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgents } from "@/hooks/useAgents";
import { useModels } from "@/hooks/useModels";
import type { Conversation, Citation } from "@/types";

interface InspectorProps {
  conversation?: Conversation;
  citations?: Citation[];
  onUpdateSettings?: (settings: any) => void;
}

export function Inspector({ conversation, citations = [], onUpdateSettings }: InspectorProps) {
  const [activeTab, setActiveTab] = useState("context");
  const [searchQuery, setSearchQuery] = useState("");
  const [contextData, setContextData] = useState<any[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  
  const { agents, loading: agentsLoading } = useAgents({ env: 'prod' });
  const { models, loading: modelsLoading } = useModels();

  // Real database context retrieval
  useEffect(() => {
    if (conversation && conversation.messages.length > 0) {
      // TODO: Replace with real database context retrieval API calls
      // For now, extract real variables from conversation only
      const extractedVars = {
        user_name: 'User',
        conversation_id: conversation.id,
        message_count: conversation.messages.length,
        current_model: conversation.settings.model,
        temperature: conversation.settings.temperature,
        last_message_time: conversation.updatedAt.toISOString(),
      };
      setVariables(extractedVars);
      
      // Clear context data until real API is implemented
      setContextData([]);
    }
  }, [conversation]);

  const filteredCitations = citations.filter(citation =>
    citation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    citation.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full bg-surface-graphite/30 border-l border-border-primary/50 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border-secondary/50">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-surface-graphite/30">
            <TabsTrigger value="context" className="text-sm h-12 data-[state=active]:bg-accent-blue/15 data-[state=active]:text-accent-blue">Context</TabsTrigger>
            <TabsTrigger value="variables" className="text-sm h-12 data-[state=active]:bg-accent-blue/15 data-[state=active]:text-accent-blue">Variables</TabsTrigger>
            <TabsTrigger value="settings" className="text-sm h-12 data-[state=active]:bg-accent-blue/15 data-[state=active]:text-accent-blue">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="context" className="px-4 py-3 space-y-4 m-0">
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

            {/* Database Retrieved Context */}
            <div className="space-y-md">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-medium text-text-primary">Retrieved Context</h3>
                <span className="text-xs text-text-tertiary">({contextData.length + filteredCitations.length})</span>
              </div>

              {/* Real-time context from database */}
              {contextData.length > 0 && (
                <div className="space-y-sm">
                  <h4 className="text-xs font-medium text-accent-blue">Database Context</h4>
                  {contextData.map((context) => (
                    <ContextCard key={context.id} context={context} />
                  ))}
                </div>
              )}

              {/* Citations from RAG/Vector search */}
              {filteredCitations.length > 0 && (
                <div className="space-y-sm">
                  <h4 className="text-xs font-medium text-accent-green">Vector Search Results</h4>
                  {filteredCitations.map((citation) => (
                    <CitationCard key={citation.id} citation={citation} />
                  ))}
                </div>
              )}

              {contextData.length === 0 && filteredCitations.length === 0 && (
                <div className="text-center py-lg">
                  <Database className="h-8 w-8 text-text-quaternary mx-auto mb-md" />
                  <p className="text-sm text-text-tertiary">No context retrieved yet</p>
                  <p className="text-xs text-text-quaternary mt-1">Start a conversation to see relevant context</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="variables" className="px-4 py-3 space-y-4 m-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-medium text-text-primary">Session Variables</h3>
              </div>

              {/* Real conversation variables */}
              <div className="space-y-md">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text-primary mb-sm">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <GlassInput
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      onChange={(e) => {
                        setVariables(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }));
                      }}
                      variant="minimal"
                      className="text-xs"
                    />
                  </div>
                ))}

                {/* Agent Context Variables */}
                {agents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-sm">
                      Available Agents
                    </label>
                    <div className="space-y-xs">
                      {agents.slice(0, 3).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-sm bg-surface-graphite/50 rounded">
                          <span className="text-xs text-text-primary">{agent.name}</span>
                          <span className="text-xs text-text-tertiary">{agent.version}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Variables */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-sm">
                    Custom Context
                  </label>
                  <textarea
                    placeholder="Add custom variables or context..."
                    value={variables.custom_context || ''}
                    onChange={(e) => {
                      setVariables(prev => ({
                        ...prev,
                        custom_context: e.target.value
                      }));
                    }}
                    className="w-full h-20 px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="px-4 py-3 space-y-4 m-0">
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

function ContextCard({ context }: { context: any }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'conversation': return '💬';
      case 'memory': return '🧠';
      case 'database': return '🗄️';
      default: return '📋';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-accent-blue';
      case 'conversation': return 'text-accent-green';
      case 'memory': return 'text-accent-orange';
      case 'database': return 'text-accent-purple';
      default: return 'text-text-secondary';
    }
  };

  return (
    <GlassCard className="p-md hover:border-accent-blue/30 hover:bg-surface-graphite/40 transition-colors">
      <div className="space-y-sm">
        <div className="flex items-start justify-between gap-sm">
          <div className="flex items-center gap-xs">
            <span className="text-sm">{getTypeIcon(context.type)}</span>
            <h4 className="text-sm font-medium text-text-primary line-clamp-2">
              {context.title}
            </h4>
          </div>
          <div className="flex items-center gap-xs">
            <span className="text-xs text-text-tertiary">
              {Math.round(context.relevance * 100)}%
            </span>
            <span className={cn("text-xs font-medium", getTypeColor(context.type))}>
              {context.type}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-text-secondary line-clamp-3">
          {context.snippet}
        </p>
        
        <div className="text-xs text-text-quaternary">
          Source: {context.source}
        </div>
      </div>
    </GlassCard>
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => window.open(citation.url, '_blank')}
              >
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
  const { models, loading: modelsLoading } = useModels();

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
          Model {modelsLoading && <span className="text-xs text-text-tertiary">(Loading...)</span>}
        </label>
        <select
          value={settings.model}
          onChange={(e) => handleUpdate("model", e.target.value)}
          className="w-full px-md py-sm bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
          disabled={modelsLoading}
        >
          {modelsLoading ? (
            <option value="">Loading models...</option>
          ) : models.length > 0 ? (
            models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id} ({model.owned_by})
              </option>
            ))
          ) : (
            <option value="">No models available</option>
          )}
        </select>
        {models.length === 0 && !modelsLoading && (
          <p className="text-xs text-text-tertiary mt-1">
            No models found. Check your Models Settings or API connection.
          </p>
        )}
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
          {["web_search", "calculator", "code_interpreter", "file_reader", "sql_query", "vector_search"].map((tool) => (
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
