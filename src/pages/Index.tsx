import { Link } from "react-router-dom";
import { 
  MessageSquare, Bot, Workflow, Play, BarChart, Zap, 
  Sparkles, TrendingUp, Users, Globe, Shield, Cpu,
  Database, Code, Palette, Settings
} from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const primaryFeatures = [
    {
      icon: MessageSquare,
      title: "AI Conversations",
      description: "Engage with advanced AI models for any task or question",
      accent: "blue" as const,
      href: "/chat"
    },
    {
      icon: Bot,
      title: "Custom Agents",
      description: "Build specialized AI agents tailored to your workflow",
      accent: "green" as const,
      href: "/agents"
    },
    {
      icon: Workflow,
      title: "Smart Automations",
      description: "Create powerful workflows that run on autopilot",
      accent: "purple" as const,
      href: "/automations"
    },
    {
      icon: Play,
      title: "AI Playground",
      description: "Experiment and test models in a safe environment",
      accent: "orange" as const,
      href: "/playground"
    }
  ];

  const secondaryFeatures = [
    {
      icon: Code,
      title: "Code Generation",
      description: "Generate, review, and optimize code across languages",
      accent: "cyan" as const
    },
    {
      icon: Database,
      title: "Data Analysis",
      description: "Extract insights from your data with AI assistance", 
      accent: "blue" as const
    },
    {
      icon: Palette,
      title: "Creative Tools",
      description: "Generate content, designs, and creative solutions",
      accent: "purple" as const
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security for your sensitive data",
      accent: "green" as const
    }
  ];

  const metrics = [
    { label: "Active Conversations", value: "2.4k", change: "+18%", trend: "up" as const },
    { label: "Agents Deployed", value: "156", change: "+12%", trend: "up" as const },
    { label: "Automations Running", value: "89", change: "+31%", trend: "up" as const },
    { label: "API Requests Today", value: "12.8k", change: "+7%", trend: "up" as const }
  ];

  const recentActivities = [
    {
      icon: MessageSquare,
      title: "New conversation with GPT-4",
      subtitle: "Code review session completed",
      time: "2 minutes ago",
      accent: "blue" as const
    },
    {
      icon: Bot,
      title: "Agent 'Content Creator' updated",
      subtitle: "New capabilities added for SEO optimization",
      time: "15 minutes ago", 
      accent: "green" as const
    },
    {
      icon: Zap,
      title: "Automation workflow triggered",
      subtitle: "Daily report generation completed",
      time: "1 hour ago",
      accent: "orange" as const
    },
    {
      icon: TrendingUp,
      title: "Performance metrics updated",
      subtitle: "All systems operating at 99.9% uptime",
      time: "2 hours ago",
      accent: "purple" as const
    }
  ];

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-8xl mx-auto p-8 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-surface rounded-full border border-border-primary">
            <Sparkles className="h-4 w-4 text-accent-blue animate-gentle-bounce" />
            <span className="text-sm font-medium text-text-secondary">OneAI Platform</span>
          </div>
          
          <h1 className="text-6xl font-bold text-text-primary font-display leading-tight">
            Build the{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-glow-pulse">
              Future
            </span>{" "}
            of AI
          </h1>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Transform your workflows with intelligent agents, automated processes, and powerful AI capabilities.
            Everything you need to harness artificial intelligence for your business.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="glow" size="lg" className="text-lg px-8">
              Get Started
            </Button>
            <Button variant="glass" size="lg" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
            />
          ))}
        </div>

        {/* Primary Features */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-text-primary">Core Capabilities</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Powerful tools to accelerate your AI journey and transform how you work
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {primaryFeatures.map((feature) => (
              <Link key={feature.href} to={feature.href}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  accent={feature.accent}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Features Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-text-primary">Advanced Features</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Specialized tools for developers, creators, and enterprises
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondaryFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                accent={feature.accent}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-text-primary">Recent Activity</h2>
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              const accentColors = {
                blue: "text-accent-blue",
                green: "text-accent-green", 
                orange: "text-accent-orange",
                purple: "text-accent-purple",
                cyan: "text-accent-cyan"
              };
              
              return (
                <div 
                  key={index}
                  className="glass-ios p-6 rounded-2xl hover-lift group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-surface rounded-xl group-hover:scale-110 transition-transform duration-normal`}>
                      <Icon className={`h-5 w-5 ${accentColors[activity.accent]} group-hover:animate-gentle-bounce`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors duration-normal">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-normal">
                        {activity.subtitle}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions CTA */}
        <div className="glass-ios p-8 rounded-3xl glow-accent text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-text-primary">Ready to Get Started?</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join thousands of users who are already building with OneAI. Start your journey today.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent-green" />
              <span className="text-sm text-text-secondary">10k+ Active Users</span>
            </div>
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-accent-blue" />
              <span className="text-sm text-text-secondary">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-accent-purple" />
              <span className="text-sm text-text-secondary">Enterprise Security</span>
            </div>
          </div>
          
          <Button variant="glow" size="lg" className="text-lg px-12">
            Start Building Now
          </Button>
        </div>
        
      </div>
    </div>
  );
};

export default Index;
