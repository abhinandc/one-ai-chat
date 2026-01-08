import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, ExternalLink, Cpu } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ModelEndpoint {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  modelId: string;
  provider: string;
  enabled: boolean;
  description?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

interface ModelsSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelsSettingsModal({ open, onOpenChange }: ModelsSettingsModalProps) {
  const [models, setModels] = useState<ModelEndpoint[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState<Partial<ModelEndpoint>>({
    name: "",
    baseUrl: "",
    apiKey: "",
    modelId: "",
    provider: "openai",
    enabled: true,
    description: "",
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
  });

  // Load models from localStorage on mount
  useEffect(() => {
    const savedModels = localStorage.getItem('oneai_custom_models');
    if (savedModels) {
      try {
        setModels(JSON.parse(savedModels));
      } catch (error) {
        console.error('Failed to parse saved models:', error);
      }
    } else {
      // Set default models
      const defaultModels: ModelEndpoint[] = [
        {
          id: "litellm-local",
          name: "LiteLLM (Local Models)",
          baseUrl: "/api",
          modelId: "local/mamba2-1.4b",
          provider: "litellm",
          enabled: true,
          description: "Local vLLM models via LiteLLM proxy",
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
        },
        {
          id: "vllm-mamba2",
          name: "Mamba2 1.4B (Direct)",
          baseUrl: "http://localhost:8082/v1",
          modelId: "mamba2-1.4b",
          provider: "vllm",
          enabled: true,
          description: "Direct connection to vLLM Mamba2 service",
          maxTokens: 2048,
          temperature: 0.7,
          topP: 0.9,
        },
        {
          id: "vllm-qwen",
          name: "Qwen 2.5 Coder 14B (Direct)",
          baseUrl: "http://localhost:8002/v1",
          modelId: "qwen-2.5-coder-14b",
          provider: "vllm",
          enabled: true,
          description: "Direct connection to vLLM Qwen service",
          maxTokens: 32768,
          temperature: 0.7,
          topP: 0.9,
        },
      ];
      setModels(defaultModels);
      localStorage.setItem('oneai_custom_models', JSON.stringify(defaultModels));
    }
  }, []);

  // Save models to localStorage whenever models change
  useEffect(() => {
    if (models.length > 0) {
      localStorage.setItem('oneai_custom_models', JSON.stringify(models));
    }
  }, [models]);

  const handleAddModel = () => {
    // Validation
    if (!newModel.name?.trim()) {
      alert("Please enter a model name");
      return;
    }
    if (!newModel.baseUrl?.trim()) {
      alert("Please enter a base URL");
      return;
    }
    if (!newModel.modelId?.trim()) {
      alert("Please enter a model ID");
      return;
    }

    const model: ModelEndpoint = {
      id: `custom-${Date.now()}`,
      name: newModel.name.trim(),
      baseUrl: newModel.baseUrl.trim(),
      apiKey: newModel.apiKey?.trim() || undefined,
      modelId: newModel.modelId.trim(),
      provider: newModel.provider || "openai",
      enabled: newModel.enabled ?? true,
      description: newModel.description?.trim() || undefined,
      maxTokens: newModel.maxTokens || 4096,
      temperature: newModel.temperature || 0.7,
      topP: newModel.topP || 0.9,
    };

    console.log("Adding new model:", model);
    setModels(prev => {
      const updated = [...prev, model];
      console.log("Updated models list:", updated);
      return updated;
    });
    
    // Reset form
    setNewModel({
      name: "",
      baseUrl: "",
      apiKey: "",
      modelId: "",
      provider: "openai",
      enabled: true,
      description: "",
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
    });
    setShowAddForm(false);
    
    // Show success message
    alert(`✅ Model "${model.name}" added successfully!`);
  };

  const handleDeleteModel = (id: string) => {
    setModels(prev => prev.filter(model => model.id !== id));
  };

  const handleToggleModel = (id: string) => {
    setModels(prev => prev.map(model => 
      model.id === id ? { ...model, enabled: !model.enabled } : model
    ));
  };

  const handleTestConnection = async (model: ModelEndpoint) => {
    try {
      const response = await fetch(`${model.baseUrl}/models`, {
        headers: model.apiKey ? { 'Authorization': `Bearer ${model.apiKey}` } : {},
      });
      
      if (response.ok) {
        alert(`✅ Connection successful to ${model.name}`);
      } else {
        alert(`❌ Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      alert(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-display text-xl">
            Models Settings
          </DialogTitle>
          <p className="text-text-secondary text-sm">
            Configure custom model endpoints and API connections for OneEdge
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Model Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-text-primary">Custom Model Endpoints</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  const saved = localStorage.getItem('oneai_custom_models');
                  console.log('Saved models:', saved);
                  alert(`Models in storage: ${saved ? JSON.parse(saved).length : 0}`);
                }}
              >
                Debug
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-accent-blue hover:bg-accent-blue/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
          </div>

          {/* Add Model Form */}
          {showAddForm && (
            <GlassCard className="p-6 border-accent-blue/20">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-text-primary">Add New Model Endpoint</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Model Name</Label>
                    <Input
                      id="name"
                      value={newModel.name || ""}
                      onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., GPT-4 Turbo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select 
                      value={newModel.provider} 
                      onValueChange={(value) => setNewModel(prev => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI Compatible</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="vllm">vLLM</SelectItem>
                        <SelectItem value="litellm">LiteLLM</SelectItem>
                        <SelectItem value="ollama">Ollama</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={newModel.baseUrl || ""}
                      onChange={(e) => setNewModel(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelId">Model ID</Label>
                    <Input
                      id="modelId"
                      value={newModel.modelId || ""}
                      onChange={(e) => setNewModel(prev => ({ ...prev, modelId: e.target.value }))}
                      placeholder="gpt-4-turbo-preview"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="apiKey">API Key (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={newModel.apiKey || ""}
                      onChange={(e) => setNewModel(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newModel.description || ""}
                      onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this model..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddModel}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Model
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Models List */}
          <div className="space-y-3">
            {models.map((model) => (
              <GlassCard key={model.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-accent-blue" />
                        <h4 className="font-medium text-text-primary">{model.name}</h4>
                        <Badge variant={model.provider === 'litellm' ? 'default' : 'secondary'}>
                          {model.provider}
                        </Badge>
                        {!model.enabled && (
                          <Badge variant="outline" className="text-text-secondary">
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-text-secondary">
                        <strong>Endpoint:</strong> {model.baseUrl}
                      </p>
                      <p className="text-sm text-text-secondary">
                        <strong>Model ID:</strong> {model.modelId}
                      </p>
                      {model.description && (
                        <p className="text-sm text-text-secondary">{model.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => handleToggleModel(model.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(model)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {!model.id.startsWith('litellm-') && !model.id.startsWith('vllm-') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-accent-red hover:bg-accent-red/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}

            {models.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No model endpoints configured</p>
                <p className="text-sm">Add your first model endpoint to get started</p>
              </div>
            )}
          </div>

          {/* Help Section */}
          <GlassCard className="p-4 bg-surface-graphite/20">
            <h4 className="font-medium text-text-primary mb-2">💡 Quick Setup Tips</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• <strong>OpenAI Compatible:</strong> Use for OpenAI, Azure OpenAI, or compatible APIs</li>
              <li>• <strong>vLLM:</strong> Direct connection to vLLM inference servers</li>
              <li>• <strong>LiteLLM:</strong> Proxy that supports multiple model providers</li>
              <li>• <strong>Ollama:</strong> Local models via Ollama (typically http://localhost:11434/v1)</li>
              <li>• Test connections before enabling models in production</li>
            </ul>
          </GlassCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
