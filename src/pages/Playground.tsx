import { useEffect, useMemo, useState, useCallback } from "react";
import { Play, Save, Share, Settings, Copy, Download, RefreshCw, Zap, Loader2, Star, Trash2, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useModels } from "@/hooks/useModels";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiClient } from "@/services/api";
import { playgroundService, PlaygroundSession as DBSession } from "@/services/playgroundService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PlaygroundSession {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  prompt: string;
  response: string;
  timestamp: Date;
  isFavorite?: boolean;
  tokensUsed?: number;
  responseTimeMs?: number;
}

interface StoredSession {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  prompt: string;
  response: string;
  timestamp: string;
  isFavorite?: boolean;
}

interface StoredState {
  selectedModel: string | null;
  temperature: number;
  maxTokens: number;
  topP: number;
  streamingEnabled: boolean;
  prompt: string;
  response: string;
  sessions: StoredSession[];
}

// Convert DB session to local format
const dbToLocal = (dbSession: DBSession): PlaygroundSession => ({
  id: dbSession.id,
  name: dbSession.name,
  model: dbSession.model,
  temperature: dbSession.temperature,
  maxTokens: dbSession.max_tokens,
  topP: dbSession.top_p,
  prompt: dbSession.prompt,
  response: dbSession.response || "",
  timestamp: new Date(dbSession.created_at),
  isFavorite: dbSession.is_favorite,
  tokensUsed: dbSession.tokens_used,
  responseTimeMs: dbSession.response_time_ms
});

const STORAGE_PREFIX = "oneai.playground.";

const promptExamples = [
  {
    title: "Creative Writing",
    prompt:
      "Write a short story about a time traveler who discovers they can only travel to mundane moments in history.",
  },
  {
    title: "Code Generation",
    prompt:
      "Create a Python function that finds the longest palindromic substring in a given string. Include error handling and documentation.",
  },
  {
    title: "Data Analysis",
    prompt:
      "Analyze this sales data and provide insights on trends, patterns, and recommendations for improving performance.",
  },
  {
    title: "Brainstorming",
    prompt:
      "Generate 10 creative marketing campaign ideas for a sustainable fashion brand targeting Gen Z consumers.",
  },
  {
    title: "System Prompt",
    prompt:
      "You are a helpful AI assistant. Please respond to user queries with accurate, helpful, and concise information.",
  },
  {
    title: "Chain of Thought",
    prompt:
      "Solve this step by step: If a train travels 120 miles in 2 hours, and then 180 miles in 3 hours, what is the average speed for the entire journey?",
  },
];

export default function Playground() {
  const user = useCurrentUser();
  const storageKey = useMemo(
    () => (user?.email ? `${STORAGE_PREFIX}${user.email}` : null),
    [user?.email],
  );

  const [selectedModel, setSelectedModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<PlaygroundSession[]>([]);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loadingFromSupabase, setLoadingFromSupabase] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const { toast } = useToast();

  const { models, loading: modelsLoading } = useModels(user?.email);

  // Load sessions from Supabase
  const loadSupabaseSessions = useCallback(async () => {
    if (!user?.email) return;

    setLoadingFromSupabase(true);
    try {
      const dbSessions = await playgroundService.getSessions(user.email, {
        limit: 20,
        favoritesOnly: showFavoritesOnly
      });

      if (dbSessions.length > 0) {
        setSessions(dbSessions.map(dbToLocal));
      }
    } catch (error) {
      console.error("Failed to load sessions from Supabase:", error);
    } finally {
      setLoadingFromSupabase(false);
    }
  }, [user?.email, showFavoritesOnly]);

  // Save session to Supabase
  const saveToSupabase = useCallback(async (session: PlaygroundSession): Promise<string | null> => {
    if (!user?.email || !autoSave) return null;

    try {
      const sessionId = await playgroundService.saveSession(user.email, {
        name: session.name,
        model: session.model,
        temperature: session.temperature,
        maxTokens: session.maxTokens,
        topP: session.topP,
        prompt: session.prompt,
        response: session.response,
        streamingEnabled,
        tokensUsed: session.tokensUsed,
        responseTimeMs: session.responseTimeMs
      });
      return sessionId;
    } catch (error) {
      console.error("Failed to save session to Supabase:", error);
      return null;
    }
  }, [user?.email, autoSave, streamingEnabled]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (sessionId: string) => {
    if (!user?.email) return;

    const newStatus = await playgroundService.toggleFavorite(user.email, sessionId);
    if (newStatus !== null) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, isFavorite: newStatus } : s
      ));
      toast({
        title: newStatus ? "Added to favorites" : "Removed from favorites",
        description: newStatus ? "Session saved to favorites" : "Session removed from favorites"
      });
    }
  }, [user?.email, toast]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.email) return;

    const success = await playgroundService.deleteSession(user.email, sessionId);
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Session deleted",
        description: "The session has been removed"
      });
    }
  }, [user?.email, toast]);

  useEffect(() => {
    setSelectedModel("");
    setTemperature(0.7);
    setMaxTokens(2048);
    setTopP(0.9);
    setPrompt("");
    setResponse("");
    setSessions([]);
    setStreamingEnabled(true);

    if (!storageKey) {
      setHydrated(true);
      return;
    }

    // First try to load from localStorage for quick hydration
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredState>;

        if (typeof parsed.selectedModel === "string") {
          setSelectedModel(parsed.selectedModel);
        }
        if (typeof parsed.temperature === "number") {
          setTemperature(parsed.temperature);
        }
        if (typeof parsed.maxTokens === "number") {
          setMaxTokens(parsed.maxTokens);
        }
        if (typeof parsed.topP === "number") {
          setTopP(parsed.topP);
        }
        if (typeof parsed.prompt === "string") {
          setPrompt(parsed.prompt);
        }
        if (typeof parsed.response === "string") {
          setResponse(parsed.response);
        }
        if (typeof parsed.streamingEnabled === "boolean") {
          setStreamingEnabled(parsed.streamingEnabled);
        }
        if (Array.isArray(parsed.sessions)) {
          const restored = parsed.sessions
            .map((entry) => {
              if (!entry) {
                return null;
              }
              const timestamp = new Date(entry.timestamp);
              if (Number.isNaN(timestamp.getTime())) {
                return null;
              }
              return {
                id: entry.id,
                name: entry.name,
                model: entry.model,
                temperature: entry.temperature,
                maxTokens: entry.maxTokens,
                topP: entry.topP,
                prompt: entry.prompt,
                response: entry.response,
                timestamp,
                isFavorite: entry.isFavorite
              } as PlaygroundSession;
            })
            .filter((item): item is PlaygroundSession => Boolean(item))
            .slice(0, 10);
          setSessions(restored);
        }
      }
    } catch (error) {
      console.warn("Failed to hydrate playground sessions:", error);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Load sessions from Supabase after hydration
  useEffect(() => {
    if (hydrated && user?.email) {
      loadSupabaseSessions();
    }
  }, [hydrated, user?.email, loadSupabaseSessions]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get("data");

    if (sharedData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sharedData));
        if (parsed.model) {
          setSelectedModel(parsed.model);
        }
        setTemperature(typeof parsed.temperature === "number" ? parsed.temperature : 0.7);
        setMaxTokens(typeof parsed.maxTokens === "number" ? parsed.maxTokens : 2048);
        setTopP(typeof parsed.topP === "number" ? parsed.topP : 0.9);
        setPrompt(typeof parsed.prompt === "string" ? parsed.prompt : "");
        setResponse(typeof parsed.response === "string" ? parsed.response : "");

        toast({
          title: "Shared Session Loaded!",
          description: "Session parameters have been loaded from the share link.",
        });
      } catch (error) {
        console.error("Failed to load shared session:", error);
      }
    }
  }, [hydrated, toast]);

  useEffect(() => {
    if (!hydrated || models.length === 0) {
      return;
    }

    setSelectedModel((prev) => {
      if (prev && models.some((model) => model.id === prev)) {
        return prev;
      }
      return models[0].id;
    });
  }, [hydrated, models]);

  useEffect(() => {
    if (!storageKey || !hydrated) {
      return;
    }

    try {
      const payload: StoredState = {
        selectedModel: selectedModel || null,
        temperature,
        maxTokens,
        topP,
        streamingEnabled,
        prompt,
        response,
        sessions: sessions.map((session) => ({
          id: session.id,
          name: session.name,
          model: session.model,
          temperature: session.temperature,
          maxTokens: session.maxTokens,
          topP: session.topP,
          prompt: session.prompt,
          response: session.response,
          timestamp: session.timestamp.toISOString(),
        })),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist playground sessions:", error);
    }
  }, [
    storageKey,
    hydrated,
    selectedModel,
    temperature,
    maxTokens,
    topP,
    streamingEnabled,
    prompt,
    response,
    sessions,
  ]);

  const generateResponse = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first.",
        variant: "destructive",
      });
      return;
    }

    const currentModel = selectedModel || (models.length > 0 ? models[0].id : "");

    if (!currentModel) {
      toast({
        title: modelsLoading ? "Models are still loading" : "No models available",
        description: modelsLoading
          ? "Models are still loading from the admin proxy. Please try again in a moment."
          : "No models are assigned to this account yet. Paste a virtual key from OneEdge Admin and refresh.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      setSelectedModel(currentModel);
    }

    setIsGenerating(true);
    setResponse("");
    const startTime = Date.now();

    try {
      const requestData = {
        model: currentModel,
        messages: [
          {
            role: "user" as const,
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: streamingEnabled,
      };

      let finalResponse = "";

      if (streamingEnabled) {
        const stream = await apiClient.createChatCompletionStream(requestData);
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) {
                continue;
              }

              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  finalResponse += content;
                  setResponse(finalResponse);
                }
              } catch {
                // Ignore malformed SSE chunks
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        const result = await apiClient.createChatCompletion({
          ...requestData,
          stream: false,
        });
        finalResponse = result.choices[0]?.message?.content || "No response generated.";
        setResponse(finalResponse);
      }

      const persistedResponse = finalResponse || response;
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      const newSession: PlaygroundSession = {
        id: Date.now().toString(),
        name: `Session ${sessions.length + 1}`,
        model: currentModel,
        temperature,
        maxTokens,
        topP,
        prompt,
        response: persistedResponse,
        timestamp: new Date(),
        isFavorite: false,
        responseTimeMs
      };

      // Save to Supabase
      const supabaseId = await saveToSupabase(newSession);
      if (supabaseId) {
        newSession.id = supabaseId;
      }

      setSessions((prev) => {
        const next = [newSession, ...prev];
        return next.slice(0, 20);
      });

      toast({
        title: "Response Generated!",
        description: `Generated using ${currentModel} in ${(responseTimeMs / 1000).toFixed(1)}s`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = (example: (typeof promptExamples)[number]) => {
    setPrompt(example.prompt);
    setResponse("");
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const exportSession = () => {
    const model = selectedModel || (models.length > 0 ? models[0].id : "");
    const sessionData = {
      model,
      parameters: { temperature, maxTokens, topP },
      prompt,
      response,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Session data exported successfully.",
    });
  };

  const clearSession = () => {
    setPrompt("");
    setResponse("");
    toast({
      title: "Session Cleared",
      description: "Prompt and response have been cleared.",
    });
  };

  const shareSession = () => {
    const model = selectedModel || (models.length > 0 ? models[0].id : "");
    const shareData = {
      model,
      temperature,
      maxTokens,
      topP,
      prompt,
      response,
    };

    const shareOrigin = (() => {
      if (typeof window === "undefined") {
        return "https://edge.oneorigin.us";
      }
      const { origin, hostname } = window.location;
      if (
        hostname === "edge.oneorigin.us" ||
        hostname.endsWith(".edge.oneorigin.us") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1"
      ) {
        return origin;
      }
      return "https://edge.oneorigin.us";
    })();

    const shareUrl = `${shareOrigin}/playground?data=${encodeURIComponent(
      JSON.stringify(shareData),
    )}`;

    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share Link Copied!",
      description: "Share URL has been copied to clipboard.",
    });
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">AI Playground</h1>
              <p className="text-text-secondary">Experiment with AI models and fine-tune parameters</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSession}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={exportSession}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={shareSession}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-full mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[80vh] items-stretch justify-center">
            {/* Settings Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6 h-full">
                <div className="space-y-6 h-full overflow-y-auto">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Model Settings</h3>

                    {/* Model Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Model</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {models.find((m) => m.id === selectedModel)?.id || selectedModel || "Select a model"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full bg-card border-border-primary shadow-lg z-50">
                          {modelsLoading ? (
                            <DropdownMenuItem disabled className="text-card-foreground">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading models...
                            </DropdownMenuItem>
                          ) : models.length > 0 ? (
                            models.map((model) => (
                              <DropdownMenuItem
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className="text-card-foreground hover:bg-accent-blue/10"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{model.id}</span>
                                  <span className="text-xs text-text-tertiary">
                                    {model.object === "model" ? "Available" : "Local Model"}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled className="text-card-foreground">
                              No models available. Paste a virtual key on the Models page.
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">Temperature</label>
                      <span className="text-xs text-text-tertiary">{temperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-accent-blue"
                    />
                    <p className="text-xs text-text-secondary">
                      Controls randomness. Lower values make output more deterministic.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">Max Tokens</label>
                      <span className="text-xs text-text-tertiary">{maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="64"
                      max="4096"
                      step="32"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                      className="w-full accent-accent-blue"
                    />
                    <p className="text-xs text-text-secondary">
                      Limits the length of the response. Keep within model context window.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">Top P</label>
                      <span className="text-xs text-text-tertiary">{topP.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full accent-accent-blue"
                    />
                    <p className="text-xs text-text-secondary">
                      Nucleus sampling threshold. Lower values produce more focused outputs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">Streaming</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStreamingEnabled((prev) => !prev)}
                        className={streamingEnabled ? "border-accent-blue text-accent-blue" : ""}
                      >
                        {streamingEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Enable streaming to see responses as they generate. Disable for single payload responses.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">Auto-Save to Cloud</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoSave((prev) => !prev)}
                        className={autoSave ? "border-accent-green text-accent-green" : ""}
                      >
                        {autoSave ? "On" : "Off"}
                      </Button>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Automatically save sessions to Supabase for access across devices.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-text-primary">Prompt Templates</h4>
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => loadExample(promptExamples[0])}>
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Start
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {promptExamples.map((example) => (
                        <div
                          key={example.title}
                          className="p-3 border border-border-primary rounded-lg hover:border-accent-blue/40 transition-colors cursor-pointer"
                          onClick={() => loadExample(example)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-text-primary">{example.title}</span>
                            <Button variant="ghost" size="icon">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2">{example.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Playground Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="p-0 h-full">
                <Tabs defaultValue="playground" className="flex flex-col h-full">
                  <div className="border-b border-border-primary/50 p-4 flex-shrink-0">
                    <TabsList className="grid grid-cols-2 gap-2 bg-surface-graphite/40">
                      <TabsTrigger value="playground" className="text-sm">
                        Playground
                      </TabsTrigger>
                      <TabsTrigger value="history" className="text-sm">
                        Sessions
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="playground" className="flex-1 m-6 mt-4 overflow-y-auto">
                    {/* Prompt Input */}
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-text-primary">Prompt</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(prompt, "Prompt")}
                          disabled={!prompt}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        className="w-full flex-1 px-4 py-4 bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      />
                      <Button
                        onClick={generateResponse}
                        disabled={isGenerating || !prompt.trim() || !hydrated}
                        className="w-full flex-shrink-0"
                      >
                        {isGenerating ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        {isGenerating ? "Generating..." : "Generate Response"}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 m-6 mt-4 overflow-y-auto">
                    <div className="space-y-3 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-text-primary">
                          {showFavoritesOnly ? "Favorite Sessions" : "Recent Sessions"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={cn(
                              "text-xs",
                              showFavoritesOnly && "text-accent-orange"
                            )}
                          >
                            <Star className={cn("h-3 w-3 mr-1", showFavoritesOnly && "fill-current")} />
                            {showFavoritesOnly ? "All" : "Favorites"}
                          </Button>
                          {loadingFromSupabase && (
                            <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
                          )}
                        </div>
                      </div>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary flex-1 flex items-center justify-center flex-col gap-2">
                          <Clock className="h-8 w-8 text-text-quaternary" />
                          <p>
                            {showFavoritesOnly
                              ? "No favorite sessions yet"
                              : "No sessions yet. Generate a response to create your first session."
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          <AnimatePresence mode="popLayout">
                            {sessions.map((session) => (
                              <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={cn(
                                  "p-3 border rounded-lg transition-colors cursor-pointer group",
                                  session.isFavorite
                                    ? "border-accent-orange/30 bg-accent-orange/5 hover:border-accent-orange/50"
                                    : "border-border-primary hover:border-accent-blue/30"
                                )}
                              >
                                <div
                                  className="flex-1"
                                  onClick={() => {
                                    setPrompt(session.prompt);
                                    setResponse(session.response);
                                    setSelectedModel(session.model);
                                    setTemperature(session.temperature);
                                    setMaxTokens(session.maxTokens);
                                    setTopP(session.topP);
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-text-primary">{session.name}</span>
                                      {session.isFavorite && (
                                        <Star className="h-3 w-3 text-accent-orange fill-current" />
                                      )}
                                    </div>
                                    <span className="text-xs text-text-tertiary">
                                      {session.timestamp.toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-secondary line-clamp-2">
                                    {session.prompt}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {session.model.split('/').pop() || session.model}
                                    </Badge>
                                    {session.responseTimeMs && (
                                      <span className="text-xs text-text-quaternary">
                                        {(session.responseTimeMs / 1000).toFixed(1)}s
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(session.id);
                                    }}
                                    className="h-7 px-2"
                                    title={session.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <Star className={cn(
                                      "h-3 w-3",
                                      session.isFavorite && "fill-current text-accent-orange"
                                    )} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSession(session.id);
                                    }}
                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                    title="Delete session"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrompt(session.prompt);
                                      setResponse(session.response);
                                      setSelectedModel(session.model);
                                      setTemperature(session.temperature);
                                      setMaxTokens(session.maxTokens);
                                      setTopP(session.topP);
                                    }}
                                    className="h-7 px-2"
                                    title="Load session"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </GlassCard>
            </div>

            {/* Response Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-sm font-medium text-text-primary">Response</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(response, "Response")}
                      disabled={!response}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-surface-graphite/50 rounded-lg border border-border-primary/30">
                    {response ? (
                      <div className="text-sm text-text-primary whitespace-pre-wrap">
                        {response}
                      </div>
                    ) : (
                      <div className="text-sm text-text-tertiary h-full flex items-center justify-center">
                        {isGenerating ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating response...
                          </div>
                        ) : (
                          "Response will appear here"
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



