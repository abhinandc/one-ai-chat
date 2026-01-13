/**
 * Motion Components
 *
 * Pre-configured motion components for common animation patterns.
 * Constitution Compliance:
 * - Micro-interactions: 150-200ms
 * - Page transitions: 200-300ms
 * - Modal/drawer: 200ms
 */

"use client"

import * as React from "react"
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion"
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  popIn,
  staggerContainer,
  pageTransition,
  modalContent,
  modalOverlay,
  buttonInteraction,
  cardInteraction,
} from "@/lib/animations"
import { cn } from "@/lib/utils"

// ============================================
// Fade Components
// ============================================

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
}

/**
 * Simple fade in/out animation
 */
export function FadeIn({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade in with upward motion
 */
export function FadeInUp({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade in with downward motion
 */
export function FadeInDown({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Slide Components
// ============================================

/**
 * Slide in from left
 */
export function SlideInLeft({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={slideInLeft}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide in from right
 */
export function SlideInRight({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Scale Components
// ============================================

/**
 * Scale in animation
 */
export function ScaleIn({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Pop in with bounce effect
 */
export function PopIn({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Stagger Container
// ============================================

interface StaggerContainerProps extends MotionDivProps {
  /** Delay between each child animation */
  staggerDelay?: number
}

/**
 * Container that staggers children animations
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay,
  ...props
}: StaggerContainerProps) {
  const variants = staggerDelay
    ? {
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }
    : staggerContainer

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Child item for StaggerContainer
 */
export function StaggerItem({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div variants={fadeInUp} className={className} {...props}>
      {children}
    </motion.div>
  )
}

// ============================================
// Page Transition
// ============================================

interface PageTransitionProps extends MotionDivProps {
  /** Unique key for AnimatePresence */
  pageKey?: string
}

/**
 * Page-level transition wrapper
 */
export function PageTransition({
  children,
  className,
  pageKey,
  ...props
}: PageTransitionProps) {
  return (
    <motion.div
      key={pageKey}
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// Modal Components
// ============================================

interface ModalOverlayProps extends HTMLMotionProps<"div"> {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when overlay is clicked */
  onClose?: () => void
}

/**
 * Modal backdrop overlay
 */
export function ModalOverlay({ isOpen, onClose, className, ...props }: ModalOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className={cn(
            "fixed inset-0 z-modal-backdrop bg-black/50 backdrop-blur-sm",
            className
          )}
          {...props}
        />
      )}
    </AnimatePresence>
  )
}

interface ModalContentWrapperProps extends MotionDivProps {
  /** Whether the modal is open */
  isOpen: boolean
}

/**
 * Modal content wrapper with scale animation
 */
export function ModalContentWrapper({
  isOpen,
  children,
  className,
  ...props
}: ModalContentWrapperProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn("z-modal", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// Interactive Components
// ============================================

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
}

/**
 * Button with hover/tap animations
 */
export function MotionButton({ children, className, ...props }: MotionButtonProps) {
  return (
    <motion.button
      {...buttonInteraction}
      className={cn("outline-none", className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * Card with hover/tap animations
 */
export function MotionCard({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      {...cardInteraction}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// List Animation
// ============================================

interface AnimatedListProps extends MotionDivProps {
  /** Array of items to render */
  items: React.ReactNode[]
  /** Key extractor function */
  keyExtractor?: (index: number) => string | number
}

/**
 * Animated list with staggered items
 */
export function AnimatedList({
  items,
  keyExtractor,
  className,
  ...props
}: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {items.map((item, index) => (
        <motion.div key={keyExtractor?.(index) ?? index} variants={fadeInUp}>
          {item}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ============================================
// Presence Wrapper
// ============================================

interface PresenceProps {
  children: React.ReactNode
  /** Mode for AnimatePresence */
  mode?: "sync" | "wait" | "popLayout"
}

/**
 * AnimatePresence wrapper for exit animations
 */
export function Presence({ children, mode = "wait" }: PresenceProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}

// ============================================
// Collapse/Expand
// ============================================

interface CollapseProps extends MotionDivProps {
  /** Whether the content is expanded */
  isOpen: boolean
}

/**
 * Collapsible content with smooth height animation
 */
export function Collapse({ isOpen, children, className, ...props }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          className={cn("overflow-hidden", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Re-export motion and AnimatePresence for convenience
export { motion, AnimatePresence }
