import { useState, useEffect } from 'react';
import {
  X, Plus, Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2, RefreshCw,
  Mail, MessageSquare, Bug, Workflow, Settings, AlertTriangle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  edgeVaultService,
  EdgeVaultCredential,
  IntegrationType,
  INTEGRATION_METADATA
} from '@/services/edgeVaultService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTEGRATION_ICONS: Record<IntegrationType, typeof Mail> = {
  google: Mail,
  slack: MessageSquare,
  jira: Bug,
  n8n: Workflow,
  custom: Settings
};

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const user = useCurrentUser();
  const { toast } = useToast();

  // State
  const [credentials, setCredentials] = useState<EdgeVaultCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add credential state
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Validating state
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Fetch credentials
  const fetchCredentials = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await edgeVaultService.getCredentials(user.id);
      setCredentials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCredentials();
    }
  }, [isOpen, user?.id]);

  // Reset add form
  const resetAddForm = () => {
    setIsAdding(false);
    setSelectedType(null);
    setNewLabel('');
    setFieldValues({});
    setShowPasswords({});
  };

  // Handle add credential
  const handleAdd = async () => {
    if (!user?.id || !selectedType) return;

    const metadata = INTEGRATION_METADATA[selectedType];
    const requiredFields = metadata.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !fieldValues[f.key]?.trim());

    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    if (!newLabel.trim()) {
      toast({
        title: 'Label required',
        description: 'Please enter a label for this credential',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      await edgeVaultService.createCredential({
        integration_type: selectedType,
        label: newLabel.trim(),
        credentials: fieldValues
      }, user.id);

      toast({
        title: 'Credential created',
        description: `${metadata.name} credential saved securely`
      });

      resetAddForm();
      await fetchCredentials();
    } catch (err) {
      toast({
        title: 'Failed to create',
        description: err instanceof Error ? err.message : 'Failed to save credential',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user?.id || !credentialToDelete) return;

    setDeleting(true);
    try {
      await edgeVaultService.deleteCredential(credentialToDelete, user.id);
      toast({
        title: 'Credential deleted',
        description: 'Credential has been removed'
      });
      setDeleteDialogOpen(false);
      setCredentialToDelete(null);
      await fetchCredentials();
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Failed to delete credential',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle validate
  const handleValidate = async (credentialId: string) => {
    if (!user?.id) return;

    setValidatingId(credentialId);
    try {
      const isValid = await edgeVaultService.validateCredential(credentialId, user.id);
      toast({
        title: isValid ? 'Connection valid' : 'Connection failed',
        description: isValid ? 'Credential is working correctly' : 'Could not validate connection',
        variant: isValid ? 'default' : 'destructive'
      });
      await fetchCredentials();
    } catch (err) {
      toast({
        title: 'Validation error',
        description: err instanceof Error ? err.message : 'Failed to validate',
        variant: 'destructive'
      });
    } finally {
      setValidatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 text-xs">Active</Badge>;
      case 'expired':
        return <Badge className="bg-orange-500/20 text-orange-500 text-xs">Expired</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-500 text-xs">Error</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const getRelativeTime = (date?: string | null) => {
    if (!date) return 'Never';
    try {
      const now = new Date();
      const then = new Date(date);
      const diff = now.getTime() - then.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
        <GlassCard className="p-0 shadow-2xl border border-border-primary/30">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary/20">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Credentials</h2>
              <p className="text-xs text-text-secondary mt-0.5">Manage your secure integrations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCredentials}
                disabled={loading}
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Add New Credential */}
            {isAdding ? (
              <div className="mb-4 p-4 rounded-lg border border-accent-blue/30 bg-accent-blue/5">
                <h3 className="text-sm font-medium text-text-primary mb-3">Add New Credential</h3>

                {!selectedType ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(INTEGRATION_METADATA) as IntegrationType[]).map((type) => {
                      const meta = INTEGRATION_METADATA[type];
                      const Icon = INTEGRATION_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={cn(
                            "p-3 rounded-lg border border-border-primary/30 hover:border-accent-blue/50",
                            "transition-colors text-left group"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", meta.bgColor)}>
                            <Icon className={cn("h-4 w-4", meta.color)} />
                          </div>
                          <div className="text-sm font-medium text-text-primary group-hover:text-accent-blue">
                            {meta.name}
                          </div>
                          <div className="text-xs text-text-tertiary truncate">
                            {meta.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      {(() => {
                        const meta = INTEGRATION_METADATA[selectedType];
                        const Icon = INTEGRATION_ICONS[selectedType];
                        return (
                          <>
                            <div className={cn("w-6 h-6 rounded flex items-center justify-center", meta.bgColor)}>
                              <Icon className={cn("h-3 w-3", meta.color)} />
                            </div>
                            <span className="text-sm font-medium text-text-primary">{meta.name}</span>
                          </>
                        );
                      })()}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedType(null)}
                        className="ml-auto text-xs"
                      >
                        Change
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-text-secondary">Label *</Label>
                      <GlassInput
                        placeholder="e.g., Production, My Workspace"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    {INTEGRATION_METADATA[selectedType].fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label className="text-xs text-text-secondary">
                          {field.label} {field.required && '*'}
                        </Label>
                        <div className="relative">
                          <GlassInput
                            placeholder={field.placeholder}
                            type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className={cn("h-8 text-sm", field.type === 'password' && "pr-8")}
                          />
                          {field.type === 'password' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            >
                              {showPasswords[field.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={saving}
                        className="bg-accent-blue hover:bg-accent-blue/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Credential'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAddForm}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="mb-4 w-full border-dashed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Credential
              </Button>
            )}

            {/* Credentials List */}
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary">Loading credentials...</p>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-10 w-10 text-text-quaternary mx-auto mb-3" />
                <p className="text-sm text-text-secondary mb-1">No credentials yet</p>
                <p className="text-xs text-text-tertiary">Add integrations to use with your automations</p>
              </div>
            ) : (
              <div className="space-y-2">
                {credentials.map((cred) => {
                  const meta = INTEGRATION_METADATA[cred.integration_type as IntegrationType];
                  const Icon = INTEGRATION_ICONS[cred.integration_type as IntegrationType] || Settings;

                  return (
                    <div
                      key={cred.id}
                      className="p-3 rounded-lg border border-border-primary/30 hover:border-border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta?.bgColor || 'bg-gray-500/10')}>
                            <Icon className={cn("h-4 w-4", meta?.color || 'text-gray-500')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-primary truncate">
                                {cred.label}
                              </span>
                              {getStatusBadge(cred.status)}
                            </div>
                            <div className="text-xs text-text-tertiary mt-0.5">
                              {meta?.name || cred.integration_type}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-quaternary">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Validated: {getRelativeTime(cred.last_validated_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleValidate(cred.id)}
                            disabled={validatingId === cred.id}
                          >
                            {validatingId === cred.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => {
                              setCredentialToDelete(cred.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this credential. Any automations using it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
