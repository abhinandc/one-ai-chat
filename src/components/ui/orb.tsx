"use client"

import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type AgentState = null | "thinking" | "listening" | "talking"

type OrbProps = {
  colors?: [string, string]
  agentState?: AgentState
  className?: string
}

// Use our design system colors - primary accent
const DEFAULT_COLORS: [string, string] = ["hsl(211, 100%, 50%)", "hsl(211, 100%, 65%)"]

// Simple animated CSS orb that works without Three.js
export function Orb({
  colors = DEFAULT_COLORS,
  agentState = null,
  className,
}: OrbProps) {
  const [color1, color2] = colors;
  
  // Determine animation based on agent state
  const pulseScale = agentState === "talking" 
    ? [1, 1.15, 1] 
    : agentState === "listening" 
    ? [1, 1.08, 1] 
    : agentState === "thinking"
    ? [1, 1.05, 1]
    : [1, 1.02, 1];
    
  const pulseDuration = agentState === "talking" 
    ? 0.4 
    : agentState === "listening" 
    ? 0.8 
    : agentState === "thinking"
    ? 1.2
    : 3;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${color1}40, ${color2}20, transparent 70%)`,
        }}
        animate={{
          scale: pulseScale,
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: pulseDuration * 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Main orb */}
      <motion.div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color2}, ${color1} 50%, ${color1}80 100%)`,
          boxShadow: `
            0 0 60px ${color1}40,
            0 0 100px ${color1}20,
            inset 0 0 40px ${color2}30
          `,
        }}
        animate={{
          scale: pulseScale,
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner highlight */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 40%, ${color2}60, transparent 60%)`,
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: pulseDuration * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Rotating ring effect */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 opacity-30"
          style={{
            borderColor: color2,
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Second rotating ring */}
        <motion.div
          className="absolute inset-6 rounded-full border opacity-20"
          style={{
            borderColor: color1,
            borderLeftColor: "transparent",
            borderTopColor: "transparent",
          }}
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* State-specific effects */}
        {agentState === "listening" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color2}30, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        {agentState === "talking" && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: `${color2}40`,
                }}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{
                  scale: [0.8, 1.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
        
        {agentState === "thinking" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: color2 }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
