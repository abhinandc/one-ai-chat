import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import supabase from "@/services/supabaseClient";
import { Key, Copy, Check, Eye, EyeOff, RefreshCw, Zap, MessageSquare, Code, Image, Brain, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelData {
  id: string;
  name: string;
  display_name?: string;
  provider?: string;
  context_length?: number;
  max_tokens?: number;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
  api_path?: string;
  kind?: string;
  mode?: string;
}

interface VirtualKeyData {
  id: string;
  key_hash?: string;
  key?: string;
  token?: string;
  label?: string;
  key_alias?: string;
  key_name?: string;
  key_prefix?: string;
  user_id?: string;
  email?: string;
  team_id?: string;
  models?: ModelData[] | string[];
  models_json?: string[];
  budget?: number;
  budget_usd?: number;
  max_budget?: number;
  expires_at?: string;
  rpm?: number;
  rpd?: number;
  tpm?: number;
  tpd?: number;
  created_at?: string;
  disabled?: boolean;
  all_models_allowed?: boolean;
  tags_json?: string[];
  masked_key?: string;
  metadata?: Record<string, unknown>;
}

// Helper to detect model type from name/kind
const getModelType = (model: ModelData): 'chat' | 'code' | 'image' | 'vision' | 'embed' => {
  const name = (model.name || '').toLowerCase();
  const kind = (model.kind || '').toLowerCase();
  const mode = (model.mode || '').toLowerCase();

  if (mode.includes('image') || kind.includes('image') || name.includes('dall-e') || name.includes('stable-diffusion') || name.includes('imagen')) {
    return 'image';
  }
  if (mode.includes('vision') || kind.includes('vision') || name.includes('vision')) {
    return 'vision';
  }
  if (kind.includes('code') || name.includes('code') || name.includes('codex') || name.includes('deepseek-coder')) {
    return 'code';
  }
  if (kind.includes('embed') || name.includes('embed') || name.includes('embedding')) {
    return 'embed';
  }
  return 'chat';
};

const modelTypeConfig = {
  chat: { icon: MessageSquare, label: 'Chat', color: 'text-blue-500' },
  code: { icon: Code, label: 'Code', color: 'text-green-500' },
  image: { icon: Image, label: 'Image', color: 'text-purple-500' },
  vision: { icon: Eye, label: 'Vision', color: 'text-orange-500' },
  embed: { icon: Brain, label: 'Embed', color: 'text-cyan-500' },
};

const ModelsHub = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [virtualKeys, setVirtualKeys] = useState<VirtualKeyData[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);

  // Fetch employee keys using Edge Function
  const fetchVirtualKeys = async () => {
    if (!supabase) {
      setKeysError("Supabase not configured");
      setKeysLoading(false);
      return;
    }

    if (!user?.email) {
      setKeysError("User not logged in");
      setKeysLoading(false);
      return;
    }

    try {
      setKeysLoading(true);
      setKeysError(null);

      // Get the current session to ensure we have a valid auth token
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session status:', sessionData?.session ? 'Active' : 'No session');

      // Call the employee_keys Edge Function
      const { data, error } = await supabase.functions.invoke('employee_keys', {
        body: { email: user.email }
      });

      console.log('Employee Keys Edge Function Result:', { data, error, userEmail: user.email });

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      // Handle different response formats from the Edge Function
      // Could be: { keys: [...] } or { data: [...] } or just [...]
      const keys = data?.keys || data?.data || (Array.isArray(data) ? data : []);
      setVirtualKeys(keys);
    } catch (err) {
      console.error('Failed to fetch employee keys:', err);
      setKeysError(err instanceof Error ? err.message : 'Failed to fetch employee keys');
    } finally {
      setKeysLoading(false);
    }
  };

  // Load active key from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('oneai_api_key');
    if (storedKey && virtualKeys.length > 0) {
      // Find which key matches the stored one
      const matchingKey = virtualKeys.find(k => {
        const keyValue = k.masked_key || k.key || k.token || k.key_hash;
        return keyValue && storedKey.includes(keyValue.replace(/\.\.\./g, ''));
      });
      if (matchingKey) {
        setActiveKeyId(matchingKey.id);
      }
    }
  }, [virtualKeys]);

  // Fetch data when user is available
  useEffect(() => {
    if (user?.email) {
      fetchVirtualKeys();
    }
  }, [user?.email]);

  // Get all unique models assigned to the user via virtual keys (preserving full model data)
  const assignedModels = useMemo(() => {
    const modelsMap = new Map<string, ModelData>();
    virtualKeys.forEach(key => {
      const modelsList = key.models || [];
      if (Array.isArray(modelsList)) {
        modelsList.forEach((modelItem) => {
          if (typeof modelItem === 'object' && modelItem !== null && 'name' in modelItem) {
            const model = modelItem as ModelData;
            if (model.name && !modelsMap.has(model.name)) {
              modelsMap.set(model.name, model);
            }
          } else if (typeof modelItem === 'string' && modelItem.trim()) {
            if (!modelsMap.has(modelItem)) {
              modelsMap.set(modelItem, { id: modelItem, name: modelItem, provider: 'other' });
            }
          }
        });
      }
    });
    return Array.from(modelsMap.values());
  }, [virtualKeys]);

  // Helper to get key display value
  const getKeyDisplayValue = (key: VirtualKeyData) => {
    return key.masked_key || key.key || key.token || key.key_hash || 'sk-***';
  };

  // Helper to get key label
  const getKeyLabel = (key: VirtualKeyData) => {
    return key.label || key.key_alias || key.key_name || 'Virtual Key';
  };

  // Helper to get models list (handles both string[] and ModelData[])
  const getKeyModels = (key: VirtualKeyData): string[] => {
    const modelsList = key.models || key.models_json || [];
    if (!Array.isArray(modelsList)) return [];
    return modelsList.map((m) => {
      if (typeof m === 'string') return m.trim();
      if (typeof m === 'object' && m !== null && 'name' in m) {
        return (m as ModelData).name;
      }
      return '';
    }).filter((m): m is string => m !== '');
  };

  // Helper to get budget
  const getKeyBudget = (key: VirtualKeyData) => {
    return key.budget_usd ?? key.budget ?? key.max_budget ?? 0;
  };

  // Group assigned models by provider (using actual provider field from model data)
  const groupedByProvider = useMemo(() => {
    const groups = new Map<string, ModelData[]>();
    assignedModels.forEach((model) => {
      const provider = model.provider || 'other';
      if (!groups.has(provider)) {
        groups.set(provider, []);
      }
      groups.get(provider)?.push(model);
    });
    return Array.from(groups.entries());
  }, [assignedModels]);

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "API key copied successfully"
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const setAsActiveKey = (key: string, keyId: string) => {
    localStorage.setItem('oneai_api_key', key);
    setActiveKeyId(keyId);
    toast({
      title: "API Key Activated",
      description: "This key will be used for all API requests"
    });
  };

  const handleRefresh = () => {
    fetchVirtualKeys();
  };

  const loading = keysLoading;

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-xl p-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-md">
          <div className="space-y-xs">
            <h1 className="text-3xl font-semibold text-text-primary font-display">Models & API Keys</h1>
            <p className="text-text-secondary">
              Your assigned models and API keys from EdgeAdmin. Select a key to activate it for API requests.
            </p>
            {user?.email && (
              <p className="text-xs text-text-tertiary">
                Logged in as: <span className="font-medium text-text-secondary">{user.email}</span>
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Virtual Keys Section */}
        <section className="space-y-md">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-accent-blue" />
            <h2 className="text-xl font-semibold text-text-primary">Your API Keys</h2>
          </div>

          {keysLoading ? (
            <GlassCard className="p-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">Loading your API keys...</span>
              </div>
            </GlassCard>
          ) : keysError ? (
            <GlassCard className="p-lg text-sm text-accent-orange bg-accent-orange/10 border-accent-orange/40">
              <p className="font-medium">Error loading API keys:</p>
              <p className="mt-1">{keysError}</p>
              <p className="mt-2 text-xs text-text-tertiary">Check browser console for details</p>
            </GlassCard>
          ) : virtualKeys.length === 0 ? (
            <GlassCard className="p-lg">
              <div className="text-center py-4">
                <Key className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary mb-1">No API keys assigned</p>
                <p className="text-xs text-text-tertiary">
                  Contact your EdgeAdmin administrator to get API access for {user?.email}
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-md">
              {virtualKeys.map((key) => {
                const keyValue = getKeyDisplayValue(key);
                const keyLabel = getKeyLabel(key);
                const keyModels = getKeyModels(key);
                const keyBudget = getKeyBudget(key);

                return (
                  <GlassCard
                    key={key.id}
                    className={`p-lg transition-all ${activeKeyId === key.id ? 'ring-2 ring-accent-blue border-accent-blue/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-md mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{keyLabel}</p>
                          {activeKeyId === key.id && (
                            <Badge className="bg-accent-blue text-white text-xs">Active</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-text-tertiary">
                          <span>Budget: ${keyBudget.toFixed(2)}</span>
                          <span>Models: {keyModels.length}</span>
                          {key.rpm && <span>RPM: {key.rpm}</span>}
                        </div>
                      </div>
                      <Badge variant={key.disabled ? 'destructive' : 'secondary'}>
                        {key.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </div>

                    {/* API Key Display */}
                    <div className="bg-surface-graphite rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs text-text-secondary font-mono flex-1 truncate">
                          {visibleKeyId === key.id ? keyValue : '••••••••••••••••••••••••'}
                        </code>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setVisibleKeyId(visibleKeyId === key.id ? null : key.id)}
                          >
                            {visibleKeyId === key.id ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => copyToClipboard(keyValue, key.id)}
                          >
                            {copiedKeyId === key.id ? (
                              <Check className="h-3.5 w-3.5 text-accent-green" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Models */}
                    {keyModels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {keyModels.map((model) => (
                          <Badge key={model} variant="outline" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {activeKeyId !== key.id && (
                        <Button
                          size="sm"
                          onClick={() => setAsActiveKey(keyValue, key.id)}
                          className="text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Use This Key
                        </Button>
                      )}
                      {activeKeyId === key.id && (
                        <span className="text-xs text-accent-blue flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Currently in use for API requests
                        </span>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Models Catalog Section */}
        <section className="space-y-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-blue" />
              <h2 className="text-xl font-semibold text-text-primary">Your Assigned Models</h2>
            </div>
            <span className="text-xs text-text-tertiary">
              {assignedModels.length} model(s) available
            </span>
          </div>

          {keysLoading ? (
            <GlassCard className="p-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">Loading models...</span>
              </div>
            </GlassCard>
          ) : assignedModels.length === 0 ? (
            <GlassCard className="p-lg">
              <div className="text-center py-4">
                <Zap className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary mb-1">No models assigned</p>
                <p className="text-xs text-text-tertiary">
                  Your API keys don't have any models assigned yet
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-lg">
              {groupedByProvider.map(([provider, providerModels]) => (
                <div key={provider} className="space-y-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary capitalize">{provider}</h3>
                    <span className="text-xs text-text-tertiary">{providerModels.length} model(s)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                    {providerModels.map((model) => {
                      const modelType = getModelType(model);
                      const TypeIcon = modelTypeConfig[modelType].icon;
                      const typeLabel = modelTypeConfig[modelType].label;
                      const typeColor = modelTypeConfig[modelType].color;

                      return (
                        <GlassCard key={model.id || model.name} className="p-md hover:border-accent-blue/30 transition-colors group">
                          <div className="space-y-3">
                            {/* Header with type indicator */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-text-primary text-sm truncate">
                                  {model.display_name || model.name}
                                </h4>
                                <p className="text-xs text-text-tertiary capitalize">{model.provider || provider}</p>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted ${typeColor}`}>
                                <TypeIcon className="h-3 w-3" />
                                <span className="text-xs font-medium">{typeLabel}</span>
                              </div>
                            </div>

                            {/* Model details */}
                            <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
                              {model.context_length && (
                                <span className="flex items-center gap-1">
                                  <Brain className="h-3 w-3" />
                                  {(model.context_length / 1000).toFixed(0)}K context
                                </span>
                              )}
                              {(model.cost_per_1k_input || model.cost_per_1k_output) && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${((model.cost_per_1k_input || 0) + (model.cost_per_1k_output || 0)).toFixed(4)}/1K
                                </span>
                              )}
                            </div>

                            {/* Action button - appears on hover for chat/code models */}
                            {(modelType === 'chat' || modelType === 'code' || modelType === 'vision') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                onClick={() => navigate('/chat', { state: { selectedModelId: model.name } })}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat with this model
                              </Button>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ModelsHub;
