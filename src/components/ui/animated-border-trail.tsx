"use client";

import { cn } from "@/lib/utils";

interface AnimatedBorderTrailProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The duration of the animation.
   * @default "10s"
   */
  duration?: string;

  contentClassName?: string;

  trailColor?: string;
  trailSize?: "sm" | "md" | "lg";
}

const sizes = {
  sm: 5,
  md: 10,
  lg: 20,
};

export function AnimatedBorderTrail({
  children,
  className,
  duration = "10s",
  trailColor = "purple",
  trailSize = "md",
  contentClassName,
  ...props
}: AnimatedBorderTrailProps) {
  return (
    <div
      {...props}
      className={cn(
        "relative h-fit w-fit overflow-hidden rounded-xl bg-gray-800 p-px",
        className
      )}
    >
      <div
        className="absolute inset-0 h-full w-full animate-trail"
        style={
          {
            "--duration": duration ?? "10s",
            "--angle": "0deg",
            background: `conic-gradient(from var(--angle) at 50% 50%, transparent ${
              100 - sizes[trailSize]
            }%, ${trailColor})`,
          } as React.CSSProperties
        }
      />
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[11px] bg-[#1a1a1a]",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default AnimatedBorderTrail;
