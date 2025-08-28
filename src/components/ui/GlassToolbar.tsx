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
          "glass-toolbar px-lg py-md",
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