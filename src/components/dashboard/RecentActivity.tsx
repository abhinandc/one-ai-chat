import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MessageSquare,
  Bot,
  Zap,
  BookOpen,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ActivityEvent } from '@/hooks/useSupabaseData';

/**
 * RecentActivity - Dashboard activity feed
 *
 * Uses shadcn-ui Card with proper typography components
 * per hardUIrules.md MALA theme specification
 */

interface RecentActivityProps {
  activities: ActivityEvent[];
  loading?: boolean;
  onViewAll?: () => void;
  className?: string;
}

const actionIcons: Record<string, React.ElementType> = {
  message_sent: MessageSquare,
  conversation_created: MessageSquare,
  conversation_loaded: MessageSquare,
  agent_created: Bot,
  agent_updated: Bot,
  automation_run: Zap,
  prompt_used: BookOpen,
  settings_updated: Settings,
};

const actionColors: Record<string, string> = {
  message_sent: 'text-primary bg-primary/10',
  conversation_created: 'text-green-600 bg-green-500/10',
  conversation_loaded: 'text-primary bg-primary/10',
  agent_created: 'text-purple-600 bg-purple-500/10',
  agent_updated: 'text-purple-600 bg-purple-500/10',
  automation_run: 'text-orange-600 bg-orange-500/10',
  prompt_used: 'text-green-600 bg-green-500/10',
  settings_updated: 'text-muted-foreground bg-muted',
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentActivity({
  activities,
  loading = false,
  onViewAll,
  className,
}: RecentActivityProps) {
  const navigate = useNavigate();

  const handleActivityClick = (activity: ActivityEvent) => {
    const metadata = activity.metadata as Record<string, unknown> | null;

    if (activity.action.includes('conversation') || activity.action.includes('message')) {
      const conversationId = metadata?.conversationId || metadata?.conversation_id;
      if (conversationId) {
        navigate(`/chat?conversation=${conversationId}`);
      } else {
        navigate('/chat');
      }
    } else if (activity.action.includes('agent')) {
      navigate('/agents');
    } else if (activity.action.includes('automation')) {
      navigate('/automations');
    } else if (activity.action.includes('prompt')) {
      navigate('/prompts');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle as="h3" className="text-lg font-semibold">Recent Activity</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
            <ArrowRight className="size-4 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">No recent activity</p>
            <p className="text-xs text-muted-foreground mb-4">
              Start chatting or create an agent to see your activity here
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/chat')}
            >
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => {
              const Icon = actionIcons[activity.action] || Zap;
              const colorClass = actionColors[activity.action] || 'text-primary bg-primary/10';
              const [textColor, bgColor] = colorClass.split(' ');

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0", bgColor)}>
                    <Icon className={cn("size-4", textColor)} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {formatActionLabel(activity.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
