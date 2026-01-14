"use client";

import { cn } from "@/lib/utils";
import { motion, MotionProps } from "motion/react";
import { useEffect, useRef, useState, memo } from "react";

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export const TypingAnimation = memo(function TypingAnimation({
  children,
  className,
  duration = 30,
  delay = 0,
  as: Component = "span",
  ...props
}: TypingAnimationProps) {
  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
});

// Streaming text that updates without typing animation - for real-time streaming
interface StreamingTextProps {
  content: string;
  className?: string;
  showCursor?: boolean;
}

export const StreamingText = memo(function StreamingText({
  content,
  className,
  showCursor = true,
}: StreamingTextProps) {
  return (
    <span className={cn("", className)}>
      {content}
      {showCursor && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse" />
      )}
    </span>
  );
});

// Animated span for staggered reveals
interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedSpanProps) => (
  <motion.span
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.3,
      delay: delay / 1000,
      ease: "easeOut",
    }}
    className={cn("", className)}
    {...props}
  >
    {children}
  </motion.span>
);
