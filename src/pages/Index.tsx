import { Link } from "react-router-dom";
import { MessageSquare, Bot, Workflow, Play, BarChart, Zap } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const quickActions = [
    {
      icon: MessageSquare,
      title: "Start New Chat",
      description: "Begin a conversation with AI models",
      href: "/chat",
      color: "text-accent-blue"
    },
    {
      icon: Bot,
      title: "Create Agent",
      description: "Build custom AI agents for your workflows",
      href: "/agents",
      color: "text-accent-green"
    },
    {
      icon: Workflow,
      title: "Setup Automation",
      description: "Configure triggers and automated workflows",
      href: "/automations",
      color: "text-accent-orange"
    },
    {
      icon: Play,
      title: "Open Playground",
      description: "Test and experiment with AI models",
      href: "/playground",
      color: "text-accent-blue"
    }
  ];

  const stats = [
    { label: "Conversations", value: "24", change: "+12%" },
    { label: "Agents Created", value: "8", change: "+3%" },
    { label: "Automations", value: "15", change: "+25%" },
    { label: "API Calls", value: "1.2k", change: "+8%" }
  ];

  return (
    <div className="min-h-full bg-background p-lg">
      <div className="max-w-7xl mx-auto space-y-xl">
        {/* Welcome Header */}
        <div className="space-y-md">
          <h1 className="text-3xl font-semibold text-text-primary font-display">
            Welcome back
          </h1>
          <p className="text-lg text-text-secondary">
            Your AI workspace is ready. Start building intelligent workflows.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-lg">
              <div className="space-y-sm">
                <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                <div className="flex items-end gap-sm">
                  <span className="text-2xl font-semibold text-text-primary">{stat.value}</span>
                  <span className="text-sm text-accent-green font-medium">{stat.change}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-lg">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} to={action.href} className="group">
                  <GlassCard className="h-full p-lg hover-lift group-hover:border-accent-blue/50 transition-all duration-normal">
                    <div className="space-y-md">
                      <div className={`p-md bg-surface-graphite rounded-xl w-fit ${action.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary mb-sm">{action.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-lg">Recent Activity</h2>
          <GlassCard>
            <GlassCardContent className="p-lg">
              <div className="space-y-lg">
                <div className="flex items-center gap-lg p-lg bg-surface-graphite rounded-xl">
                  <div className="p-md bg-accent-blue/10 rounded-xl">
                    <MessageSquare className="h-5 w-5 text-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">New chat session started</p>
                    <p className="text-xs text-text-tertiary">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-lg p-lg bg-surface-graphite rounded-xl">
                  <div className="p-md bg-accent-green/10 rounded-xl">
                    <Bot className="h-5 w-5 text-accent-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">Agent "Content Creator" deployed</p>
                    <p className="text-xs text-text-tertiary">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-lg p-lg bg-surface-graphite rounded-xl">
                  <div className="p-md bg-accent-orange/10 rounded-xl">
                    <Zap className="h-5 w-5 text-accent-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">Automation workflow completed</p>
                    <p className="text-xs text-text-tertiary">3 hours ago</p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Getting Started */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-accent-blue" />
              Getting Started
            </GlassCardTitle>
            <GlassCardDescription>
              Complete these steps to unlock the full potential of OneAI
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">Connect Data Sources</div>
                  <div className="text-sm text-text-secondary">Link your tools and databases</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">Train Custom Agent</div>
                  <div className="text-sm text-text-secondary">Create your first specialized AI agent</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">Setup Notifications</div>
                  <div className="text-sm text-text-secondary">Configure alerts and webhooks</div>
                </div>
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
};

export default Index;
