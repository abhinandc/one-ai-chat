import { useState, useEffect } from 'react';
import { X, Link2, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { n8nService, N8NCredentials } from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [n8nUrl, setN8nUrl] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const credentials = n8nService.getCredentials();
      if (credentials) {
        setN8nUrl(credentials.url);
        setN8nApiKey(credentials.apiKey);
        setConnectionStatus('connected');
      } else {
        setN8nUrl('');
        setN8nApiKey('');
        setConnectionStatus('disconnected');
      }
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!n8nUrl.trim() || !n8nApiKey.trim()) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both N8N URL and API key',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    const credentials: N8NCredentials = {
      url: n8nUrl.trim(),
      apiKey: n8nApiKey.trim(),
    };

    const result = await n8nService.testConnection(credentials);
    setIsTesting(false);

    if (result.success) {
      setConnectionStatus('connected');
      toast({
        title: 'Connection successful',
        description: 'Successfully connected to your N8N instance',
      });
    } else {
      setConnectionStatus('error');
      toast({
        title: 'Connection failed',
        description: result.error || 'Could not connect to N8N',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!n8nUrl.trim() || !n8nApiKey.trim()) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both N8N URL and API key',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const credentials: N8NCredentials = {
      url: n8nUrl.trim(),
      apiKey: n8nApiKey.trim(),
    };

    const result = await n8nService.testConnection(credentials);
    
    if (result.success) {
      n8nService.saveCredentials(credentials);
      setConnectionStatus('connected');
      toast({
        title: 'Integration saved',
        description: 'N8N integration has been configured successfully',
      });
      onClose();
    } else {
      setConnectionStatus('error');
      toast({
        title: 'Could not save',
        description: result.error || 'Please verify your credentials and try again',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleDisconnect = () => {
    n8nService.removeCredentials();
    setN8nUrl('');
    setN8nApiKey('');
    setConnectionStatus('disconnected');
    toast({
      title: 'Disconnected',
      description: 'N8N integration has been removed',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/20">
          <div className="flex items-center justify-between p-6 border-b border-border-primary/10">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Integrations</h2>
              <p className="text-sm text-text-secondary mt-1">Connect external services</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FF6D5A]/10 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-[#FF6D5A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">N8N Workflows</h3>
                    <p className="text-xs text-text-secondary">Sync and manage your N8N automation workflows</p>
                  </div>
                </div>
                {connectionStatus === 'connected' && (
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <XCircle className="h-3 w-3" />
                    Error
                  </div>
                )}
              </div>

              <div className="space-y-3 pl-13">
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary">N8N Instance URL</label>
                  <GlassInput
                    placeholder="https://your-n8n.example.com"
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    data-testid="input-n8n-url"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary">API Key</label>
                  <div className="relative">
                    <GlassInput
                      placeholder="Your N8N API key"
                      value={n8nApiKey}
                      onChange={(e) => setN8nApiKey(e.target.value)}
                      type={showApiKey ? 'text' : 'password'}
                      className="pr-10"
                      data-testid="input-n8n-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={isTesting || !n8nUrl.trim() || !n8nApiKey.trim()}
                    data-testid="button-test-n8n"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !n8nUrl.trim() || !n8nApiKey.trim()}
                    data-testid="button-save-n8n"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>

                  {connectionStatus === 'connected' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnect}
                      className="text-red-500"
                      data-testid="button-disconnect-n8n"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs text-text-tertiary">
                    Get your API key from N8N Settings &gt; n8n API. 
                    <a 
                      href="https://docs.n8n.io/api/authentication/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-blue ml-1 inline-flex items-center gap-0.5"
                    >
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Note: Your N8N instance must allow CORS requests from this domain. 
                    Add this origin to N8N's FRONTEND_SETTINGS_EXTERNAL_FRONTEND or use a proxy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
