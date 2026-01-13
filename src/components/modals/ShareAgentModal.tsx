import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Users, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AppUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface ShareAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  currentUserId: string;
  currentSharedWith: string[];
  onShare: (userIds: string[]) => Promise<void>;
}

export function ShareAgentModal({
  open,
  onOpenChange,
  agentId,
  agentName,
  currentUserId,
  currentSharedWith,
  onShare
}: ShareAgentModalProps) {
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(currentSharedWith);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedUserIds(currentSharedWith);
      loadUsers();
    }
  }, [open, currentSharedWith]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch users from auth.users via Supabase Auth Admin API
      // Since we can't directly query auth.users from client, we'll use app_users
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, display_name, avatar_url')
        .neq('id', currentUserId) // Exclude current user
        .order('email');

      if (error) {
        console.error('Failed to load users:', error);
        return;
      }

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onShare(selectedUserIds);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to share agent:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sharedUsers = availableUsers.filter(user => selectedUserIds.includes(user.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share Agent
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share "{agentName}" with team members. They will have read-only access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Currently shared users */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Shared with ({sharedUsers.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {sharedUsers.map(user => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 pl-2 pr-1"
                  >
                    <span className="text-xs">{user.display_name || user.email}</span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search users */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Add team members
            </Label>
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto border border-border-primary rounded-lg">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 'No users found' : 'No other users available'}
              </div>
            ) : (
              <div className="divide-y divide-border-primary">
                {filteredUsers.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={cn(
                        "w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors text-left",
                        isSelected && "bg-accent/50"
                      )}
                      type="button"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name || user.email}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {(user.display_name || user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground truncate">
                            {user.display_name || user.email}
                          </div>
                          {user.display_name && (
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Sharing...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
