import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  trend = "up",
  className
}) => {
  const isPositive = trend === "up";
  
  return (
    <div className={cn(
      "glass-ios p-6 rounded-2xl hover-lift group glow-primary",
      "hover:scale-105 transition-all duration-normal",
      className
    )}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-normal">
            {label}
          </p>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-accent-green group-hover:animate-gentle-bounce" />
          ) : (
            <TrendingDown className="h-4 w-4 text-accent-red group-hover:animate-gentle-bounce" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-text-primary group-hover:text-accent-blue transition-colors duration-normal">
            {value}
          </div>
          <div className={cn(
            "text-sm font-semibold",
            isPositive ? "text-accent-green" : "text-accent-red",
            "animate-gentle-bounce"
          )}>
            {change}
          </div>
        </div>
      </div>
    </div>
  );
};