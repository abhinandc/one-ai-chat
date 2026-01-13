import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { conversationService } from "@/services/conversationService";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import {
  Share2,
  Eye,
  Calendar,
  Brain,
  AlertCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface SharedConversationData {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  privacy: string;
  view_count: number;
  created_at: string;
  expires_at: string | null;
}

export default function SharedConversation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<SharedConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedConversation = async () => {
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const data = await conversationService.getSharedConversation(token);
        setConversation(data);
      } catch (err) {
        console.error("Failed to load shared conversation:", err);
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    loadSharedConversation();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-4"
        >
          <div className="size-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            {error?.includes("expired") ? (
              <Lock className="size-10 text-destructive" />
            ) : (
              <AlertCircle className="size-10 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {error?.includes("expired") ? "Link Expired" : "Conversation Not Found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || "This conversation is not available or has been removed."}
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="size-4" />
            Go to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Share2 className="size-4" />
              <span>Shared Conversation</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Conversation Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {conversation.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Brain className="size-4" />
                <span className="font-medium">{conversation.model}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>{new Date(conversation.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <span>{conversation.view_count} views</span>
              </div>
            </div>

            {/* Expiration Notice */}
            {conversation.expires_at && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  This link expires on{" "}
                  {new Date(conversation.expires_at).toLocaleDateString()}
                </span>
              </motion.div>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-6">
            {conversation.messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden",
                    message.role === "user"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center text-sm font-semibold",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {message.role === "user" ? "U" : "AI"}
                        </div>
                        <span className="font-medium text-foreground">
                          {message.role === "user" ? "User" : "Assistant"}
                        </span>
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Want to create your own AI conversations?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join OneEdge to access multiple AI models and manage your conversations
            </p>
            <Button onClick={() => navigate("/")} size="lg" className="gap-2">
              Get Started
              <ArrowLeft className="size-4 rotate-180" />
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
