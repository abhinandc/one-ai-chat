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
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-16">
        
        {/* Hero Section - Refined Typography */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-text-primary tracking-tight leading-[1.1]">
              Welcome back
            </h1>
            <div className="w-12 h-0.5 bg-accent-blue rounded-full"></div>
          </div>
          <p className="text-lg text-text-secondary font-medium leading-relaxed max-w-2xl">
            Your AI workspace is ready. Start building intelligent workflows.
          </p>
        </div>

        {/* Metrics Grid - Golden Ratio Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <GlassCard 
              key={stat.label} 
              className="group p-6 hover-lift transition-all duration-500 hover:border-accent-blue/20"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'fade-in 0.6s ease-out forwards'
              }}
            >
              <div className="space-y-3">
                <p className="text-sm text-text-tertiary font-medium tracking-wide uppercase">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-text-primary tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-sm text-accent-green font-semibold bg-accent-green/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Quick Actions - Improved Visual Hierarchy */}
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
              Quick Actions
            </h2>
            <p className="text-text-secondary">Jump into your most-used tools</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link 
                  key={action.href} 
                  to={action.href} 
                  className="group"
                  style={{ 
                    animationDelay: `${(index + 4) * 100}ms`,
                    animation: 'fade-in 0.6s ease-out forwards'
                  }}
                >
                  <GlassCard className="h-full p-8 hover-lift group-hover:border-accent-blue/30 transition-all duration-500 hover:scale-[1.02]">
                    <div className="flex items-start gap-6">
                      <div className={`p-4 bg-surface-graphite rounded-2xl ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors duration-300">
                          {action.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors duration-300">
                          {action.description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity - Streamlined Design */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
                Recent Activity
              </h2>
              <p className="text-text-secondary">Latest updates from your workspace</p>
            </div>
            <Button variant="ghost" className="text-text-tertiary hover:text-text-primary">
              View all
            </Button>
          </div>
          
          <GlassCard className="divide-y divide-border-secondary/50">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-accent-blue/10 rounded-xl group-hover:bg-accent-blue/20 transition-colors duration-300">
                  <MessageSquare className="h-5 w-5 text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    New chat session started
                  </p>
                  <p className="text-xs text-text-tertiary">
                    2 minutes ago
                  </p>
                </div>
                <div className="w-2 h-2 bg-accent-blue rounded-full opacity-60"></div>
              </div>
              
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-accent-green/10 rounded-xl group-hover:bg-accent-green/20 transition-colors duration-300">
                  <Bot className="h-5 w-5 text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    Agent "Content Creator" deployed
                  </p>
                  <p className="text-xs text-text-tertiary">
                    1 hour ago
                  </p>
                </div>
                <div className="w-2 h-2 bg-accent-green rounded-full opacity-60"></div>
              </div>
              
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-accent-orange/10 rounded-xl group-hover:bg-accent-orange/20 transition-colors duration-300">
                  <Zap className="h-5 w-5 text-accent-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    Automation workflow completed
                  </p>
                  <p className="text-xs text-text-tertiary">
                    3 hours ago
                  </p>
                </div>
                <div className="w-2 h-2 bg-accent-orange rounded-full opacity-60"></div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Getting Started - Refined CTA */}
        <div className="relative">
          <GlassCard variant="elevated" className="p-8 border-accent-blue/20">
            <div className="absolute top-0 left-8 w-16 h-1 bg-gradient-to-r from-accent-blue to-accent-blue/50 rounded-b-lg"></div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BarChart className="h-6 w-6 text-accent-blue" />
                <h2 className="text-xl font-semibold text-text-primary">Getting Started</h2>
              </div>
              
              <p className="text-text-secondary leading-relaxed">
                Complete these essential steps to unlock the full potential of OneAI
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Connect Data Sources", desc: "Link your tools and databases" },
                  { title: "Train Custom Agent", desc: "Create your first specialized AI agent" },
                  { title: "Setup Notifications", desc: "Configure alerts and webhooks" }
                ].map((step, index) => (
                  <Button 
                    key={step.title}
                    variant="outline" 
                    className="justify-start h-auto py-6 hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-all duration-300 group"
                    style={{ 
                      animationDelay: `${(index + 8) * 150}ms`,
                      animation: 'fade-in 0.6s ease-out forwards'
                    }}
                  >
                    <div className="text-left space-y-1">
                      <div className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                        {step.title}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {step.desc}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
        
      </div>
    </div>
  );
};

export default Index;
