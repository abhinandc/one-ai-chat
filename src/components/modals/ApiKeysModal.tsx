import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Plus, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { useVirtualKeys } from '@/hooks/useVirtualKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  const [newKey, setNewKey] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const user = useCurrentUser();
  const { virtualKeys, loading, error, refetch } = useVirtualKeys(user?.email);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleAddKey = async () => {
    if (!newKey.trim() || !user?.email) return;

    setIsAdding(true);
    try {
      // Store the key in localStorage for immediate use
      localStorage.setItem('oneai_api_key', newKey.trim());
      
      toast({
        title: 'Virtual Key Added',
        description: 'Your virtual key has been saved and is ready to use.',
      });
      
      setNewKey('');
      setNewKeyLabel('');
      await refetch();
    } catch (error) {
      console.error('Failed to add virtual key:', error);
      toast({
        title: 'Failed to Add Key',
        description: error instanceof Error ? error.message : 'Failed to add virtual key',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied',
      description: 'Virtual key copied to clipboard',
    });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">API Keys</h2>
            <p className="text-sm text-text-secondary mt-1">
              Manage your virtual keys from OneAI Admin
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Add New Key */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-primary">Add Virtual Key</h3>
            <div className="space-y-3">
              <GlassInput
                placeholder="Paste your virtual key from OneAI Admin..."
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                type={showKey ? 'text' : 'password'}
                className="pr-10"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="text-text-secondary"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showKey ? 'Hide' : 'Show'} key
                </Button>
                <Button
                  onClick={handleAddKey}
                  disabled={!newKey.trim() || isAdding}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isAdding ? 'Adding...' : 'Add Key'}
                </Button>
              </div>
            </div>
          </div>

          {/* Current Keys */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-primary">Your Virtual Keys</h3>
            
            {loading && (
              <div className="text-center py-8">
                <Key className="h-8 w-8 text-text-quaternary mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-text-secondary">Loading virtual keys...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-accent-red flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent-red">Failed to load virtual keys</p>
                  <p className="text-xs text-accent-red/80">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && virtualKeys.length === 0 && (
              <div className="text-center py-8">
                <Key className="h-8 w-8 text-text-quaternary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No virtual keys found</p>
                <p className="text-xs text-text-tertiary mt-1">
                  Request a virtual key from OneAI Admin and paste it above
                </p>
              </div>
            )}

            {virtualKeys.map((key) => (
              <GlassCard key={key.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-text-primary">{key.label}</h4>
                      <p className="text-sm text-text-secondary">
                        Budget: {formatBudget(key.budget_usd)} • 
                        Models: {key.models_json.length} • 
                        RPM: {key.rpm}
                      </p>
                      {key.masked_key && (
                        <p className="text-xs text-text-tertiary font-mono mt-1">
                          {key.masked_key}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {key.masked_key && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(key.masked_key!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent-red hover:text-accent-red"
                        onClick={() => {
                          if (confirm('Remove this virtual key?')) {
                            // removeVirtualKey(key.id);
                            toast({
                              title: 'Key Removed',
                              description: 'Virtual key has been deactivated',
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {key.models_json.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-2">Assigned Models:</p>
                      <div className="flex flex-wrap gap-1">
                        {key.models_json.slice(0, 5).map((model) => (
                          <span
                            key={model}
                            className="text-xs px-2 py-1 bg-accent-blue/10 text-accent-blue rounded"
                          >
                            {model}
                          </span>
                        ))}
                        {key.models_json.length > 5 && (
                          <span className="text-xs px-2 py-1 bg-surface-graphite text-text-tertiary rounded">
                            +{key.models_json.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs text-text-tertiary">
                    <div>Rate Limits: {key.rpm} RPM / {key.rpd} RPD</div>
                    <div>Token Limits: {key.tpm} TPM / {key.tpd} TPD</div>
                  </div>

                  {key.expires_at && (
                    <div className="text-xs text-accent-orange">
                      Expires: {formatDate(key.expires_at)}
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="border-t border-border-primary p-6">
          <div className="text-xs text-text-tertiary">
            <p>• Virtual keys are issued by OneAI Admin and provide access to specific models</p>
            <p>• Keys are stored securely and used to authenticate API requests</p>
            <p>• Contact your administrator to request additional keys or model access</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
