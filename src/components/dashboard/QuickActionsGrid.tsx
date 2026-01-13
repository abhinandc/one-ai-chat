import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bot,
  Zap,
  BookOpen,
  ArrowRight,
  Sparkles,
  History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * QuickActionsGrid - Dashboard quick action buttons
 *
 * Uses shadcn-ui Card with proper typography components
 * per hardUIrules.md MALA theme specification
 */
interface QuickAction {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
}

const defaultActions: QuickAction[] = [
  {
    icon: MessageSquare,
    title: 'Start Chat',
    description: 'Begin a new AI conversation',
    href: '/chat',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Bot,
    title: 'Build Agent',
    description: 'Create custom workflow agent',
    href: '/agents',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: BookOpen,
    title: 'Prompts',
    description: 'Browse prompt library',
    href: '/prompts',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Zap,
    title: 'Automations',
    description: 'View your automations',
    href: '/automations',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
];

interface QuickActionsGridProps {
  actions?: QuickAction[];
  recentConversation?: {
    id: string;
    title: string;
  };
  favoritePrompt?: {
    id: string;
    title: string;
  };
  className?: string;
}

export function QuickActionsGrid({
  actions = defaultActions,
  recentConversation,
  favoritePrompt,
  className,
}: QuickActionsGridProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.href}
              variant="interactive"
              className="group"
              onClick={() => navigate(action.href)}
            >
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0", action.bgColor)}>
                  <Icon className={cn("size-5", action.color)} />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <CardTitle as="h3" className="text-base font-semibold group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-sm truncate">
                    {action.description}
                  </CardDescription>
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Secondary Quick Access */}
      {(recentConversation || favoritePrompt) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentConversation && (
            <Card
              variant="interactive"
              className="group"
              onClick={() => navigate(`/chat?conversation=${recentConversation.id}`)}
            >
              <CardHeader className="flex-row items-center gap-3 space-y-0 py-4">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
                  <History className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <CardDescription className="text-xs">Resume last chat</CardDescription>
                  <CardTitle as="h4" className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {recentConversation.title}
                  </CardTitle>
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardHeader>
            </Card>
          )}

          {favoritePrompt && (
            <Card
              variant="interactive"
              className="group"
              onClick={() => navigate(`/prompts?id=${favoritePrompt.id}`)}
            >
              <CardHeader className="flex-row items-center gap-3 space-y-0 py-4">
                <div className="flex items-center justify-center size-8 rounded-lg bg-orange-500/10 shrink-0">
                  <Sparkles className="size-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <CardDescription className="text-xs">Favorite prompt</CardDescription>
                  <CardTitle as="h4" className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {favoritePrompt.title}
                  </CardTitle>
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
