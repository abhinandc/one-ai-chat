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
    <div className="min-h-full bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-text-primary font-display">
            Welcome back
          </h1>
          <p className="text-lg text-text-secondary font-medium">
            Your AI workspace is ready. Start building intelligent workflows.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-6 hover-lift group">
              <div className="space-y-3">
                <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
                  <span className="text-sm text-accent-green font-semibold">{stat.change}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} to={action.href} className="group">
                  <GlassCard className="h-full p-6 hover-lift group-hover:border-accent-blue/30 transition-all duration-normal">
                    <div className="space-y-4">
                      <div className={`p-3 bg-surface-graphite rounded-xl w-fit ${action.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary mb-2">{action.title}</h3>
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
          <h2 className="text-xl font-semibold text-text-primary mb-6">Recent Activity</h2>
          <GlassCard>
            <GlassCardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-surface-graphite rounded-xl">
                  <div className="p-2 bg-accent-blue/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">New chat session started</p>
                    <p className="text-xs text-text-tertiary">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-surface-graphite rounded-xl">
                  <div className="p-2 bg-accent-green/10 rounded-lg">
                    <Bot className="h-5 w-5 text-accent-green" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">Agent "Content Creator" deployed</p>
                    <p className="text-xs text-text-tertiary">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-surface-graphite rounded-xl">
                  <div className="p-2 bg-accent-orange/10 rounded-lg">
                    <Zap className="h-5 w-5 text-accent-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">Automation workflow completed</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="text-left">
                  <div className="font-semibold">Connect Data Sources</div>
                  <div className="text-sm text-text-secondary">Link your tools and databases</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="text-left">
                  <div className="font-semibold">Train Custom Agent</div>
                  <div className="text-sm text-text-secondary">Create your first specialized AI agent</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4">
                <div className="text-left">
                  <div className="font-semibold">Setup Notifications</div>
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
