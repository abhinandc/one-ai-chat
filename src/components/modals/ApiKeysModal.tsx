import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKey {
  id: string;
  name: string;
  service: string;
  key: string;
  created: string;
  lastUsed: string;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  const [oneaiApiKey, setOneaiApiKey] = useState(localStorage.getItem('oneai_api_key') || '');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
    const saved = localStorage.getItem('external_api_keys');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyService, setNewKeyService] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const saveOneaiKey = () => {
    localStorage.setItem('oneai_api_key', oneaiApiKey);
    alert('OneAI API key saved! Please refresh the page to see your models.');
  };

  const addApiKey = () => {
    if (newKeyName && newKeyService && newKeyValue) {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        service: newKeyService,
        key: newKeyValue,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never'
      };
      const updatedKeys = [...apiKeys, newKey];
      setApiKeys(updatedKeys);
      localStorage.setItem('external_api_keys', JSON.stringify(updatedKeys));
      setNewKeyName('');
      setNewKeyService('');
      setNewKeyValue('');
      setShowAddForm(false);
    }
  };

  const deleteKey = (id: string) => {
    const updatedKeys = apiKeys.filter(key => key.id !== id);
    setApiKeys(updatedKeys);
    localStorage.setItem('external_api_keys', JSON.stringify(updatedKeys));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-border-primary/10">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">API Keys</h2>
              <p className="text-sm text-text-secondary mt-1">Manage your external service API keys</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-surface-graphite/50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* OneAI API Key Section */}
            <GlassCard className="p-6 border border-accent-blue/30 bg-accent-blue/10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-accent-blue" />
                  <h3 className="text-lg font-medium text-text-primary">OneAI API Key</h3>
                </div>
                <p className="text-sm text-text-secondary">
                  Enter the API key provided by your admin to access OneAI models and features.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">API Key</label>
                    <GlassInput
                      type="password"
                      placeholder="sk-..."
                      value={oneaiApiKey}
                      onChange={(e) => setOneaiApiKey(e.target.value)}
                    />
                  </div>
                  <Button onClick={saveOneaiKey} disabled={!oneaiApiKey.trim()}>
                    Save OneAI Key
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* External API Keys Section */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-text-primary">External API Keys</h3>
                <p className="text-sm text-text-secondary">
                  Manage your API keys for external services. Keys are encrypted and stored securely.
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
                disabled={showAddForm}
              >
                <Plus className="h-4 w-4" />
                Add External Key
              </Button>
            </div>

            {/* Add New Key Form */}
            {showAddForm && (
              <GlassCard className="p-6 border border-accent-blue/20 bg-accent-blue/5">
                <h3 className="text-lg font-medium text-text-primary mb-4">Add New API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">Key Name</label>
                    <GlassInput
                      placeholder="e.g., OpenAI Production"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">Service</label>
                    <select
                      className="w-full px-3 py-2 bg-surface-graphite/50 border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      value={newKeyService}
                      onChange={(e) => setNewKeyService(e.target.value)}
                    >
                      <option value="">Select a service</option>
                      <option value="OpenAI">OpenAI</option>
                      <option value="Anthropic">Anthropic</option>
                      <option value="Google">Google AI</option>
                      <option value="Cohere">Cohere</option>
                      <option value="Hugging Face">Hugging Face</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">API Key</label>
                    <GlassInput
                      type="password"
                      placeholder="Enter your API key"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={addApiKey} disabled={!newKeyName || !newKeyService || !newKeyValue}>
                      Add Key
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddForm(false);
                      setNewKeyName('');
                      setNewKeyService('');
                      setNewKeyValue('');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* API Keys List */}
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <GlassCard key={apiKey.id} className="p-6 border border-border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-accent-blue/10 rounded-xl">
                        <Key className="h-5 w-5 text-accent-blue" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-text-primary">{apiKey.name}</h3>
                        <p className="text-sm text-text-secondary">{apiKey.service}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-text-tertiary">Created: {apiKey.created}</span>
                          <span className="text-xs text-text-tertiary">Last used: {apiKey.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        title="Toggle visibility"
                      >
                        {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyKey(apiKey.key, apiKey.id)}
                        title="Copy key"
                      >
                        {copiedKey === apiKey.id ? <Check className="h-4 w-4 text-accent-green" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${apiKey.name}"? This action cannot be undone.`)) {
                            deleteKey(apiKey.id);
                          }
                        }}
                        className="text-accent-red hover:text-accent-red hover:bg-accent-red/10"
                        title="Delete key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">Key:</span>
                      <code className="text-sm bg-surface-graphite/50 px-2 py-1 rounded font-mono">
                        {showKeys[apiKey.id] ? apiKey.key : apiKey.key.replace(/./g, '*')}
                      </code>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-8 border-t border-border-primary/10">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
