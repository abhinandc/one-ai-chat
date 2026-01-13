import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Skeleton Component
 *
 * Constitution Compliance:
 * - NO spinners - skeleton screens preferred (Principle IV)
 * - Smooth shimmer animation for loading states
 * - Multiple variants for different content types
 */

const skeletonVariants = cva(
  [
    "relative overflow-hidden bg-muted",
    // Shimmer effect
    "before:absolute before:inset-0",
    "before:-translate-x-full",
    "before:animate-shimmer",
    "before:bg-gradient-to-r",
    "before:from-transparent before:via-white/10 before:to-transparent",
    "dark:before:via-white/5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "rounded-md",
        text: "rounded-sm h-4",
        heading: "rounded-sm h-6",
        avatar: "rounded-full",
        button: "rounded-md h-11",
        card: "rounded-lg",
        image: "rounded-lg aspect-video",
        circle: "rounded-full aspect-square",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width of the skeleton. Accepts CSS value or Tailwind class */
  width?: string | number
  /** Height of the skeleton. Accepts CSS value or Tailwind class */
  height?: string | number
}

function Skeleton({
  className,
  variant,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    ...(typeof width === "number" ? { width: `${width}px` } : {}),
    ...(typeof height === "number" ? { height: `${height}px` } : {}),
  }

  const widthClass = typeof width === "string" ? width : undefined
  const heightClass = typeof height === "string" ? height : undefined

  return (
    <div
      className={cn(skeletonVariants({ variant }), widthClass, heightClass, className)}
      style={customStyle}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  )
}

/**
 * SkeletonText - For text content loading states
 */
interface SkeletonTextProps extends Omit<SkeletonProps, "variant"> {
  /** Number of text lines to show */
  lines?: number
  /** Make the last line shorter */
  lastLineShort?: boolean
}

function SkeletonText({
  lines = 3,
  lastLineShort = true,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            "w-full",
            lastLineShort && index === lines - 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonCard - For card content loading states
 */
interface SkeletonCardProps extends Omit<SkeletonProps, "variant"> {
  /** Show image placeholder */
  hasImage?: boolean
  /** Show avatar placeholder */
  hasAvatar?: boolean
  /** Number of text lines */
  textLines?: number
}

function SkeletonCard({
  hasImage = true,
  hasAvatar = false,
  textLines = 2,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "p-4 space-y-4 rounded-lg border border-border bg-card",
        className
      )}
      {...props}
    >
      {hasImage && (
        <Skeleton variant="image" className="w-full h-40" />
      )}
      {hasAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton variant="avatar" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-24" />
            <Skeleton variant="text" className="w-16" />
          </div>
        </div>
      )}
      <SkeletonText lines={textLines} />
    </div>
  )
}

/**
 * SkeletonList - For list content loading states
 */
interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of list items */
  count?: number
  /** Show avatar in each item */
  hasAvatar?: boolean
}

function SkeletonList({
  count = 5,
  hasAvatar = true,
  className,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {hasAvatar && (
            <Skeleton variant="avatar" className="h-10 w-10 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonTable - For table content loading states
 */
interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of rows */
  rows?: number
  /** Number of columns */
  columns?: number
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            variant="text"
            className="flex-1 h-5"
          />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 py-3">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * SkeletonButton - For button loading states
 */
function SkeletonButton({ className, ...props }: Omit<SkeletonProps, "variant">) {
  return (
    <Skeleton
      variant="button"
      className={cn("w-24", className)}
      {...props}
    />
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonButton,
  skeletonVariants,
}
