import { useState } from "react";
import { Play, Save, Share, Settings, Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
}

const models = [
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3", provider: "Anthropic" },
  { id: "llama-2", name: "Llama 2", provider: "Meta" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
];

const promptExamples = [
  {
    title: "Creative Writing",
    prompt: "Write a short story about a time traveler who discovers they can only travel to mundane moments in history."
  },
  {
    title: "Code Generation",
    prompt: "Create a Python function that finds the longest palindromic substring in a given string. Include error handling and documentation."
  },
  {
    title: "Data Analysis",
    prompt: "Analyze this sales data and provide insights on trends, patterns, and recommendations for improving performance."
  },
  {
    title: "Brainstorming",
    prompt: "Generate 10 creative marketing campaign ideas for a sustainable fashion brand targeting Gen Z consumers."
  }
];

export default function Playground() {
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<PlaygroundSession[]>([]);
  const { toast } = useToast();

  const generateResponse = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResponse("");

    try {
      // Simulate API call with streaming response
      const words = [
        "I understand your request.",
        "Let me provide a comprehensive response",
        "based on the parameters you've set.",
        "This is a mock response that demonstrates",
        "how the playground would work",
        "with real AI models.",
        "The response would be generated",
        "using the selected model",
        `(${models.find(m => m.id === selectedModel)?.name})`,
        `with temperature ${temperature}`,
        `and max tokens ${maxTokens}.`,
        "In a real implementation,",
        "this would connect to",
        "your chosen AI provider's API",
        "and stream the actual response."
      ];

      let currentResponse = "";
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        currentResponse += (i > 0 ? " " : "") + words[i];
        setResponse(currentResponse);
      }

      // Save session
      const newSession: PlaygroundSession = {
        id: Date.now().toString(),
        name: `Session ${sessions.length + 1}`,
        model: selectedModel,
        temperature,
        maxTokens,
        topP,
        prompt,
        response: currentResponse,
        timestamp: new Date()
      };

      setSessions(prev => [newSession, ...prev.slice(0, 9)]); // Keep last 10 sessions

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample = (example: typeof promptExamples[0]) => {
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
    const sessionData = {
      model: selectedModel,
      parameters: { temperature, maxTokens, topP },
      prompt,
      response,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border-primary/50 p-4">
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
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            {/* Settings Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="p-4 h-full">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Model Settings</h3>
                    
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Model</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {models.find(m => m.id === selectedModel)?.name}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full bg-card border-border-primary shadow-lg z-50">
                          {models.map((model) => (
                            <DropdownMenuItem
                              key={model.id}
                              onClick={() => setSelectedModel(model.id)}
                              className="text-card-foreground hover:bg-accent-blue/10"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs text-text-tertiary">{model.provider}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Temperature: {temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-surface-graphite rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-text-tertiary">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">Max Tokens</label>
                      <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-surface-graphite border border-border-primary rounded-lg text-text-primary"
                        min="1"
                        max="4096"
                      />
                    </div>

                    {/* Top P */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-primary">
                        Top P: {topP}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={topP}
                        onChange={(e) => setTopP(parseFloat(e.target.value))}
                        className="w-full h-2 bg-surface-graphite rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>

                  {/* Example Prompts */}
                  <div>
                    <h4 className="text-sm font-medium text-text-primary mb-3">Example Prompts</h4>
                    <div className="space-y-2">
                      {promptExamples.map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-2"
                          onClick={() => loadExample(example)}
                        >
                          <div className="text-xs">
                            <div className="font-medium">{example.title}</div>
                            <div className="text-text-tertiary line-clamp-2 mt-1">
                              {example.prompt.substring(0, 60)}...
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Main Panel */}
            <div className="lg:col-span-2">
              <GlassCard className="p-0 h-full flex flex-col">
                <Tabs defaultValue="playground" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                    <TabsTrigger value="playground">Playground</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="playground" className="flex-1 flex flex-col m-4 mt-4">
                    {/* Prompt Input */}
                    <div className="flex-1 flex flex-col space-y-4">
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
                        className="flex-1 min-h-[200px] w-full px-3 py-3 bg-surface-graphite border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      />
                      <Button 
                        onClick={generateResponse} 
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full"
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

                  <TabsContent value="history" className="flex-1 m-4 mt-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-text-primary">Recent Sessions</h3>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8 text-text-secondary">
                          No sessions yet. Generate a response to create your first session.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="p-3 border border-border-primary rounded-lg hover:border-accent-blue/30 transition-colors cursor-pointer"
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
                                <span className="text-sm font-medium text-text-primary">{session.name}</span>
                                <span className="text-xs text-text-tertiary">
                                  {session.timestamp.toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary line-clamp-2">
                                {session.prompt}
                              </p>
                              <div className="text-xs text-text-tertiary mt-1">
                                {models.find(m => m.id === session.model)?.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </GlassCard>
            </div>

            {/* Response Panel */}
            <div className="lg:col-span-1">
              <GlassCard className="p-4 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
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
                  <div className="flex-1 overflow-y-auto">
                    {response ? (
                      <div className="text-sm text-text-primary whitespace-pre-wrap">
                        {response}
                      </div>
                    ) : (
                      <div className="text-sm text-text-tertiary">
                        {isGenerating ? "Generating response..." : "Response will appear here"}
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