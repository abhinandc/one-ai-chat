"use client";

import { useEffect, useRef } from "react";

interface SiaWidgetProps {
  agentId?: string;
  className?: string;
}

/**
 * Sia - ElevenLabs Conversational AI Widget
 *
 * Embeds the ElevenLabs conversational AI widget for voice interactions.
 * The widget is loaded from the ElevenLabs CDN (configured in index.html).
 *
 * @see hardUIrules.md line 7
 */
export function SiaWidget({
  agentId = "agent_8701keg7xdvgfx89gk8fspx7jk5x",
  className,
}: SiaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create the custom element
    if (containerRef.current) {
      // Check if widget already exists
      const existing = containerRef.current.querySelector("elevenlabs-convai");
      if (!existing) {
        const widget = document.createElement("elevenlabs-convai");
        widget.setAttribute("agent-id", agentId);
        containerRef.current.appendChild(widget);
      }
    }

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        const widget = containerRef.current.querySelector("elevenlabs-convai");
        if (widget) {
          widget.remove();
        }
      }
    };
  }, [agentId]);

  return <div ref={containerRef} className={className} />;
}

SiaWidget.displayName = "SiaWidget";
