import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  duration?: number;
}

export function ShimmerText({
  children,
  className,
  shimmerColor = "hsl(var(--primary))",
  duration = 2,
}: ShimmerTextProps) {
  return (
    <motion.span
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          hsl(var(--foreground)) 0%,
          hsl(var(--foreground)) 40%,
          ${shimmerColor} 50%,
          hsl(var(--foreground)) 60%,
          hsl(var(--foreground)) 100%
        )`,
        backgroundSize: "200% 100%",
      }}
      animate={{
        backgroundPosition: ["100% 0%", "-100% 0%"],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}

interface ThinkingLineProps {
  className?: string;
  text?: string;
}

export function ThinkingLine({ 
  className,
  text = "Processing your request"
}: ThinkingLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-muted/30 border border-border/50 backdrop-blur-sm",
        className
      )}
    >
      {/* Animated orb */}
      <div className="relative h-6 w-6 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-1 rounded-full bg-primary/40"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.2,
            ease: "easeInOut"
          }}
        />
        <div className="relative w-2 h-2 rounded-full bg-primary" />
      </div>
      
      {/* Shimmer text */}
      <ShimmerText className="text-sm font-medium">
        {text}
      </ShimmerText>
    </motion.div>
  );
}
