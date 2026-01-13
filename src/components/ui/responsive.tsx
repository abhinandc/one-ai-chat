/**
 * Responsive Utilities
 *
 * Constitution Compliance:
 * - Breakpoints: 320px (xs), 375px (sm), 768px (md), 1024px (lg), 1280px (xl), 1440px (2xl)
 * - 4px/8px grid spacing
 * - 44px minimum touch targets on mobile
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// Breakpoint values matching tailwind.config.ts
export const BREAKPOINTS = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("md")

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.sm) setBreakpoint("xs")
      else if (width < BREAKPOINTS.md) setBreakpoint("sm")
      else if (width < BREAKPOINTS.lg) setBreakpoint("md")
      else if (width < BREAKPOINTS.xl) setBreakpoint("lg")
      else if (width < BREAKPOINTS["2xl"]) setBreakpoint("xl")
      else setBreakpoint("2xl")
    }

    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)
    return () => window.removeEventListener("resize", updateBreakpoint)
  }, [])

  return breakpoint
}

/**
 * Hook to check if viewport is at or above a breakpoint
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    const mediaQuery = window.matchMedia(query)

    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener("change", handler)

    return () => mediaQuery.removeEventListener("change", handler)
  }, [breakpoint])

  return matches
}

/**
 * Hook for mobile detection (below md breakpoint)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("md")
}

/**
 * Hook for desktop detection (at or above lg breakpoint)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("lg")
}

/**
 * ResponsiveContainer - Provides responsive padding and max-width
 */
interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  /** Add horizontal padding */
  padded?: boolean
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "2xl",
  padded = true,
  ...props
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-[1400px]",
    full: "max-w-full",
  }

  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthClasses[maxWidth],
        padded && "px-4 sm:px-6 md:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveGrid - Grid layout that adapts to breakpoints
 */
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Columns at each breakpoint */
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  /** Gap between items */
  gap?: "sm" | "md" | "lg" | "xl"
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, "2xl": 4 },
  gap = "md",
  ...props
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  }

  // Build responsive grid-cols classes
  const colClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`,
  ].filter(Boolean)

  return (
    <div
      className={cn(
        "grid",
        gapClasses[gap],
        colClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Show - Conditionally render based on breakpoint
 */
interface ShowProps {
  children: React.ReactNode
  /** Show at this breakpoint and above */
  above?: Breakpoint
  /** Show at this breakpoint and below */
  below?: Breakpoint
  /** Show only at this exact breakpoint */
  at?: Breakpoint
}

export function Show({ children, above, below, at }: ShowProps) {
  const currentBreakpoint = useBreakpoint()
  const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"]
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  let shouldShow = true

  if (above) {
    const aboveIndex = breakpointOrder.indexOf(above)
    shouldShow = shouldShow && currentIndex >= aboveIndex
  }

  if (below) {
    const belowIndex = breakpointOrder.indexOf(below)
    shouldShow = shouldShow && currentIndex <= belowIndex
  }

  if (at) {
    shouldShow = currentBreakpoint === at
  }

  if (!shouldShow) return null

  return <>{children}</>
}

/**
 * Hide - Conditionally hide based on breakpoint (opposite of Show)
 */
interface HideProps {
  children: React.ReactNode
  /** Hide at this breakpoint and above */
  above?: Breakpoint
  /** Hide at this breakpoint and below */
  below?: Breakpoint
  /** Hide only at this exact breakpoint */
  at?: Breakpoint
}

export function Hide({ children, above, below, at }: HideProps) {
  const currentBreakpoint = useBreakpoint()
  const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"]
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  let shouldHide = false

  if (above) {
    const aboveIndex = breakpointOrder.indexOf(above)
    shouldHide = shouldHide || currentIndex >= aboveIndex
  }

  if (below) {
    const belowIndex = breakpointOrder.indexOf(below)
    shouldHide = shouldHide || currentIndex <= belowIndex
  }

  if (at) {
    shouldHide = shouldHide || currentBreakpoint === at
  }

  if (shouldHide) return null

  return <>{children}</>
}

/**
 * MobileOnly - Only show on mobile (below md)
 */
export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <Hide above="md">{children}</Hide>
}

/**
 * DesktopOnly - Only show on desktop (md and above)
 */
export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return <Show above="md">{children}</Show>
}

/**
 * TouchTarget - Wrapper that ensures 44px minimum touch target
 */
interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use larger 48px touch target */
  comfortable?: boolean
}

export function TouchTarget({
  children,
  className,
  comfortable = false,
  ...props
}: TouchTargetProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        comfortable ? "min-h-touch-lg min-w-touch-lg" : "min-h-touch min-w-touch",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Stack - Vertical stack with responsive spacing
 */
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Align items */
  align?: "start" | "center" | "end" | "stretch"
}

export function Stack({
  children,
  className,
  gap = "md",
  align = "stretch",
  ...props
}: StackProps) {
  const gapClasses = {
    xs: "gap-1",  // 4px
    sm: "gap-2",  // 8px
    md: "gap-4",  // 16px
    lg: "gap-6",  // 24px
    xl: "gap-8",  // 32px
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        gapClasses[gap],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Cluster - Horizontal cluster with responsive spacing
 */
interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Align items */
  align?: "start" | "center" | "end" | "baseline"
  /** Justify content */
  justify?: "start" | "center" | "end" | "between" | "around"
  /** Wrap items */
  wrap?: boolean
}

export function Cluster({
  children,
  className,
  gap = "md",
  align = "center",
  justify = "start",
  wrap = true,
  ...props
}: ClusterProps) {
  const gapClasses = {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    baseline: "items-baseline",
  }

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  }

  return (
    <div
      className={cn(
        "flex",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// Advanced Layout Components
// ============================================

/**
 * Center - Centers content horizontally and vertically
 */
interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Center horizontally only */
  horizontal?: boolean
  /** Center vertically only */
  vertical?: boolean
  /** Text alignment */
  text?: boolean
}

export function Center({
  children,
  className,
  horizontal = true,
  vertical = true,
  text = false,
  ...props
}: CenterProps) {
  return (
    <div
      className={cn(
        "flex",
        horizontal && "justify-center",
        vertical && "items-center",
        text && "text-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Spacer - Flexible space component for flex layouts
 */
interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed size (overrides flex) */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number
  /** Axis for spacing */
  axis?: "horizontal" | "vertical"
}

export function Spacer({
  className,
  size,
  axis = "horizontal",
  ...props
}: SpacerProps) {
  const sizeClasses = {
    xs: axis === "horizontal" ? "w-1" : "h-1",
    sm: axis === "horizontal" ? "w-2" : "h-2",
    md: axis === "horizontal" ? "w-4" : "h-4",
    lg: axis === "horizontal" ? "w-6" : "h-6",
    xl: axis === "horizontal" ? "w-8" : "h-8",
  }

  const sizeClass = typeof size === "string" ? sizeClasses[size] : undefined
  const customStyle = typeof size === "number"
    ? { [axis === "horizontal" ? "width" : "height"]: `${size}px` }
    : undefined

  return (
    <div
      className={cn(
        size === undefined && "flex-1",
        sizeClass,
        className
      )}
      style={customStyle}
      {...props}
    />
  )
}

/**
 * Divider - Visual separator with responsive behavior
 */
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation */
  orientation?: "horizontal" | "vertical"
  /** Decorative text or icon */
  label?: React.ReactNode
}

export function Divider({
  className,
  orientation = "horizontal",
  label,
  ...props
}: DividerProps) {
  if (label) {
    return (
      <div
        className={cn(
          "flex items-center gap-4",
          orientation === "vertical" && "flex-col",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex-1 bg-border",
            orientation === "horizontal" ? "h-px" : "w-px"
          )}
        />
        <span className="text-xs text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex-1 bg-border",
            orientation === "horizontal" ? "h-px" : "w-px"
          )}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
      {...props}
    />
  )
}

/**
 * AspectRatio - Maintains aspect ratio for responsive content
 */
interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Aspect ratio (width/height) */
  ratio?: number | "square" | "video" | "photo" | "golden"
}

export function AspectRatio({
  children,
  className,
  ratio = "video",
  ...props
}: AspectRatioProps) {
  const ratioValue = typeof ratio === "number"
    ? ratio
    : {
        square: 1,
        video: 16 / 9,
        photo: 4 / 3,
        golden: 1.618,
      }[ratio]

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ aspectRatio: ratioValue }}
      {...props}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}

/**
 * Sticky - Sticky positioned element with responsive behavior
 */
interface StickyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Top offset */
  top?: string | number
  /** Bottom offset */
  bottom?: string | number
  /** Z-index */
  z?: "sticky" | "fixed" | "modal" | number
}

export function Sticky({
  children,
  className,
  top,
  bottom,
  z = "sticky",
  ...props
}: StickyProps) {
  const zIndexValue = typeof z === "number" ? z : {
    sticky: 20,
    fixed: 30,
    modal: 50,
  }[z]

  return (
    <div
      className={cn("sticky", className)}
      style={{
        top: typeof top === "number" ? `${top}px` : top,
        bottom: typeof bottom === "number" ? `${bottom}px` : bottom,
        zIndex: zIndexValue,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ScrollArea - Scrollable container with custom styling
 */
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll direction */
  direction?: "vertical" | "horizontal" | "both"
  /** Hide scrollbar */
  hideScrollbar?: boolean
  /** Max height (enables scroll) */
  maxHeight?: string | number
}

export function ScrollArea({
  children,
  className,
  direction = "vertical",
  hideScrollbar = false,
  maxHeight,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn(
        direction === "vertical" && "overflow-y-auto overflow-x-hidden",
        direction === "horizontal" && "overflow-x-auto overflow-y-hidden",
        direction === "both" && "overflow-auto",
        hideScrollbar && "scrollbar-hide",
        className
      )}
      style={{
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Box - Flexible box component with responsive props
 */
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display type */
  display?: "block" | "flex" | "grid" | "inline" | "inline-flex" | "inline-block"
  /** Padding */
  p?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Padding X */
  px?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Padding Y */
  py?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Margin */
  m?: "xs" | "sm" | "md" | "lg" | "xl" | "auto"
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full"
  /** Background variant */
  bg?: "background" | "muted" | "card" | "accent" | "transparent"
  /** Border */
  border?: boolean
}

export function Box({
  children,
  className,
  display = "block",
  p,
  px,
  py,
  m,
  rounded,
  bg,
  border,
  ...props
}: BoxProps) {
  const paddingClasses = {
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const paddingXClasses = {
    xs: "px-1",
    sm: "px-2",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
  }

  const paddingYClasses = {
    xs: "py-1",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
    xl: "py-8",
  }

  const marginClasses = {
    xs: "m-1",
    sm: "m-2",
    md: "m-4",
    lg: "m-6",
    xl: "m-8",
    auto: "m-auto",
  }

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }

  const bgClasses = {
    background: "bg-background",
    muted: "bg-muted",
    card: "bg-card",
    accent: "bg-accent",
    transparent: "bg-transparent",
  }

  const displayClasses = {
    block: "block",
    flex: "flex",
    grid: "grid",
    inline: "inline",
    "inline-flex": "inline-flex",
    "inline-block": "inline-block",
  }

  return (
    <div
      className={cn(
        displayClasses[display],
        p && paddingClasses[p],
        px && paddingXClasses[px],
        py && paddingYClasses[py],
        m && marginClasses[m],
        rounded && roundedClasses[rounded],
        bg && bgClasses[bg],
        border && "border border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * VisuallyHidden - Hide content visually but keep accessible
 */
export function VisuallyHidden({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: "rect(0, 0, 0, 0)" }}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * FocusTrap - Trap focus within a container
 */
interface FocusTrapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether focus trap is active */
  active?: boolean
}

export function FocusTrap({
  children,
  className,
  active = true,
  ...props
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    firstFocusable?.focus()

    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [active])

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  )
}

/**
 * SafeArea - Respects device safe areas (notches, etc.)
 */
interface SafeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which edges to pad */
  edges?: ("top" | "bottom" | "left" | "right")[]
}

export function SafeArea({
  children,
  className,
  edges = ["top", "bottom"],
  ...props
}: SafeAreaProps) {
  return (
    <div
      className={cn(
        edges.includes("top") && "safe-top",
        edges.includes("bottom") && "safe-bottom",
        edges.includes("left") && "safe-left",
        edges.includes("right") && "safe-right",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Breakpoint - Debug utility to show current breakpoint
 */
export function BreakpointIndicator() {
  const breakpoint = useBreakpoint()

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-max px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-mono">
      {breakpoint}
    </div>
  )
}

export type { Breakpoint }
