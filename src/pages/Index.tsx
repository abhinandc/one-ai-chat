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
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-text-primary tracking-tight">
              Welcome back
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Your AI workspace is ready. Start building intelligent workflows.
            </p>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="text-3xl font-bold text-text-primary tabular-nums">
                  {stat.value}
                </div>
                <div className="text-sm text-text-secondary">
                  {stat.label}
                </div>
                <div className="text-xs text-accent-green font-semibold">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">
              Quick Actions
            </h2>
            <p className="text-text-secondary">
              Jump into your most-used tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} to={action.href} className="group">
                  <GlassCard className="p-8 hover-lift transition-all duration-300 hover:border-accent-blue/30">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 bg-surface-graphite rounded-2xl ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors duration-300">
                          {action.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
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
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">
              Recent Activity
            </h2>
            <p className="text-text-secondary">
              Latest updates from your workspace
            </p>
          </div>
          
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-graphite/50 transition-colors duration-200">
                <div className="p-3 bg-accent-blue/10 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-accent-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    New chat session started
                  </p>
                  <p className="text-sm text-text-tertiary">
                    2 minutes ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-graphite/50 transition-colors duration-200">
                <div className="p-3 bg-accent-green/10 rounded-xl">
                  <Bot className="h-5 w-5 text-accent-green" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    Agent "Content Creator" deployed
                  </p>
                  <p className="text-sm text-text-tertiary">
                    1 hour ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-graphite/50 transition-colors duration-200">
                <div className="p-3 bg-accent-orange/10 rounded-xl">
                  <Zap className="h-5 w-5 text-accent-orange" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    Automation workflow completed
                  </p>
                  <p className="text-sm text-text-tertiary">
                    3 hours ago
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Getting Started */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <BarChart className="h-12 w-12 text-accent-blue mx-auto" />
            <h2 className="text-2xl font-semibold text-text-primary">
              Getting Started
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Complete these essential steps to unlock the full potential of OneAI
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Connect Data Sources", desc: "Link your tools and databases" },
              { title: "Train Custom Agent", desc: "Create your first specialized AI agent" },
              { title: "Setup Notifications", desc: "Configure alerts and webhooks" }
            ].map((step, index) => (
              <GlassCard key={step.title} className="p-6 hover-lift transition-all duration-300 hover:border-accent-blue/30">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center mx-auto">
                    <div className="w-6 h-6 bg-accent-blue rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Index;
