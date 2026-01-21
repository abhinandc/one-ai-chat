import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/GlassInput";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus, Users, Loader2 } from "lucide-react";
import { PromptShare } from "@/services/promptService";

interface SharePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptTitle: string;
  shares: PromptShare[];
  onShare: (email: string, canEdit: boolean) => Promise<void>;
  onUnshare: (email: string) => Promise<void>;
  loading?: boolean;
}

export function SharePromptModal({
  open,
  onOpenChange,
  promptTitle,
  shares,
  onShare,
  onUnshare,
  loading
}: SharePromptModalProps) {
  const [email, setEmail] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCanEdit(false);
    }
  }, [open]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSharing(true);
    try {
      await onShare(email.trim(), canEdit);
      setEmail("");
      setCanEdit(false);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemove = async (shareEmail: string) => {
    setRemovingEmail(shareEmail);
    try {
      await onUnshare(shareEmail);
    } finally {
      setRemovingEmail(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-accent-blue" />
            Share Prompt
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Share "{promptTitle}" with other employees
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-email" className="text-text-primary">
              Employee Email
            </Label>
            <div className="flex gap-2">
              <GlassInput
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-accent-blue hover:bg-accent-blue/90"
                disabled={!email.trim() || isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border-primary">
            <div>
              <Label htmlFor="can-edit" className="text-text-primary font-medium">
                Allow Editing
              </Label>
              <p className="text-xs text-text-secondary mt-0.5">
                Let them modify the prompt content
              </p>
            </div>
            <Switch
              id="can-edit"
              checked={canEdit}
              onCheckedChange={setCanEdit}
            />
          </div>
        </form>

        <div className="space-y-2">
          <Label className="text-text-primary text-sm">
            Shared With ({shares.length})
          </Label>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4 text-center">
              Not shared with anyone yet
            </p>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border-primary"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-accent-blue">
                        {share.shared_with.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {share.shared_with}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {share.can_edit ? "Can edit" : "View only"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(share.shared_with)}
                    disabled={removingEmail === share.shared_with}
                    className="flex-shrink-0 text-text-tertiary hover:text-destructive"
                  >
                    {removingEmail === share.shared_with ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
