import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "minimal";
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl px-lg py-md text-sm",
          "bg-white/60 backdrop-blur-sm border border-border-primary",
          "text-text-primary placeholder:text-text-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "motion-safe hover:bg-white/70",
          {
            "h-10 rounded-lg": variant === "minimal",
            "bg-surface-graphite/60 border-border-secondary": variant === "search"
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput };