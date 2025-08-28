import { Link } from "react-router-dom";
import { Bot, MessageSquare, Workflow, Palette, Sparkles } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Unified Chat",
      description: "Streaming conversations with multiple AI models and intelligent context",
      href: "/chat"
    },
    {
      icon: Bot,
      title: "Agent Builder",
      description: "Visual node-based agent creation with flows and automation",
      href: "/agents"
    },
    {
      icon: Workflow,
      title: "Automations",
      description: "Trigger-based workflows with LLM integration and external APIs",
      href: "/automations"
    },
    {
      icon: Palette,
      title: "Design System",
      description: "Apple-minimal surfaces with glass-ios26 effects and gentle motion",
      href: "/theme"
    }
  ];

  return (
    <div className="min-h-full bg-background p-lg">
      <div className="max-w-6xl mx-auto space-y-xl">
        {/* Hero Section */}
        <div className="text-center space-y-lg pt-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-interactive-selected rounded-full text-accent-blue text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Apple-Minimal AI Platform
          </div>
          
          <h1 className="text-5xl font-bold text-text-primary font-display">
            Welcome to OneAI
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A beautiful, low-ink AI platform with glass-ios26 effects, large spacing, 
            and gentle motion. Built for professionals who value design and functionality.
          </p>
          
          <div className="flex items-center justify-center gap-md pt-lg">
            <Button size="lg" className="px-xl py-lg text-base font-medium">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="px-xl py-lg text-base font-medium">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} to={feature.href} className="group">
                <GlassCard className="h-full p-lg hover-lift group-hover:border-accent-blue/30 transition-all duration-normal">
                  <GlassCardHeader className="pb-md">
                    <div className="flex items-center gap-md">
                      <div className="p-md bg-accent-blue/10 rounded-xl">
                        <Icon className="h-6 w-6 text-accent-blue" />
                      </div>
                      <GlassCardTitle className="text-xl">{feature.title}</GlassCardTitle>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <GlassCardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </GlassCardDescription>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>
              Jump into common workflows with keyboard shortcuts
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">New Chat</div>
                  <div className="text-sm text-text-secondary">Press ⌘K then type "new chat"</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">Create Agent</div>
                  <div className="text-sm text-text-secondary">Press G then A</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-lg">
                <div className="text-left">
                  <div className="font-medium">Help</div>
                  <div className="text-sm text-text-secondary">Press ?</div>
                </div>
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Footer */}
        <div className="text-center py-xl">
          <p className="text-sm text-text-quaternary">
            Powered by OneOrigin
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
