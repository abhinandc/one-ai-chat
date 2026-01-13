/**
 * OneEdge Design System
 *
 * Central export file for all design system primitives.
 * Provides typed access to design tokens, color utilities,
 * and responsive helpers.
 *
 * Usage:
 * ```tsx
 * import { DESIGN_TOKENS, TIMING, EASING, colors } from "@/lib/design-system"
 * ```
 */

// Re-export all animation utilities
export * from "./animations"

// ============================================
// Design Tokens (JavaScript reference)
// ============================================

export const DESIGN_TOKENS = {
  // Spacing scale (4px base)
  spacing: {
    0: "0px",
    px: "1px",
    0.5: "2px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
    24: "96px",
    32: "128px",
  },

  // Border radius
  radius: {
    none: "0",
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },

  // Typography
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem",    // 48px
    "6xl": "3.75rem", // 60px
  },

  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
    toast: 80,
    max: 9999,
  },

  // Animation durations (ms)
  duration: {
    instant: 0,
    micro: 150,
    fast: 200,
    normal: 250,
    slow: 300,
    slower: 400,
    slowest: 500,
  },

  // Breakpoints
  breakpoints: {
    xs: 320,
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1440,
  },

  // Touch targets (Apple HIG)
  touchTarget: {
    min: 44,
    comfortable: 48,
  },

  // Blur levels
  blur: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "24px",
    xl: "40px",
  },
} as const

// ============================================
// OKLCH Color Tokens
// ============================================

/**
 * OKLCH Color definitions for programmatic access
 * Format: oklch(lightness chroma hue / alpha)
 */
export const colors = {
  // Light mode semantic colors
  light: {
    background: "oklch(0.971 0.003 286.35)",
    foreground: "oklch(0 0 0)",
    muted: "oklch(0.923 0.007 286.267)",
    mutedForeground: "oklch(0 0 0)",
    popover: "oklch(1 0 180)",
    popoverForeground: "oklch(0 0 0)",
    card: "oklch(1 0 180)",
    cardForeground: "oklch(0 0 0)",
    border: "oklch(0.923 0.007 286.267)",
    input: "oklch(0.923 0.007 286.267)",
    primary: "oklch(0.603 0.218 257.42)",
    primaryForeground: "oklch(1 0 180)",
    secondary: "oklch(1 0 180)",
    secondaryForeground: "oklch(0 0 0)",
    accent: "oklch(0.963 0.007 286.274)",
    accentForeground: "oklch(0 0 0)",
    destructive: "oklch(0.663 0.224 28.292)",
    destructiveForeground: "oklch(1 0 180)",
    ring: "oklch(0.603 0.218 257.42)",
  },

  // Dark mode semantic colors
  dark: {
    background: "oklch(0 0 0)",
    foreground: "oklch(0.994 0 180)",
    muted: "oklch(0.201 0.004 286.039)",
    mutedForeground: "oklch(0.994 0 180)",
    popover: "oklch(0.227 0.004 286.091)",
    popoverForeground: "oklch(0.963 0.007 286.274)",
    card: "oklch(0 0 0)",
    cardForeground: "oklch(1 0 180)",
    border: "oklch(0.201 0.002 286.221)",
    input: "oklch(0.201 0.002 286.221)",
    primary: "oklch(0.624 0.206 255.484)",
    primaryForeground: "oklch(1 0 180)",
    secondary: "oklch(0.227 0.004 286.091)",
    secondaryForeground: "oklch(1 0 180)",
    accent: "oklch(0.294 0.004 286.177)",
    accentForeground: "oklch(1 0 180)",
    destructive: "oklch(0.648 0.207 30.78)",
    destructiveForeground: "oklch(1 0 180)",
    ring: "oklch(0.624 0.206 255.484)",
  },

  // Chart colors (both modes)
  chart: {
    1: { light: "oklch(0.73 0.194 147.443)", dark: "oklch(0.77 0.224 144.965)" },   // Green
    2: { light: "oklch(0.865 0.177 90.382)", dark: "oklch(0.885 0.181 94.786)" },   // Yellow
    3: { light: "oklch(0.659 0.172 263.904)", dark: "oklch(0.817 0.119 227.748)" }, // Purple/Cyan
    4: { light: "oklch(0.529 0.191 278.337)", dark: "oklch(0.556 0.203 278.151)" }, // Deep Purple
    5: { light: "oklch(0.65 0.238 17.899)", dark: "oklch(0.65 0.238 17.899)" },     // Red/Orange
  },

  // Accent palette
  accents: {
    blue: { default: "oklch(0.603 0.218 257.42)", hover: "oklch(0.55 0.2 257.42)" },
    green: "oklch(0.72 0.17 145)",
    orange: "oklch(0.78 0.15 55)",
    red: "oklch(0.65 0.2 25)",
    purple: "oklch(0.65 0.18 295)",
    cyan: "oklch(0.78 0.12 200)",
  },
} as const

// ============================================
// CSS Variable Utilities
// ============================================

/**
 * Get a CSS custom property value at runtime
 */
export function getCSSVar(name: string): string {
  if (typeof window === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
}

/**
 * Set a CSS custom property value at runtime
 */
export function setCSSVar(name: string, value: string): void {
  if (typeof window === "undefined") return
  document.documentElement.style.setProperty(`--${name}`, value)
}

/**
 * Get multiple CSS variables as an object
 */
export function getCSSVars(names: string[]): Record<string, string> {
  if (typeof window === "undefined") return {}
  const style = getComputedStyle(document.documentElement)
  return names.reduce((acc, name) => {
    acc[name] = style.getPropertyValue(`--${name}`).trim()
    return acc
  }, {} as Record<string, string>)
}

/**
 * Set multiple CSS variables at once
 */
export function setCSSVars(vars: Record<string, string>): void {
  if (typeof window === "undefined") return
  Object.entries(vars).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--${name}`, value)
  })
}

// ============================================
// Media Query Helpers
// ============================================

type BreakpointKey = keyof typeof DESIGN_TOKENS.breakpoints

/**
 * Check if viewport matches a breakpoint
 */
export function matchesBreakpoint(breakpoint: BreakpointKey): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(`(min-width: ${DESIGN_TOKENS.breakpoints[breakpoint]}px)`).matches
}

/**
 * Get current breakpoint name
 */
export function getCurrentBreakpoint(): BreakpointKey {
  if (typeof window === "undefined") return "md"

  const width = window.innerWidth
  const breakpoints = DESIGN_TOKENS.breakpoints

  if (width >= breakpoints["2xl"]) return "2xl"
  if (width >= breakpoints.xl) return "xl"
  if (width >= breakpoints.lg) return "lg"
  if (width >= breakpoints.md) return "md"
  if (width >= breakpoints.sm) return "sm"
  return "xs"
}

/**
 * Check for reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Check for dark mode preference
 */
export function prefersDarkMode(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Check for high contrast preference
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-contrast: more)").matches
}

// ============================================
// Theme Utilities
// ============================================

/**
 * Check if dark mode is currently active (via class)
 */
export function isDarkMode(): boolean {
  if (typeof document === "undefined") return false
  return document.documentElement.classList.contains("dark")
}

/**
 * Toggle dark mode class on document
 */
export function toggleDarkMode(): void {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark")
}

/**
 * Set dark mode explicitly
 */
export function setDarkMode(enabled: boolean): void {
  if (typeof document === "undefined") return
  if (enabled) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

// ============================================
// Color Manipulation Utilities
// ============================================

/**
 * Parse OKLCH color string into components
 */
export function parseOKLCH(color: string): { l: number; c: number; h: number; a?: number } | null {
  const match = color.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/)
  if (!match) return null

  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    a: match[4] ? parseFloat(match[4]) : undefined,
  }
}

/**
 * Create OKLCH color string from components
 */
export function createOKLCH(l: number, c: number, h: number, a?: number): string {
  const base = `oklch(${l} ${c} ${h})`
  return a !== undefined ? `${base.slice(0, -1)} / ${a})` : base
}

/**
 * Adjust OKLCH lightness
 */
export function adjustLightness(color: string, amount: number): string {
  const parsed = parseOKLCH(color)
  if (!parsed) return color

  const newL = Math.max(0, Math.min(1, parsed.l + amount))
  return createOKLCH(newL, parsed.c, parsed.h, parsed.a)
}

/**
 * Add alpha to an OKLCH color
 */
export function withAlpha(color: string, alpha: number): string {
  const parsed = parseOKLCH(color)
  if (!parsed) return color

  return createOKLCH(parsed.l, parsed.c, parsed.h, alpha)
}

// ============================================
// Spacing Utilities
// ============================================

type SpacingKey = keyof typeof DESIGN_TOKENS.spacing

/**
 * Get spacing value from token
 */
export function spacing(key: SpacingKey): string {
  return DESIGN_TOKENS.spacing[key]
}

/**
 * Create spacing scale for a component (margin, padding, gap)
 */
export function createSpacingScale(multiplier: number = 1): Record<SpacingKey, string> {
  return Object.fromEntries(
    Object.entries(DESIGN_TOKENS.spacing).map(([key, value]) => {
      const px = parseInt(value)
      return [key, `${px * multiplier}px`]
    })
  ) as Record<SpacingKey, string>
}

// ============================================
// Typography Utilities
// ============================================

type FontSizeKey = keyof typeof DESIGN_TOKENS.fontSize

/**
 * Get font size value from token
 */
export function fontSize(key: FontSizeKey): string {
  return DESIGN_TOKENS.fontSize[key]
}

/**
 * Create typography style object
 */
export function createTypography(
  size: FontSizeKey,
  weight: keyof typeof DESIGN_TOKENS.fontWeight = "normal",
  lineHeight: keyof typeof DESIGN_TOKENS.lineHeight = "normal"
): { fontSize: string; fontWeight: number; lineHeight: number } {
  return {
    fontSize: DESIGN_TOKENS.fontSize[size],
    fontWeight: DESIGN_TOKENS.fontWeight[weight],
    lineHeight: DESIGN_TOKENS.lineHeight[lineHeight],
  }
}

// ============================================
// Animation Duration Helper
// ============================================

type DurationKey = keyof typeof DESIGN_TOKENS.duration

/**
 * Get animation duration in seconds (for Framer Motion)
 */
export function duration(key: DurationKey): number {
  return DESIGN_TOKENS.duration[key] / 1000
}

/**
 * Get animation duration in milliseconds (for CSS)
 */
export function durationMs(key: DurationKey): string {
  return `${DESIGN_TOKENS.duration[key]}ms`
}

// ============================================
// Z-Index Helper
// ============================================

type ZIndexKey = keyof typeof DESIGN_TOKENS.zIndex

/**
 * Get z-index value from token
 */
export function zIndex(key: ZIndexKey): number {
  return DESIGN_TOKENS.zIndex[key]
}

// ============================================
// Type Exports
// ============================================

export type {
  SpacingKey,
  FontSizeKey,
  DurationKey,
  ZIndexKey,
  BreakpointKey,
}
