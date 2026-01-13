/**
 * OneEdge Animation Primitives
 *
 * Constitution Compliance:
 * - Micro-interactions: 150-200ms, ease-out
 * - Page transitions: 200-300ms, ease-in-out
 * - Modal/drawer: 200ms, ease-out
 * - 60fps animations required
 *
 * Usage:
 * ```tsx
 * import { motion } from "framer-motion"
 * import { fadeInUp, staggerContainer } from "@/lib/animations"
 *
 * <motion.div variants={staggerContainer} initial="hidden" animate="visible">
 *   <motion.div variants={fadeInUp}>Content</motion.div>
 * </motion.div>
 * ```
 */

import type { Variants, Transition, TargetAndTransition } from "framer-motion"

// ============================================
// Timing Constants (from Constitution)
// ============================================

export const TIMING = {
  micro: 0.15,       // 150ms - micro-interactions
  fast: 0.2,         // 200ms - quick transitions
  normal: 0.25,      // 250ms - standard transitions
  slow: 0.3,         // 300ms - page transitions
  slower: 0.4,       // 400ms - complex animations
  slowest: 0.5,      // 500ms - entrance animations
} as const

// ============================================
// Easing Functions
// ============================================

export const EASING = {
  // Standard easings
  linear: [0, 0, 1, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,

  // Spring-like easings
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,

  // Apple-style smooth easings
  smooth: [0.25, 0.1, 0.25, 1] as const,
  smoothOut: [0.22, 1, 0.36, 1] as const,
} as const

// ============================================
// Transition Presets
// ============================================

export const transitions: Record<string, Transition> = {
  /** Micro-interactions (150ms) */
  micro: {
    duration: TIMING.micro,
    ease: EASING.easeOut,
  },

  /** Fast transitions (200ms) */
  fast: {
    duration: TIMING.fast,
    ease: EASING.easeOut,
  },

  /** Standard transitions (250ms) */
  normal: {
    duration: TIMING.normal,
    ease: EASING.easeInOut,
  },

  /** Page transitions (300ms) */
  slow: {
    duration: TIMING.slow,
    ease: EASING.easeInOut,
  },

  /** Spring animation */
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 1,
  },

  /** Gentle spring */
  springGentle: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1.2,
  },

  /** Bouncy spring */
  springBouncy: {
    type: "spring",
    stiffness: 500,
    damping: 15,
    mass: 0.8,
  },

  /** Modal animation */
  modal: {
    duration: TIMING.fast,
    ease: EASING.smoothOut,
  },
}

// ============================================
// Fade Variants
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.micro,
  },
  exit: {
    opacity: 0,
    transition: transitions.micro,
  },
}

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.micro,
  },
}

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: transitions.micro,
  },
}

// ============================================
// Slide Variants
// ============================================

export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: transitions.fast,
  },
}

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: transitions.fast,
  },
}

export const slideInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    y: 24,
    transition: transitions.fast,
  },
}

export const slideInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.slow,
  },
  exit: {
    opacity: 0,
    y: -24,
    transition: transitions.fast,
  },
}

// ============================================
// Scale Variants
// ============================================

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.micro,
  },
}

export const scaleInSpring: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.fast,
  },
}

export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.fast,
  },
}

// ============================================
// Container Variants (for staggered children)
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

// ============================================
// Modal/Dialog Variants
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: TIMING.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: TIMING.micro },
  },
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: { duration: TIMING.micro },
  },
}

// ============================================
// Drawer Variants
// ============================================

export const drawerLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: transitions.modal,
  },
  exit: {
    x: "-100%",
    transition: transitions.fast,
  },
}

export const drawerRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: transitions.modal,
  },
  exit: {
    x: "100%",
    transition: transitions.fast,
  },
}

export const drawerBottom: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: transitions.modal,
  },
  exit: {
    y: "100%",
    transition: transitions.fast,
  },
}

// ============================================
// Page Transition Variants
// ============================================

export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TIMING.slow,
      ease: EASING.smoothOut,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: TIMING.fast,
      ease: EASING.easeIn,
    },
  },
}

export const pageSlide: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: TIMING.slow,
      ease: EASING.smoothOut,
    },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: {
      duration: TIMING.fast,
      ease: EASING.easeIn,
    },
  },
}

// ============================================
// Hover/Tap Animation States
// ============================================

export const hoverScale: TargetAndTransition = {
  scale: 1.02,
  transition: transitions.micro,
}

export const hoverLift: TargetAndTransition = {
  y: -2,
  transition: transitions.micro,
}

export const tapScale: TargetAndTransition = {
  scale: 0.98,
  transition: { duration: 0.05 },
}

export const tapPress: TargetAndTransition = {
  scale: 0.95,
  transition: { duration: 0.05 },
}

// ============================================
// Interactive Element Presets
// ============================================

export const buttonInteraction = {
  whileHover: hoverScale,
  whileTap: tapScale,
}

export const cardInteraction = {
  whileHover: hoverLift,
  whileTap: tapScale,
}

export const listItemInteraction = {
  whileHover: {
    backgroundColor: "var(--interactive-hover)",
    transition: transitions.micro,
  },
  whileTap: tapScale,
}

// ============================================
// Infinite Animations
// ============================================

export const pulseAnimation: Variants = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const bounceAnimation: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const shimmerAnimation: Variants = {
  animate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// ============================================
// Loading State Animations (NO SPINNERS - Constitution)
// ============================================

/**
 * Skeleton shimmer effect - primary loading indicator
 * Constitution: Use skeleton screens, not spinners
 */
export const skeletonShimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

/**
 * Content placeholder fade - subtle loading state
 */
export const contentPlaceholder: Variants = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

/**
 * Progress bar animation
 */
export const progressBar: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.3,
      ease: EASING.easeOut,
    },
  },
}

/**
 * Indeterminate progress animation
 */
export const indeterminateProgress: Variants = {
  animate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: [0.65, 0, 0.35, 1],
    },
  },
}

/**
 * Typing indicator dots animation
 */
export const typingDots: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

/**
 * Staggered typing dots container
 */
export const typingDotsContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

/**
 * AI thinking/processing indicator
 */
export const aiThinking: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [0.98, 1, 0.98],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

/**
 * Content streaming animation (for AI responses)
 */
export const streamingContent: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: EASING.easeOut,
    },
  },
}

/**
 * Lazy load image animation
 */
export const lazyLoadImage: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: EASING.easeOut,
    },
  },
}

// ============================================
// Success/Error State Animations
// ============================================

/**
 * Success checkmark animation
 */
export const successCheck: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: EASING.easeOut },
      opacity: { duration: 0.1 },
    },
  },
}

/**
 * Error shake animation
 */
export const errorShake: Variants = {
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
}

/**
 * Warning pulse animation
 */
export const warningPulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// ============================================
// Notification/Toast Animations
// ============================================

/**
 * Toast slide in from top
 */
export const toastSlideIn: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: TIMING.fast,
      ease: EASING.spring,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: TIMING.micro,
      ease: EASING.easeIn,
    },
  },
}

/**
 * Notification badge bounce
 */
export const notificationBadge: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: TIMING.micro },
  },
}

// ============================================
// Navigation Animations
// ============================================

/**
 * Tab indicator slide
 */
export const tabIndicator = {
  layout: true,
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 35,
  },
}

/**
 * Menu item hover background
 */
export const menuItemHover: Variants = {
  rest: {
    backgroundColor: "transparent",
  },
  hover: {
    backgroundColor: "var(--interactive-hover)",
    transition: { duration: TIMING.micro },
  },
}

/**
 * Breadcrumb fade in
 */
export const breadcrumbItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: TIMING.micro,
      ease: EASING.easeOut,
    },
  },
}

// ============================================
// Card Animations
// ============================================

/**
 * Card flip animation
 */
export const cardFlip: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: TIMING.slow },
  },
  back: {
    rotateY: 180,
    transition: { duration: TIMING.slow },
  },
}

/**
 * Card expand animation
 */
export const cardExpand: Variants = {
  collapsed: {
    height: "auto",
  },
  expanded: {
    height: "auto",
    transition: {
      duration: TIMING.normal,
      ease: EASING.easeOut,
    },
  },
}

/**
 * Card selection animation
 */
export const cardSelect: Variants = {
  unselected: {
    scale: 1,
    boxShadow: "var(--shadow-sm)",
  },
  selected: {
    scale: 1.02,
    boxShadow: "var(--shadow-lg)",
    transition: transitions.spring,
  },
}

// ============================================
// Utility Functions
// ============================================

/**
 * Creates a stagger container with custom timing
 */
export function createStaggerContainer(
  staggerChildren: number = 0.05,
  delayChildren: number = 0.1
): Variants {
  return {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: staggerChildren / 2,
        staggerDirection: -1,
      },
    },
  }
}

/**
 * Creates a delayed variant
 */
export function withDelay<T extends Variants>(
  variants: T,
  delay: number
): T {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      if (typeof value === "object" && value !== null && "transition" in value) {
        return [
          key,
          {
            ...value,
            transition: {
              ...(value.transition as Transition),
              delay,
            },
          },
        ]
      }
      return [key, value]
    })
  ) as T
}

/**
 * Reduces motion for accessibility
 */
export function reduceMotion<T extends Variants>(variants: T): T {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        // Remove transform-based animations for reduced motion
        const { x, y, scale, rotate, ...rest } = value as Record<string, unknown>
        return [key, { ...rest, opacity: (value as Record<string, unknown>).opacity ?? 1 }]
      }
      return [key, value]
    })
  ) as T
}

/**
 * Creates an animation with custom duration
 */
export function withDuration<T extends Variants>(
  variants: T,
  duration: number
): T {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      if (typeof value === "object" && value !== null && "transition" in value) {
        return [
          key,
          {
            ...value,
            transition: {
              ...(value.transition as Transition),
              duration,
            },
          },
        ]
      }
      return [key, value]
    })
  ) as T
}

/**
 * Creates an animation with custom easing
 */
export function withEasing<T extends Variants>(
  variants: T,
  ease: readonly number[]
): T {
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      if (typeof value === "object" && value !== null && "transition" in value) {
        return [
          key,
          {
            ...value,
            transition: {
              ...(value.transition as Transition),
              ease,
            },
          },
        ]
      }
      return [key, value]
    })
  ) as T
}

/**
 * Combines multiple variant objects
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => {
    Object.entries(variant).forEach(([key, value]) => {
      if (acc[key] && typeof acc[key] === "object" && typeof value === "object") {
        acc[key] = { ...acc[key] as object, ...value as object }
      } else {
        acc[key] = value
      }
    })
    return acc
  }, {} as Variants)
}

/**
 * Creates a responsive animation that respects reduced motion
 */
export function createResponsiveAnimation<T extends Variants>(
  fullMotion: T,
  reducedMotion: T
): T {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return reducedMotion
  }
  return fullMotion
}
