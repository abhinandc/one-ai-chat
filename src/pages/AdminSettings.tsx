import { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Rss,
  Layers,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Shield,
  ShieldCheck,
  RefreshCw,
  Power,
  PowerOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAdmin, usePromptFeeds, useAutomationTemplates, useUsers } from '@/hooks/useAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { PromptFeed, AutomationTemplate, UserRole, UserWithRole } from '@/services/adminService';

const TEMPLATE_CATEGORIES = ['gsuite', 'slack', 'jira', 'chat', 'custom'] as const;
const FEED_SOURCE_TYPES = ['api', 'webhook', 'rss'] as const;

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'feeds' | 'templates' | 'users'>('feeds');
  const { toast } = useToast();
  const user = useCurrentUser();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);

  if (adminLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-40 h-4 rounded" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-16 w-16 text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Access Denied
          </h2>
          <p className="text-text-secondary max-w-md">
            You don't have permission to access admin settings. Contact your
            administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-8 w-8 text-accent-blue" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Admin Settings
              </h1>
              <p className="text-text-secondary">
                Manage prompt feeds, automation templates, and user roles
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'feeds' | 'templates' | 'users')}
          >
            <TabsList className="bg-surface-secondary">
              <TabsTrigger
                value="feeds"
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                data-testid="tab-feeds"
              >
                <Rss className="h-4 w-4 mr-2" />
                Prompt Feeds
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                data-testid="tab-templates"
              >
                <Layers className="h-4 w-4 mr-2" />
                Automation Templates
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                data-testid="tab-users"
              >
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="feeds" className="mt-0">
                <PromptFeedsTab />
              </TabsContent>

              <TabsContent value="templates" className="mt-0">
                <AutomationTemplatesTab />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <UserManagementTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function PromptFeedsTab() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingFeed, setSyncingFeed] = useState<string | null>(null);
  const [newFeed, setNewFeed] = useState({
    name: '',
    source_type: 'api' as const,
    source_url: '',
    refresh_interval_minutes: 60,
    is_active: true,
  });

  const { toast } = useToast();
  const user = useCurrentUser();
  const { feeds, loading, error, createFeed, updateFeed, deleteFeed, refetch } =
    usePromptFeeds();

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeed.name.trim() || !newFeed.source_url.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createFeed({
        ...newFeed,
        api_key_encrypted: null,
        created_by: user?.id || null,
      });

      toast({
        title: 'Feed Created',
        description: `"${newFeed.name}" has been created successfully.`,
      });

      setNewFeed({
        name: '',
        source_type: 'api',
        source_url: '',
        refresh_interval_minutes: 60,
        is_active: true,
      });
      setCreateModalOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to Create',
        description: err instanceof Error ? err.message : 'Failed to create feed',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeed = async (feed: PromptFeed) => {
    try {
      await updateFeed(feed.id, { is_active: !feed.is_active });
      toast({
        title: feed.is_active ? 'Feed Deactivated' : 'Feed Activated',
        description: `"${feed.name}" has been ${feed.is_active ? 'deactivated' : 'activated'}.`,
      });
    } catch (err) {
      toast({
        title: 'Failed to Update',
        description: err instanceof Error ? err.message : 'Failed to update feed',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeed = (feedId: string) => {
    setFeedToDelete(feedId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!feedToDelete) return;

    try {
      await deleteFeed(feedToDelete);
      toast({
        title: 'Feed Deleted',
        description: 'The feed has been deleted.',
      });
    } catch (err) {
      toast({
        title: 'Failed to Delete',
        description: err instanceof Error ? err.message : 'Failed to delete feed',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    }
  };

  const handleTestConnection = async () => {
    if (!newFeed.name.trim() || !newFeed.source_url.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter feed name and URL first',
        variant: 'destructive',
      });
      return;
    }

    setTestingConnection(true);
    try {
      const { promptFeedService } = await import('@/services/promptFeedService');
      const result = await promptFeedService.testConnection({
        name: newFeed.name,
        source_type: newFeed.source_type,
        source_url: newFeed.source_url,
        refresh_interval_minutes: newFeed.refresh_interval_minutes,
        is_active: newFeed.is_active,
        created_by: user?.id || null,
      });

      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Test Failed',
        description: err instanceof Error ? err.message : 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncFeed = async (feedId: string, feedName: string) => {
    setSyncingFeed(feedId);
    try {
      const { promptFeedService } = await import('@/services/promptFeedService');
      const result = await promptFeedService.syncFeed(feedId);

      if (result.success) {
        toast({
          title: 'Sync Complete',
          description: `${feedName}: Fetched ${result.prompts_fetched} prompts (${result.prompts_added} new, ${result.prompts_updated} updated)`,
        });
        await refetch();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync feed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Sync Error',
        description: err instanceof Error ? err.message : 'Failed to sync feed',
        variant: 'destructive',
      });
    } finally {
      setSyncingFeed(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-36 h-4 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Prompt Feeds ({feeds.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-accent-blue hover:bg-accent-blue/90"
            data-testid="button-create-feed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Feed
          </Button>
        </div>
      </div>

      {feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Rss className="h-16 w-16 text-text-quaternary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No prompt feeds configured
          </h3>
          <p className="text-text-secondary mb-4">
            Add external prompt sources to share with employees
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Feed
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeds.map((feed) => (
            <GlassCard key={feed.id} className="p-4" data-testid={`card-feed-${feed.id}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-medium text-text-primary">{feed.name}</h3>
                  <p className="text-xs text-text-tertiary capitalize">
                    {feed.source_type} Source
                  </p>
                </div>
                <Badge variant={feed.is_active ? 'default' : 'secondary'}>
                  {feed.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-text-secondary truncate mb-3">
                {feed.source_url}
              </p>

              <div className="text-xs text-text-tertiary mb-4">
                <div className="flex items-center justify-between">
                  <span>Refreshes every {feed.refresh_interval_minutes} minutes</span>
                  {feed.last_sync_status && (
                    <Badge
                      variant={feed.last_sync_status === 'success' ? 'default' : feed.last_sync_status === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {feed.last_sync_status}
                    </Badge>
                  )}
                </div>
                {feed.last_sync_at && (
                  <span className="block mt-1">
                    Last sync: {new Date(feed.last_sync_at).toLocaleString()}
                  </span>
                )}
                {feed.last_sync_error && (
                  <span className="block mt-1 text-accent-red">
                    Error: {feed.last_sync_error}
                  </span>
                )}
                <span className="block mt-1 text-text-quaternary">
                  {feed.prompts_count} prompts stored
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSyncFeed(feed.id, feed.name)}
                  disabled={syncingFeed === feed.id}
                  data-testid={`button-sync-feed-${feed.id}`}
                  title="Manual sync"
                >
                  <RefreshCw className={cn("h-4 w-4", syncingFeed === feed.id && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFeed(feed)}
                  data-testid={`button-toggle-feed-${feed.id}`}
                  title={feed.is_active ? "Deactivate feed" : "Activate feed"}
                >
                  {feed.is_active ? (
                    <PowerOff className="h-4 w-4 text-accent-red" />
                  ) : (
                    <Power className="h-4 w-4 text-accent-green" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFeed(feed.id)}
                  className="text-accent-red hover:text-accent-red"
                  data-testid={`button-delete-feed-${feed.id}`}
                  title="Delete feed"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Feed Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Add Prompt Feed</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Configure an external source for community prompts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFeed}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-primary">
                  Feed Name *
                </Label>
                <GlassInput
                  id="name"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder="e.g., Awesome Prompts"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_type" className="text-text-primary">
                  Source Type *
                </Label>
                <Select
                  value={newFeed.source_type}
                  onValueChange={(v) =>
                    setNewFeed({ ...newFeed, source_type: v as typeof newFeed.source_type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEED_SOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_url" className="text-text-primary">
                  Source URL *
                </Label>
                <GlassInput
                  id="source_url"
                  value={newFeed.source_url}
                  onChange={(e) =>
                    setNewFeed({ ...newFeed, source_url: e.target.value })
                  }
                  placeholder="https://api.example.com/prompts"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refresh_interval" className="text-text-primary">
                  Refresh Interval (minutes)
                </Label>
                <GlassInput
                  id="refresh_interval"
                  type="number"
                  min={5}
                  value={newFeed.refresh_interval_minutes}
                  onChange={(e) =>
                    setNewFeed({
                      ...newFeed,
                      refresh_interval_minutes: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newFeed.is_active}
                  onCheckedChange={(checked) =>
                    setNewFeed({ ...newFeed, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="text-text-primary">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="mr-auto"
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-accent-blue hover:bg-accent-blue/90">
                Create Feed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feed? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AutomationTemplatesTab() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as const,
    template_data: {},
    required_credentials: [] as string[],
    is_active: true,
  });

  const { toast } = useToast();
  const user = useCurrentUser();
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, refetch } =
    useAutomationTemplates();

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a template name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTemplate({
        ...newTemplate,
        created_by: user?.id || null,
      });

      toast({
        title: 'Template Created',
        description: `"${newTemplate.name}" has been created successfully.`,
      });

      setNewTemplate({
        name: '',
        description: '',
        category: 'custom',
        template_data: {},
        required_credentials: [],
        is_active: true,
      });
      setCreateModalOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to Create',
        description: err instanceof Error ? err.message : 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTemplate = async (template: AutomationTemplate) => {
    try {
      await updateTemplate(template.id, { is_active: !template.is_active });
      toast({
        title: template.is_active ? 'Template Deactivated' : 'Template Activated',
        description: `"${template.name}" has been ${template.is_active ? 'deactivated' : 'activated'}.`,
      });
    } catch (err) {
      toast({
        title: 'Failed to Update',
        description: err instanceof Error ? err.message : 'Failed to update template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete);
      toast({
        title: 'Template Deleted',
        description: 'The template has been deleted.',
      });
    } catch (err) {
      toast({
        title: 'Failed to Delete',
        description: err instanceof Error ? err.message : 'Failed to delete template',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gsuite':
        return 'bg-blue-500/10 text-blue-500';
      case 'slack':
        return 'bg-purple-500/10 text-purple-500';
      case 'jira':
        return 'bg-cyan-500/10 text-cyan-500';
      case 'chat':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-36 h-4 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Automation Templates ({templates.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-accent-blue hover:bg-accent-blue/90"
            data-testid="button-create-template"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Layers className="h-16 w-16 text-text-quaternary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No automation templates
          </h3>
          <p className="text-text-secondary mb-4">
            Create templates for common automation workflows
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <GlassCard
              key={template.id}
              className="p-4"
              data-testid={`card-template-${template.id}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-medium text-text-primary">{template.name}</h3>
                  <Badge className={cn('mt-1', getCategoryColor(template.category))}>
                    {template.category}
                  </Badge>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {template.description && (
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {template.description}
                </p>
              )}

              {template.required_credentials.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.required_credentials.map((cred) => (
                    <Badge key={cred} variant="outline" className="text-xs">
                      {cred}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleTemplate(template)}
                  data-testid={`button-toggle-template-${template.id}`}
                >
                  {template.is_active ? (
                    <PowerOff className="h-4 w-4 text-accent-red" />
                  ) : (
                    <Power className="h-4 w-4 text-accent-green" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-accent-red hover:text-accent-red"
                  data-testid={`button-delete-template-${template.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Create Automation Template
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Create a reusable automation template for employees
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-primary">
                  Template Name *
                </Label>
                <GlassInput
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Email Summarizer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-text-primary">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, description: e.target.value })
                  }
                  placeholder="Describe what this template does..."
                  className="bg-surface-graphite border-border-primary text-text-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-text-primary">
                  Category *
                </Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(v) =>
                    setNewTemplate({
                      ...newTemplate,
                      category: v as typeof newTemplate.category,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat === 'gsuite' ? 'GSuite' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newTemplate.is_active}
                  onCheckedChange={(checked) =>
                    setNewTemplate({ ...newTemplate, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="text-text-primary">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-accent-blue hover:bg-accent-blue/90">
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserManagementTab() {
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('employee');

  const { toast } = useToast();
  const { users, loading, error, setUserRole, refetch } = useUsers();

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await setUserRole(selectedUser.id, newRole);
      toast({
        title: 'Role Updated',
        description: `${selectedUser.email}'s role has been updated to ${newRole}.`,
      });
      setSelectedUser(null);
    } catch (err) {
      toast({
        title: 'Failed to Update',
        description: err instanceof Error ? err.message : 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {/* Skeleton loader - NO spinners per Constitution */}
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-36 h-4 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          Users ({users.length})
        </h2>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-text-quaternary mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No users found
          </h3>
          <p className="text-text-secondary">
            Users will appear here once they sign up
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border-primary overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-secondary">
                <TableHead className="text-text-primary">User</TableHead>
                <TableHead className="text-text-primary">Email</TableHead>
                <TableHead className="text-text-primary">Role</TableHead>
                <TableHead className="text-text-primary">Joined</TableHead>
                <TableHead className="text-text-primary w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || user.email}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-accent-blue">
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-text-primary">
                        {user.full_name || 'No name'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={
                        user.role === 'admin'
                          ? 'bg-accent-blue text-white'
                          : ''
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-tertiary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewRole(user.role);
                      }}
                      data-testid={`button-edit-role-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Role Change Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-[400px] bg-card border-border-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Change User Role</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-text-primary">Role</Label>
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as UserRole)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
