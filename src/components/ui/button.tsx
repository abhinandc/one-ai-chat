import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-lg hover:scale-105 glow-primary",
        destructive:
          "bg-accent-red text-primary-foreground hover:bg-accent-red/90 hover:shadow-lg hover:scale-105",
        outline:
          "border border-border-primary bg-surface-graphite text-text-primary hover:bg-surface-graphite-hover hover:border-accent-blue/50 hover:shadow-md hover:scale-105",
        secondary:
          "bg-gradient-surface text-text-primary hover:bg-surface-graphite-hover hover:shadow-md hover:scale-105",
        ghost: "text-text-primary hover:bg-surface-graphite hover:shadow-sm hover:scale-105",
        link: "text-accent-blue underline-offset-4 hover:underline hover:text-accent-blue-hover",
        glass: "glass-ios text-text-primary hover:shadow-lg hover:scale-105 backdrop-blur-md",
        glow: "bg-accent-blue text-primary-foreground glow-primary hover:glow-accent hover:shadow-xl hover:scale-110",
      },
      size: {
        default: "h-11 px-6 py-3 rounded-lg",
        sm: "h-9 rounded-md px-4 py-2",
        lg: "h-13 rounded-xl px-8 py-4 text-base",
        icon: "h-11 w-11 rounded-lg",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
