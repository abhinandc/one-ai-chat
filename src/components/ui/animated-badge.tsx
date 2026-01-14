import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glow" | "pulse" | "shimmer";
}

export function AnimatedBadge({
  children,
  className,
  variant = "default",
}: AnimatedBadgeProps) {
  const variants = {
    default: {},
    glow: {
      boxShadow: [
        "0 0 10px hsl(var(--primary) / 0.3)",
        "0 0 20px hsl(var(--primary) / 0.5)",
        "0 0 10px hsl(var(--primary) / 0.3)",
      ],
    },
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
    },
    shimmer: {},
  };

  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        variant === "shimmer" && "relative overflow-hidden",
        className
      )}
      animate={variants[variant]}
      transition={{
        duration: variant === "pulse" ? 1.5 : 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {variant === "shimmer" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.span>
  );
}
