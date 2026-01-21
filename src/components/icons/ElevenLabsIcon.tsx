import { cn } from "@/lib/utils";

interface ElevenLabsIconProps {
  className?: string;
  size?: number;
}

export function ElevenLabsIcon({ className, size = 20 }: ElevenLabsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
    >
      {/* ElevenLabs-style waveform icon */}
      <rect
        x="6"
        y="4"
        width="3"
        height="16"
        rx="1.5"
        fill="currentColor"
      />
      <rect
        x="15"
        y="4"
        width="3"
        height="16"
        rx="1.5"
        fill="currentColor"
      />
    </svg>
  );
}

// Animated version for active state
export function ElevenLabsIconAnimated({ className, size = 20 }: ElevenLabsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
    >
      {/* Animated bars */}
      <rect
        x="6"
        y="4"
        width="3"
        height="16"
        rx="1.5"
        fill="currentColor"
        className="animate-pulse"
      />
      <rect
        x="15"
        y="4"
        width="3"
        height="16"
        rx="1.5"
        fill="currentColor"
        className="animate-pulse"
        style={{ animationDelay: "150ms" }}
      />
    </svg>
  );
}
