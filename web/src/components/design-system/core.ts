/**
 * Design System Core
 *
 * Central design tokens that integrate with CSS variables defined in globals.css
 * This provides a type-safe interface for accessing design system values
 * and ensures consistency across the application.
 */

/**
 * Color palette mapped to CSS variables
 * All colors reference the CSS custom properties defined in globals.css
 */
export const designTokens = {
  colors: {
    // Base colors
    background: 'var(--background)',
    foreground: 'var(--foreground)',

    // Card colors
    card: {
      DEFAULT: 'var(--card)',
      foreground: 'var(--card-foreground)',
    },

    // Popover colors
    popover: {
      DEFAULT: 'var(--popover)',
      foreground: 'var(--popover-foreground)',
    },

    // Primary colors
    primary: {
      DEFAULT: 'var(--primary)',
      foreground: 'var(--primary-foreground)',
    },

    // Secondary colors
    secondary: {
      DEFAULT: 'var(--secondary)',
      foreground: 'var(--secondary-foreground)',
    },

    // Muted colors
    muted: {
      DEFAULT: 'var(--muted)',
      foreground: 'var(--muted-foreground)',
    },

    // Accent colors
    accent: {
      DEFAULT: 'var(--accent)',
      foreground: 'var(--accent-foreground)',
    },

    // Destructive colors
    destructive: {
      DEFAULT: 'var(--destructive)',
      foreground: 'var(--destructive-foreground)',
    },

    // Border and input colors
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',

    // Chart colors
    chart: {
      1: 'var(--chart-1)',
      2: 'var(--chart-2)',
      3: 'var(--chart-3)',
      4: 'var(--chart-4)',
      5: 'var(--chart-5)',
    },

    // Sidebar colors
    sidebar: {
      DEFAULT: 'var(--sidebar)',
      foreground: 'var(--sidebar-foreground)',
      primary: 'var(--sidebar-primary)',
      primaryForeground: 'var(--sidebar-primary-foreground)',
      accent: 'var(--sidebar-accent)',
      accentForeground: 'var(--sidebar-accent-foreground)',
      border: 'var(--sidebar-border)',
      ring: 'var(--sidebar-ring)',
    },

    // Status colors for interview preparation and feedback states
    status: {
      processing: 'var(--chart-2)', // Blue-ish
      ready: 'var(--primary)', // Primary orange
      failed: 'var(--destructive)', // Red
      success: 'var(--chart-3)', // Green for positive feedback/strengths
      warning: 'var(--chart-4)', // Orange/yellow for warnings/weaknesses
      info: 'var(--chart-2)', // Blue for information/suggestions
      error: 'var(--destructive)', // Red for errors
    },

    // Feedback-specific colors for consistent styling
    feedback: {
      strengths: 'var(--feedback-strengths)', // Green for strengths
      improvements: 'var(--feedback-improvements)', // Orange for areas for improvement
      suggestions: 'var(--feedback-suggestions)', // Blue for suggestions
    },

    // Rating colors for feedback (gradient from deep to surface)
    rating: {
      deep: {
        DEFAULT: 'var(--rating-deep)',
        foreground: 'var(--rating-deep-foreground)',
      },
      intermediate: {
        DEFAULT: 'var(--rating-intermediate)',
        foreground: 'var(--rating-intermediate-foreground)',
      },
      surface: {
        DEFAULT: 'var(--rating-surface)',
        foreground: 'var(--rating-surface-foreground)',
      },
    },

    // Difficulty colors for questions
    difficulty: {
      easy: 'var(--chart-3)', // Green for easy difficulty
      medium: 'var(--chart-4)', // Orange for medium difficulty
      hard: 'var(--destructive)', // Red for hard difficulty
    },

    // Highlight colors for structured content sections (RGB values only, use with rgba())
    highlight: {
      1: 'var(--highlight-1)', // 255, 235, 59 (Yellow)
      2: 'var(--highlight-2)', // 76, 175, 80 (Green)
      3: 'var(--highlight-3)', // 33, 150, 243 (Blue)
      4: 'var(--highlight-4)', // 156, 39, 176 (Purple)
      5: 'var(--highlight-5)', // 255, 152, 0 (Orange)
    },
  },

  /**
   * Typography system
   */
  typography: {
    fontFamily: {
      sans: 'var(--font-sans)',
      serif: 'var(--font-serif)',
      mono: 'var(--font-mono)',
    },
    letterSpacing: {
      tighter: 'var(--tracking-tighter)',
      tight: 'var(--tracking-tight)',
      normal: 'var(--tracking-normal)',
      wide: 'var(--tracking-wide)',
      wider: 'var(--tracking-wider)',
      widest: 'var(--tracking-widest)',
    },
  },

  /**
   * Spacing system
   */
  spacing: {
    base: 'var(--spacing)', // 0.25rem
    xs: 'calc(var(--spacing) * 1)', // 0.25rem
    sm: 'calc(var(--spacing) * 2)', // 0.5rem
    md: 'calc(var(--spacing) * 4)', // 1rem
    lg: 'calc(var(--spacing) * 6)', // 1.5rem
    xl: 'calc(var(--spacing) * 8)', // 2rem
    '2xl': 'calc(var(--spacing) * 12)', // 3rem
    '3xl': 'calc(var(--spacing) * 16)', // 4rem
  },

  /**
   * Border radius system
   */
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    DEFAULT: 'var(--radius)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: '9999px',
  },

  /**
   * Shadow system
   */
  shadows: {
    '2xs': 'var(--shadow-2xs)',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    DEFAULT: 'var(--shadow)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    '2xl': 'var(--shadow-2xl)',
  },

  /**
   * Breakpoints for responsive design
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /**
   * Animation durations
   */
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  /**
   * Z-index layers
   */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    toast: 60,
    tooltip: 70,
  },
} as const

/**
 * Utility type to extract the type of design tokens
 */
export type DesignTokens = typeof designTokens

/**
 * Helper function to get CSS variable value at runtime
 * @param variable - CSS variable name (e.g., '--primary')
 * @returns The computed value of the CSS variable
 */
export function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
}

/**
 * Helper function to set CSS variable value at runtime
 * @param variable - CSS variable name (e.g., '--primary')
 * @param value - The value to set
 */
export function setCSSVariable(variable: string, value: string): void {
  if (typeof window === 'undefined') return
  document.documentElement.style.setProperty(variable, value)
}

/**
 * Get current theme (light/dark)
 * @returns 'light' or 'dark'
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Check if user prefers reduced motion
 * @returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default designTokens
