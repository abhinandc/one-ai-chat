import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: "blue" | "green" | "orange" | "purple" | "cyan";
  className?: string;
  onClick?: () => void;
}

const accentColors = {
  blue: "text-accent-blue group-hover:text-accent-blue-hover",
  green: "text-accent-green",
  orange: "text-accent-orange", 
  purple: "text-accent-purple",
  cyan: "text-accent-cyan"
};

const accentGlows = {
  blue: "group-hover:glow-primary",
  green: "group-hover:glow-accent",
  orange: "group-hover:shadow-lg group-hover:shadow-accent-orange/20",
  purple: "group-hover:shadow-lg group-hover:shadow-accent-purple/20", 
  cyan: "group-hover:shadow-lg group-hover:shadow-accent-cyan/20"
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  accent = "blue",
  className,
  onClick
}) => {
  return (
    <div 
      className={cn(
        "group glass-ios p-6 rounded-2xl hover-lift cursor-pointer",
        accentGlows[accent],
        "hover:border-accent-blue/50 transition-all duration-normal",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className={cn(
          "p-3 bg-gradient-surface rounded-xl w-fit",
          "group-hover:scale-110 transition-transform duration-normal"
        )}>
          <Icon className={cn("h-6 w-6", accentColors[accent], "group-hover:animate-gentle-bounce")} />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-text-primary group-hover:text-accent-blue transition-colors duration-normal">
            {title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors duration-normal">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};