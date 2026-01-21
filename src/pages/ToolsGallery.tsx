import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, Plus, ThumbsUp, Clock, CheckCircle, XCircle,
  AlertCircle, Cpu, Wrench, ChevronDown, User, Users, Trash2, Edit,
  ArrowUpCircle, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { aiGalleryService, AIGalleryRequest, NewRequestData } from "@/services/aiGalleryService";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type RequestType = 'model' | 'tool';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'under_review';
type ViewMode = 'all' | 'mine';

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
  under_review: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Under Review' },
  approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejected' },
};

const urgencyConfig = {
  low: { color: 'text-muted-foreground', label: 'Low' },
  normal: { color: 'text-foreground', label: 'Normal' },
  high: { color: 'text-amber-500', label: 'High' },
  critical: { color: 'text-red-500', label: 'Critical' },
};

export default function ToolsGallery() {
  const [requests, setRequests] = useState<AIGalleryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestType, setRequestType] = useState<RequestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<RequestType>('model');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [requestToReview, setRequestToReview] = useState<AIGalleryRequest | null>(null);

  // Form state
  const [formData, setFormData] = useState<NewRequestData>({
    request_type: 'model',
    name: '',
    description: '',
    justification: '',
    use_case: '',
    urgency: 'normal',
    team_impact: '',
    estimated_usage: '',
    alternatives_considered: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const user = useCurrentUser();

  const loadRequests = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [requestsData, adminStatus] = await Promise.all([
        viewMode === 'mine'
          ? aiGalleryService.getMyRequests(user.email)
          : aiGalleryService.getRequests(user.email, {
              requestType: requestType === 'all' ? undefined : requestType,
              status: statusFilter === 'all' ? undefined : statusFilter
            }),
        aiGalleryService.isAdmin(user.email)
      ]);

      setRequests(requestsData);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast({
        title: "Failed to load requests",
        description: "Could not fetch requests from the database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, viewMode, requestType, statusFilter, toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSubmitRequest = async () => {
    if (!user?.email) return;
    if (!formData.name || !formData.description || !formData.justification) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, description, and justification.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const requestId = await aiGalleryService.submitRequest(user.email, {
        ...formData,
        request_type: createType
      });

      if (requestId) {
        toast({
          title: "Request submitted",
          description: `Your ${createType} request has been submitted for review.`,
        });
        setCreateModalOpen(false);
        resetForm();
        loadRequests();
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast({
        title: "Failed to submit",
        description: "Could not submit your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (requestId: string) => {
    if (!user?.email) return;

    const newCount = await aiGalleryService.toggleUpvote(requestId, user.email);
    if (newCount !== null) {
      setRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          return {
            ...r,
            upvotes: newCount,
            user_has_upvoted: !r.user_has_upvoted
          };
        }
        return r;
      }));
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    setRequestToDelete(requestId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete || !user?.email) return;

    const success = await aiGalleryService.deleteRequest(user.email, requestToDelete);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== requestToDelete));
      toast({
        title: "Request deleted",
        description: "Your request has been removed.",
      });
    } else {
      toast({
        title: "Failed to delete",
        description: "Could not delete the request.",
        variant: "destructive"
      });
    }
    setRequestToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleReviewRequest = async (status: 'approved' | 'rejected' | 'under_review', notes?: string) => {
    if (!requestToReview || !user?.email) return;

    const success = await aiGalleryService.reviewRequest(
      user.email,
      requestToReview.id,
      status,
      notes
    );

    if (success) {
      toast({
        title: `Request ${status}`,
        description: `The request has been marked as ${status}.`,
      });
      loadRequests();
    } else {
      toast({
        title: "Failed to review",
        description: "Could not update the request status.",
        variant: "destructive"
      });
    }
    setReviewModalOpen(false);
    setRequestToReview(null);
  };

  const resetForm = () => {
    setFormData({
      request_type: 'model',
      name: '',
      description: '',
      justification: '',
      use_case: '',
      urgency: 'normal',
      team_impact: '',
      estimated_usage: '',
      alternatives_considered: ''
    });
  };

  const openCreateModal = (type: RequestType) => {
    setCreateType(type);
    resetForm();
    setCreateModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AI Gallery</h1>
              <p className="text-muted-foreground">Request access to new models and AI tools</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => openCreateModal('tool')}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Request Tool
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => openCreateModal('model')}
              >
                <Cpu className="h-4 w-4 mr-2" />
                Request Model
              </Button>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                All Requests
              </TabsTrigger>
              <TabsTrigger value="mine" className="gap-2">
                <User className="h-4 w-4" />
                My Requests
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <GlassInput
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  variant="search"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Type: {requestType === 'all' ? 'All' : requestType === 'model' ? 'Models' : 'Tools'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRequestType('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRequestType('model')}>Models</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRequestType('tool')}>Tools</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Status: {statusFilter === 'all' ? 'All' : statusConfig[statusFilter]?.label}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('under_review')}>Under Review</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="text-center py-12">
              <Cpu className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-foreground mb-2">Loading requests...</h3>
              <p className="text-muted-foreground">Fetching data from database</p>
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
              <p className="text-muted-foreground mb-4">
                {requests.length === 0
                  ? "Be the first to request a new model or tool!"
                  : "Try adjusting your search or filters"
                }
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => openCreateModal('tool')}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Request Tool
                </Button>
                <Button onClick={() => openCreateModal('model')}>
                  <Cpu className="h-4 w-4 mr-2" />
                  Request Model
                </Button>
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RequestCard
                    request={request}
                    onUpvote={handleUpvote}
                    onDelete={handleDeleteRequest}
                    onReview={isAdmin ? (r) => { setRequestToReview(r); setReviewModalOpen(true); } : undefined}
                    formatDate={formatDate}
                    currentUserEmail={user?.email}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>

      {/* Create Request Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {createType === 'model' ? <Cpu className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
              Request {createType === 'model' ? 'Model' : 'Tool'} Access
            </DialogTitle>
            <DialogDescription>
              Submit a request for a new {createType === 'model' ? 'AI model' : 'AI tool'}.
              Requests with clear justifications and business value are prioritized.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{createType === 'model' ? 'Model Name' : 'Tool Name'} *</Label>
              <GlassInput
                id="name"
                placeholder={createType === 'model' ? 'e.g., GPT-4 Turbo, Claude 3 Opus' : 'e.g., GitHub Copilot, Cursor'}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder={`Describe what this ${createType} does and its key features...`}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Business Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Why do you need access to this? How will it benefit your work or the team?"
                value={formData.justification}
                onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, urgency: v as NewRequestData['urgency'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_usage">Estimated Usage</Label>
                <GlassInput
                  id="estimated_usage"
                  placeholder="e.g., Daily, Weekly, Monthly"
                  value={formData.estimated_usage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_usage: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="use_case">Primary Use Case</Label>
              <Textarea
                id="use_case"
                placeholder="Describe your primary use case in detail..."
                value={formData.use_case || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, use_case: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_impact">Team Impact</Label>
              <GlassInput
                id="team_impact"
                placeholder="How many people will use this? Which teams?"
                value={formData.team_impact || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, team_impact: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternatives">Alternatives Considered</Label>
              <Textarea
                id="alternatives"
                placeholder="What alternatives have you considered? Why is this the best option?"
                value={formData.alternatives_considered || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, alternatives_considered: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Review Modal */}
      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        request={requestToReview}
        onReview={handleReviewRequest}
      />
    </div>
  );
}

function RequestCard({
  request,
  onUpvote,
  onDelete,
  onReview,
  formatDate,
  currentUserEmail
}: {
  request: AIGalleryRequest;
  onUpvote: (id: string) => void;
  onDelete: (id: string) => void;
  onReview?: (request: AIGalleryRequest) => void;
  formatDate: (date: string) => string;
  currentUserEmail?: string;
}) {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;
  const urgency = urgencyConfig[request.urgency];
  const isOwn = request.is_own_request || request.user_email === currentUserEmail;
  const canDelete = isOwn && request.status === 'pending';

  return (
    <GlassCard className="p-5 hover:border-primary/30 transition-all duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              request.request_type === 'model' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'
            )}>
              {request.request_type === 'model' ? <Cpu className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{request.name}</h3>
              <p className="text-xs text-muted-foreground">
                {request.request_type === 'model' ? 'Model Request' : 'Tool Request'}
                {isOwn && <span className="ml-1">(yours)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-xs", status.bg, status.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

        {request.justification && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <span className="font-medium">Justification:</span> {request.justification.substring(0, 150)}
            {request.justification.length > 150 && '...'}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-xs", urgency.color)}>
            {urgency.label} Priority
          </Badge>
          {request.team_impact && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {request.team_impact}
            </Badge>
          )}
          {request.estimated_usage && (
            <Badge variant="outline" className="text-xs">
              {request.estimated_usage}
            </Badge>
          )}
        </div>

        {request.admin_notes && request.status !== 'pending' && (
          <div className="text-xs p-2 rounded bg-muted/50 border-l-2 border-primary">
            <span className="font-medium">Admin Notes:</span> {request.admin_notes}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote(request.id)}
              className={cn(
                "gap-1 h-8",
                request.user_has_upvoted && "text-primary"
              )}
            >
              <ThumbsUp className={cn("h-4 w-4", request.user_has_upvoted && "fill-current")} />
              <span>{request.upvotes}</span>
            </Button>
            <span className="text-xs text-muted-foreground">{formatDate(request.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(request.id)}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onReview && request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview(request)}
                className="h-8"
              >
                Review
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ReviewModal({
  open,
  onOpenChange,
  request,
  onReview
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AIGalleryRequest | null;
  onReview: (status: 'approved' | 'rejected' | 'under_review', notes?: string) => void;
}) {
  const [notes, setNotes] = useState('');

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Request</DialogTitle>
          <DialogDescription>
            Review and approve or reject this {request.request_type} request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">{request.name}</h4>
            <p className="text-sm text-muted-foreground">{request.description}</p>
            <div className="text-sm">
              <span className="font-medium">Justification:</span> {request.justification}
            </div>
            {request.use_case && (
              <div className="text-sm">
                <span className="font-medium">Use Case:</span> {request.use_case}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Requested by: {request.user_email}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin_notes"
              placeholder="Add notes about your decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => onReview('under_review', notes)}
            className="text-blue-500 border-blue-500 hover:bg-blue-500/10"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Under Review
          </Button>
          <Button
            variant="outline"
            onClick={() => onReview('rejected', notes)}
            className="text-red-500 border-red-500 hover:bg-red-500/10"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => onReview('approved', notes)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
