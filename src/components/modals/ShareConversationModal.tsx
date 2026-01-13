import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { conversationService } from "@/services/conversationService";
import { Share2, Copy, Check, Link2, Lock, Globe, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle: string;
  userEmail: string;
}

export function ShareConversationModal({
  open,
  onOpenChange,
  conversationId,
  conversationTitle,
  userEmail,
}: ShareConversationModalProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [privacy, setPrivacy] = useState<"private" | "link" | "public">("link");
  const [expiresInDays, setExpiresInDays] = useState<string>("never");
  const [loading, setLoading] = useState(false);

  // Check if conversation is already shared
  useEffect(() => {
    const checkExistingShare = async () => {
      try {
        const sharedConvs = await conversationService.getUserSharedConversations(userEmail);
        const existing = sharedConvs.find(sc => sc.conversation_id === conversationId);
        if (existing) {
          setShareToken(existing.share_token);
          setShareUrl(`${window.location.origin}/share/${existing.share_token}`);
          setPrivacy(existing.privacy);
        }
      } catch (error) {
        console.error("Failed to check existing share:", error);
      }
    };

    if (open) {
      checkExistingShare();
    }
  }, [open, conversationId, userEmail]);

  const handleShare = async () => {
    setSharing(true);

    try {
      const expiryDays = expiresInDays === "never" ? undefined : parseInt(expiresInDays);
      const result = await conversationService.shareConversation(
        conversationId,
        userEmail,
        privacy,
        expiryDays
      );

      setShareUrl(result.shareUrl);
      setShareToken(result.shareToken);

      toast({
        title: "Conversation Shared",
        description: "Your shareable link has been generated",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      toast({
        title: "Sharing Failed",
        description: error instanceof Error ? error.message : "Failed to share conversation",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleUpdatePrivacy = async (newPrivacy: "private" | "link" | "public") => {
    if (!shareToken) return;

    setLoading(true);
    try {
      await conversationService.updateSharePrivacy(shareToken, newPrivacy);
      setPrivacy(newPrivacy);

      toast({
        title: "Privacy Updated",
        description: `Share privacy set to ${newPrivacy}`,
      });
    } catch (error) {
      console.error("Failed to update privacy:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update privacy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    if (!shareToken) return;

    setLoading(true);
    try {
      await conversationService.unshareConversation(shareToken);
      setShareUrl(null);
      setShareToken(null);
      setPrivacy("link");

      toast({
        title: "Conversation Unshared",
        description: "The share link has been deleted",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to unshare:", error);
      toast({
        title: "Unshare Failed",
        description: error instanceof Error ? error.message : "Failed to unshare conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-primary" />
            Share Conversation
          </DialogTitle>
          <DialogDescription>
            Generate a shareable link for "{conversationTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy Setting */}
          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy Level</Label>
            <Select
              value={privacy}
              onValueChange={(value) => {
                if (shareToken) {
                  handleUpdatePrivacy(value as "private" | "link" | "public");
                } else {
                  setPrivacy(value as "private" | "link" | "public");
                }
              }}
              disabled={loading}
            >
              <SelectTrigger id="privacy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    <span>Private - Only you</span>
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link2 className="size-4" />
                    <span>Link - Anyone with link</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4" />
                    <span>Public - Listed publicly</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {privacy === "private" && "Only you can access this conversation"}
              {privacy === "link" && "Anyone with the link can view this conversation"}
              {privacy === "public" && "Conversation will be listed in public gallery"}
            </p>
          </div>

          {/* Expiration Setting */}
          {!shareToken && (
            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiration</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Share URL Display */}
          {shareUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="share-url">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-2 border-t">
          {shareToken ? (
            <>
              <Button
                variant="destructive"
                onClick={handleUnshare}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Unshare
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={sharing} className="gap-2">
                {sharing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Share2 className="size-4" />
                )}
                Generate Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
