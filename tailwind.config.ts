import type { Config } from "tailwindcss";

/**
 * OneEdge Tailwind Configuration
 *
 * Constitution Compliance:
 * - 4px base grid (4, 8, 12, 16, 24, 32, 48, 64)
 * - OKLCH color space via CSS custom properties
 * - Animation timings: Micro 150-200ms, Page 200-300ms, Modal 200ms
 * - Breakpoints: 320, 375, 768, 1024, 1280, 1440
 * - Touch targets: 44px minimum
 */

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    /* ============================================
     * Constitution-Defined Breakpoints
     * 320, 375, 768, 1024, 1280, 1440
     * ============================================ */
    screens: {
      'xs': '320px',
      'sm': '375px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },

    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2rem',
        xl: '2rem',
        '2xl': '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },

    extend: {
      /* ============================================
       * Typography
       * ============================================ */
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
        'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
        'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
        '6xl': ['var(--text-6xl)', { lineHeight: 'var(--leading-tight)' }],
      },

      lineHeight: {
        'none': 'var(--leading-none)',
        'tight': 'var(--leading-tight)',
        'snug': 'var(--leading-snug)',
        'normal': 'var(--leading-normal)',
        'relaxed': 'var(--leading-relaxed)',
        'loose': 'var(--leading-loose)',
      },

      letterSpacing: {
        'tighter': 'var(--tracking-tighter)',
        'tight': 'var(--tracking-tight)',
        'normal': 'var(--tracking-normal)',
        'wide': 'var(--tracking-wide)',
        'wider': 'var(--tracking-wider)',
      },

      /* ============================================
       * Colors - OKLCH via CSS Custom Properties
       * ============================================ */
      colors: {
        // Core Semantic Colors
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        // Chart Colors
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },

        // Surface Colors
        surface: {
          DEFAULT: 'var(--surface-graphite)',
          hover: 'var(--surface-graphite-hover)',
          active: 'var(--surface-graphite-active)',
        },

        // Text Hierarchy
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-quaternary': 'var(--text-quaternary)',

        // Accent Colors
        'accent-blue': {
          DEFAULT: 'var(--accent-blue)',
          hover: 'var(--accent-blue-hover)',
        },
        'accent-green': 'var(--accent-green)',
        'accent-orange': 'var(--accent-orange)',
        'accent-red': 'var(--accent-red)',
        'accent-purple': 'var(--accent-purple)',
        'accent-cyan': 'var(--accent-cyan)',

        // Interactive States
        interactive: {
          hover: 'var(--interactive-hover)',
          active: 'var(--interactive-active)',
          selected: 'var(--interactive-selected)',
        },

        // Border Variants
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        divider: 'var(--divider)',

        // Glass
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        },
      },

      /* ============================================
       * Spacing Scale - 4px Base Grid
       * Constitution: 4, 8, 12, 16, 24, 32, 48, 64
       * ============================================ */
      spacing: {
        'px': '1px',
        '0': '0px',
        '0.5': '2px',
        '1': '4px',      // Base unit
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',    // Touch target
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',

        // Semantic spacing aliases
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',

        // Touch target (Apple HIG)
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
      },

      /* ============================================
       * Border Radius
       * ============================================ */
      borderRadius: {
        'none': '0',
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      },

      /* ============================================
       * Backdrop Blur
       * ============================================ */
      backdropBlur: {
        'xs': 'var(--blur-xs)',
        'sm': 'var(--blur-sm)',
        DEFAULT: 'var(--blur-md)',
        'md': 'var(--blur-md)',
        'lg': 'var(--blur-lg)',
        'xl': 'var(--blur-xl)',
      },

      /* ============================================
       * Box Shadow
       * ============================================ */
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glass': 'var(--shadow-glass)',
        'none': 'none',
      },

      /* ============================================
       * Z-Index Scale
       * ============================================ */
      zIndex: {
        'base': 'var(--z-base)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'toast': 'var(--z-toast)',
        'max': 'var(--z-max)',
      },

      /* ============================================
       * Transition Duration
       * Constitution: Micro 150-200ms, Page 200-300ms
       * ============================================ */
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'micro': 'var(--duration-micro)',
        'fast': 'var(--duration-fast)',
        DEFAULT: 'var(--duration-normal)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'slower': 'var(--duration-slower)',
        'slowest': 'var(--duration-slowest)',
      },

      /* ============================================
       * Transition Timing Function
       * ============================================ */
      transitionTimingFunction: {
        'linear': 'var(--ease-linear)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
        'bounce': 'var(--ease-bounce)',
      },

      /* ============================================
       * Background Images / Gradients
       * ============================================ */
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
        'gradient-surface': 'linear-gradient(135deg, var(--surface-graphite), var(--surface-graphite-hover))',
        'gradient-glass': 'linear-gradient(135deg, var(--glass-bg), transparent)',
        'shimmer': 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.1), transparent)',
      },

      /* ============================================
       * Keyframes
       * ============================================ */
      keyframes: {
        // Accordion
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },

        // Fade
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },

        // Slide
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(-16px)' },
        },
        'slide-out-right': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(16px)' },
        },

        // Scale
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },

        // Skeleton shimmer
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },

        // Pulse
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },

        // Bounce
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },

        // Gentle bounce (for indicators)
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },

        // Spin
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },

        // Shimmer button animations
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
      },

      /* ============================================
       * Animation Presets
       * Constitution timings applied
       * ============================================ */
      animation: {
        // Accordion
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',

        // Micro interactions (150-200ms)
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 150ms ease-out',
        'fade-in-up': 'fade-in-up 200ms ease-out',
        'fade-in-down': 'fade-in-down 200ms ease-out',

        // Page transitions (200-300ms)
        'slide-in-left': 'slide-in-left 250ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
        'slide-out-left': 'slide-out-left 250ms ease-out',
        'slide-out-right': 'slide-out-right 250ms ease-out',

        // Modal (200ms)
        'scale-in': 'scale-in 200ms ease-out',
        'scale-out': 'scale-out 200ms ease-out',

        // Loading
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',

        // Shimmer button animations
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
      },

      /* ============================================
       * Min/Max Sizes for Touch Targets
       * ============================================ */
      minHeight: {
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
      },
      minWidth: {
        'touch': 'var(--touch-target-min)',
        'touch-lg': 'var(--touch-target-comfortable)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
