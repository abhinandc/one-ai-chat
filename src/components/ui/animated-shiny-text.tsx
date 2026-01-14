import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <motion.span
      className={cn(
        "relative inline-flex overflow-hidden",
        className
      )}
      initial={{ backgroundPosition: "0 0" }}
      animate={{ backgroundPosition: `${shimmerWidth}% 0` }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        backgroundImage: `linear-gradient(
          90deg,
          hsl(var(--foreground)) 0%,
          hsl(var(--primary)) 50%,
          hsl(var(--foreground)) 100%
        )`,
        backgroundSize: `${shimmerWidth * 2}% 100%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </motion.span>
  );
}
