import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlobalLoaderProps {
  isLoading: boolean;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function GlobalLoader({
  isLoading,
  text = "Loading",
  fullScreen = true,
  className,
}: GlobalLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm z-50",
            fullScreen && "fixed inset-0",
            className
          )}
        >
          {/* Animated Loader Orb */}
          <div className="relative w-20 h-20">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              style={{ borderTopColor: "hsl(var(--primary))" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Middle pulsing ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-primary/30"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner gradient orb */}
            <motion.div
              className="absolute inset-4 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/50"
              animate={{
                scale: [0.9, 1.1, 0.9],
                boxShadow: [
                  "0 0 20px hsl(var(--primary) / 0.3)",
                  "0 0 40px hsl(var(--primary) / 0.5)",
                  "0 0 20px hsl(var(--primary) / 0.3)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Core dot */}
            <motion.div
              className="absolute inset-7 rounded-full bg-white/90"
              animate={{
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Loading Text */}
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm font-medium text-muted-foreground">
              {text}
            </span>
            <motion.span className="flex gap-0.5 ml-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-muted-foreground"
                  animate={{
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15
                  }}
                />
              ))}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline loader for smaller contexts
export function InlineLoader({ 
  className,
  size = "sm" 
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <motion.div
      className={cn("relative", sizes[size], className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div className="absolute inset-0 rounded-full border-2 border-muted" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary" />
    </motion.div>
  );
}
