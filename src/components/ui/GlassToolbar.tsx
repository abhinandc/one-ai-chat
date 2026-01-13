import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom";
}

const GlassToolbar = forwardRef<HTMLDivElement, GlassToolbarProps>(
  ({ className, position = "top", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-lg py-sm fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border-primary",
          {
            "border-b": position === "top",
            "border-t": position === "bottom"
          },
          className
        )}
        {...props}
      />
    );
  }
);
GlassToolbar.displayName = "GlassToolbar";

const GlassToolbarSection = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-md", className)}
    {...props}
  />
));
GlassToolbarSection.displayName = "GlassToolbarSection";

const GlassToolbarSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-6 w-px bg-divider", className)}
    {...props}
  />
));
GlassToolbarSeparator.displayName = "GlassToolbarSeparator";

export { GlassToolbar, GlassToolbarSection, GlassToolbarSeparator };