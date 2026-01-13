import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button Component
 *
 * Constitution Compliance:
 * - 44px minimum touch target (Apple HIG)
 * - OKLCH colors via CSS custom properties
 * - Animation: 150-200ms micro-interactions
 * - Focus states for accessibility
 */

const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium",
    // Touch target (Apple HIG: 44px minimum)
    "min-h-touch min-w-touch",
    // Transitions (Constitution: micro 150-200ms)
    "transition-all duration-micro ease-out",
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:opacity-90 hover:shadow-md",
          "active:scale-[0.98]",
        ].join(" "),

        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:opacity-90 hover:shadow-md",
          "active:scale-[0.98]",
        ].join(" "),

        outline: [
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground",
          "active:scale-[0.98]",
        ].join(" "),

        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:opacity-80",
          "active:scale-[0.98]",
        ].join(" "),

        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "active:scale-[0.98]",
        ].join(" "),

        link: [
          "text-primary underline-offset-4",
          "hover:underline",
        ].join(" "),

        // Glass effect variant (iOS-style)
        glass: [
          "glass",
          "hover:shadow-lg",
          "active:scale-[0.98]",
        ].join(" "),

        // Glow effect variant
        glow: [
          "bg-primary text-primary-foreground",
          "glow-primary",
          "hover:shadow-xl",
          "active:scale-[0.98]",
        ].join(" "),
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-sm px-4 py-2 text-xs",
        lg: "h-12 rounded-lg px-8 py-4",
        xl: "h-14 rounded-xl px-10 py-4 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            {/* Skeleton loading indicator - NO spinners per Constitution */}
            <span className="relative h-4 w-16 overflow-hidden rounded-sm bg-current/20">
              <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-current/30 to-transparent" />
            </span>
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
