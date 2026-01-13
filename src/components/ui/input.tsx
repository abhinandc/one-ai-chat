import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 *
 * Constitution Compliance:
 * - 44px minimum touch target (Apple HIG)
 * - OKLCH colors via CSS custom properties
 * - Animation: 150-200ms micro-interactions
 * - Focus states for accessibility
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-background",
          "px-3 py-2 text-base",
          // Touch target (Apple HIG: 44px minimum)
          "min-h-touch h-11",
          // Typography
          "placeholder:text-muted-foreground",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Transitions (Constitution: micro 150-200ms)
          "transition-all duration-micro ease-out",
          // Focus ring
          "ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Responsive
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
