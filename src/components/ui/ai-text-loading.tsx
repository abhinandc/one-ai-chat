import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AITextLoadingProps {
  text?: string;
  className?: string;
}

export function AITextLoading({ 
  text = "AI is thinking", 
  className 
}: AITextLoadingProps) {
  const words = text.split(" ");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="flex">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              className="inline-block text-foreground/80"
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                y: [0, -2, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: (wordIndex * word.length + charIndex) * 0.05,
                ease: "easeInOut"
              }}
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
      <motion.span className="flex gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
      </motion.span>
    </div>
  );
}
