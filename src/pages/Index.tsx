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
    <div className="min-h-full bg-animated overflow-y-auto" style={{ backgroundSize: '400% 400%' }}>
      <div className="max-w-7xl mx-auto space-y-xl p-lg">
        {/* Welcome Header */}
        <div className="space-y-md text-center">
          <h1 className="text-4xl font-bold text-text-primary font-display bg-gradient-primary bg-clip-text text-transparent animate-glow-pulse">
            Welcome back
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Your AI workspace is ready. Start building intelligent workflows.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {stats.map((stat) => (
            <GlassCard key={stat.label} className="p-lg hover-lift glow-primary group">
              <div className="space-y-sm">
                <p className="text-sm text-text-secondary font-medium group-hover:text-text-primary transition-colors duration-normal">{stat.label}</p>
                <div className="flex items-end gap-sm">
                  <span className="text-3xl font-bold text-text-primary group-hover:text-accent-blue transition-colors duration-normal">{stat.value}</span>
                  <span className="text-sm text-accent-green font-semibold animate-gentle-bounce">{stat.change}</span>
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
                  <GlassCard className="h-full p-lg hover-lift glow-accent group-hover:border-accent-blue/50 group-hover:shadow-2xl transition-all duration-normal">
                    <div className="space-y-md">
                      <div className={`p-md bg-gradient-surface rounded-xl w-fit ${action.color} group-hover:scale-110 transition-transform duration-normal`}>
                        <Icon className="h-6 w-6 group-hover:animate-gentle-bounce" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary mb-sm group-hover:text-accent-blue transition-colors duration-normal">{action.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors duration-normal">
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
          <h2 className="text-2xl font-bold text-text-primary mb-lg">Recent Activity</h2>
          <GlassCard className="glow-primary">
            <GlassCardContent className="p-lg">
              <div className="space-y-md -m-lg p-lg">
                <div className="flex items-center gap-md p-md bg-gradient-surface rounded-xl hover-lift group cursor-pointer">
                  <div className="p-sm bg-accent-blue/20 rounded-lg group-hover:bg-accent-blue/30 transition-colors duration-normal">
                    <MessageSquare className="h-5 w-5 text-accent-blue group-hover:animate-gentle-bounce" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-blue transition-colors duration-normal">New chat session started</p>
                    <p className="text-xs text-text-tertiary">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-md p-md bg-gradient-surface rounded-xl hover-lift group cursor-pointer">
                  <div className="p-sm bg-accent-green/20 rounded-lg group-hover:bg-accent-green/30 transition-colors duration-normal">
                    <Bot className="h-5 w-5 text-accent-green group-hover:animate-gentle-bounce" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-green transition-colors duration-normal">Agent "Content Creator" deployed</p>
                    <p className="text-xs text-text-tertiary">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-md p-md bg-gradient-surface rounded-xl hover-lift group cursor-pointer">
                  <div className="p-sm bg-accent-orange/20 rounded-lg group-hover:bg-accent-orange/30 transition-colors duration-normal">
                    <Zap className="h-5 w-5 text-accent-orange group-hover:animate-gentle-bounce" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-orange transition-colors duration-normal">Automation workflow completed</p>
                    <p className="text-xs text-text-tertiary">3 hours ago</p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Getting Started */}
        <GlassCard variant="elevated" className="glow-accent">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-2xl">
              <BarChart className="h-6 w-6 text-accent-blue animate-gentle-bounce" />
              Getting Started
            </GlassCardTitle>
            <GlassCardDescription className="text-lg">
              Complete these steps to unlock the full potential of OneAI
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <Button variant="glass" className="justify-start h-auto py-lg hover:glow-primary">
                <div className="text-left">
                  <div className="font-semibold">Connect Data Sources</div>
                  <div className="text-sm text-text-secondary">Link your tools and databases</div>
                </div>
              </Button>
              <Button variant="glass" className="justify-start h-auto py-lg hover:glow-accent">
                <div className="text-left">
                  <div className="font-semibold">Train Custom Agent</div>
                  <div className="text-sm text-text-secondary">Create your first specialized AI agent</div>
                </div>
              </Button>
              <Button variant="glow" className="justify-start h-auto py-lg">
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
