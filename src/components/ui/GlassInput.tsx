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
          "glass-input",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-200",
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