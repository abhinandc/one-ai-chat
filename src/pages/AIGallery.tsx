import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Cpu,
  Wrench,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAIGallery } from '@/hooks/useAIGallery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { AIGalleryRequest, RequestType, RequestStatus } from '@/services/aiGalleryService';

const statusFilters = ['all', 'pending', 'approved', 'rejected'] as const;

export default function AIGallery() {
  const [activeTab, setActiveTab] = useState<'models' | 'tools'>('models');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [newRequest, setNewRequest] = useState({
    name: '',
    description: '',
    justification: '',
  });

  const { toast } = useToast();
  const user = useCurrentUser();
  const {
    modelRequests,
    toolRequests,
    loading,
    error,
    createRequest,
    deleteRequest,
  } = useAIGallery(user?.id);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.name.trim() || !newRequest.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRequest({
        request_type: activeTab === 'models' ? 'model' : 'tool',
        name: newRequest.name,
        description: newRequest.description,
        justification: newRequest.justification || undefined,
      });

      toast({
        title: 'Request Submitted',
        description: `Your ${activeTab === 'models' ? 'model' : 'tool'} request has been submitted for review.`,
      });

      setNewRequest({ name: '', description: '', justification: '' });
      setCreateModalOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to Submit',
        description: err instanceof Error ? err.message : 'Failed to submit request',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    setRequestToDelete(requestId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      await deleteRequest(requestToDelete);
      toast({
        title: 'Request Deleted',
        description: 'Your request has been deleted.',
      });
    } catch (err) {
      toast({
        title: 'Failed to Delete',
        description: err instanceof Error ? err.message : 'Failed to delete request',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    }
  };

  const filterRequests = (requests: AIGalleryRequest[]) => {
    return requests.filter((request) => {
      const matchesSearch =
        request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredModelRequests = filterRequests(modelRequests);
  const filteredToolRequests = filterRequests(toolRequests);

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-accent-orange" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-accent-green" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-accent-red" />;
      default:
        return <AlertCircle className="h-4 w-4 text-text-tertiary" />;
    }
  };

  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Failed to Load AI Gallery
          </h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                AI Gallery
              </h1>
              <p className="text-text-secondary">
                Request access to new AI models and tools for your workflow
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-accent-blue hover:bg-accent-blue/90"
              data-testid="button-new-request"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'models' | 'tools')}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsList className="bg-surface-secondary">
                <TabsTrigger
                  value="models"
                  className="data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                  data-testid="tab-models"
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  Model Requests ({modelRequests.length})
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  className="data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                  data-testid="tab-tools"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Tool Requests ({toolRequests.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <GlassInput
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    variant="search"
                    data-testid="input-search"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-filter-status">
                      <Filter className="h-4 w-4 mr-2" />
                      Status: {statusFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border-primary">
                    {statusFilters.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className="capitalize"
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-6">
              <TabsContent value="models" className="mt-0">
                <RequestGrid
                  requests={filteredModelRequests}
                  loading={loading}
                  type="model"
                  onDelete={handleDeleteRequest}
                  getStatusIcon={getStatusIcon}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                  formatDate={formatDate}
                  onCreateNew={() => setCreateModalOpen(true)}
                />
              </TabsContent>

              <TabsContent value="tools" className="mt-0">
                <RequestGrid
                  requests={filteredToolRequests}
                  loading={loading}
                  type="tool"
                  onDelete={handleDeleteRequest}
                  getStatusIcon={getStatusIcon}
                  getStatusBadgeVariant={getStatusBadgeVariant}
                  formatDate={formatDate}
                  onCreateNew={() => setCreateModalOpen(true)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Create Request Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Request New {activeTab === 'models' ? 'Model' : 'Tool'}
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              Submit a request for access to a new{' '}
              {activeTab === 'models' ? 'AI model' : 'tool'}. Your request will
              be reviewed by an administrator.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRequest}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-text-primary">
                  {activeTab === 'models' ? 'Model Name' : 'Tool Name'} *
                </Label>
                <GlassInput
                  id="name"
                  value={newRequest.name}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, name: e.target.value })
                  }
                  placeholder={
                    activeTab === 'models'
                      ? 'e.g., Claude 3.5 Sonnet'
                      : 'e.g., GitHub Copilot'
                  }
                  required
                  data-testid="input-request-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-text-primary">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, description: e.target.value })
                  }
                  placeholder="Describe what this model/tool does and its key features..."
                  className="min-h-[100px] bg-surface-graphite border-border-primary text-text-primary"
                  required
                  data-testid="input-request-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="justification" className="text-text-primary">
                  Business Justification
                </Label>
                <Textarea
                  id="justification"
                  value={newRequest.justification}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, justification: e.target.value })
                  }
                  placeholder="Explain why you need access to this model/tool and how it will benefit your work..."
                  className="min-h-[80px] bg-surface-graphite border-border-primary text-text-primary"
                  data-testid="input-request-justification"
                />
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
              <Button
                type="submit"
                className="bg-accent-blue hover:bg-accent-blue/90"
                data-testid="button-submit-request"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot
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

interface RequestGridProps {
  requests: AIGalleryRequest[];
  loading: boolean;
  type: 'model' | 'tool';
  onDelete: (id: string) => void;
  getStatusIcon: (status: RequestStatus) => React.ReactNode;
  getStatusBadgeVariant: (status: RequestStatus) => 'default' | 'secondary' | 'destructive' | 'outline';
  formatDate: (dateString: string) => string;
  onCreateNew: () => void;
}

function RequestGrid({
  requests,
  loading,
  type,
  onDelete,
  getStatusIcon,
  getStatusBadgeVariant,
  formatDate,
  onCreateNew,
}: RequestGridProps) {
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

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {type === 'model' ? (
          <Cpu className="h-16 w-16 text-text-quaternary mb-4" />
        ) : (
          <Wrench className="h-16 w-16 text-text-quaternary mb-4" />
        )}
        <h3 className="text-lg font-medium text-text-primary mb-2">
          No {type} requests yet
        </h3>
        <p className="text-text-secondary mb-4">
          Submit your first request to get started
        </p>
        <Button onClick={onCreateNew} data-testid={`button-create-first-${type}`}>
          <Plus className="h-4 w-4 mr-2" />
          Request {type === 'model' ? 'Model' : 'Tool'}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {requests.map((request) => (
        <GlassCard
          key={request.id}
          className="p-6 hover:border-accent-blue/30 transition-all duration-200"
          data-testid={`card-request-${request.id}`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
                  {type === 'model' ? (
                    <Cpu className="h-6 w-6" />
                  ) : (
                    <Wrench className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {request.name}
                  </h3>
                  <p className="text-sm text-text-secondary capitalize">{type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(request.status)}
                <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                  {request.status}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-text-secondary line-clamp-2">
              {request.description}
            </p>

            {request.justification && (
              <div className="text-xs text-text-tertiary bg-surface-secondary p-2 rounded">
                <strong>Justification:</strong> {request.justification}
              </div>
            )}

            {request.admin_notes && (
              <div
                className={cn(
                  'text-xs p-2 rounded',
                  request.status === 'approved'
                    ? 'bg-accent-green/10 text-accent-green'
                    : request.status === 'rejected'
                    ? 'bg-accent-red/10 text-accent-red'
                    : 'bg-surface-secondary text-text-tertiary'
                )}
              >
                <strong>Admin Notes:</strong> {request.admin_notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-tertiary">
                Submitted {formatDate(request.created_at)}
              </span>
              {request.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(request.id)}
                  className="text-accent-red hover:text-accent-red"
                  data-testid={`button-delete-request-${request.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
