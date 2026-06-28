import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '375px',
        '3xl': '1920px',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          950: 'rgb(var(--color-accent-950) / <alpha-value>)',
        },
        surface: {
          50: 'rgb(var(--color-surface-50) / <alpha-value>)',
          100: 'rgb(var(--color-surface-100) / <alpha-value>)',
          200: 'rgb(var(--color-surface-200) / <alpha-value>)',
          300: 'rgb(var(--color-surface-300) / <alpha-value>)',
          400: 'rgb(var(--color-surface-400) / <alpha-value>)',
          500: 'rgb(var(--color-surface-500) / <alpha-value>)',
          600: 'rgb(var(--color-surface-600) / <alpha-value>)',
          700: 'rgb(var(--color-surface-700) / <alpha-value>)',
          800: 'rgb(var(--color-surface-800) / <alpha-value>)',
          850: 'rgb(var(--color-surface-850) / <alpha-value>)',
          900: 'rgb(var(--color-surface-900) / <alpha-value>)',
          950: 'rgb(var(--color-surface-950) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },

      fontSize: {
        'fluid-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 2rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(2.25rem, 1.75rem + 2.5vw, 3rem)', { lineHeight: '1.1' }],
        'fluid-5xl': ['clamp(3rem, 2rem + 5vw, 4rem)', { lineHeight: '1.1' }],
      },

      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
        'section-y': '5rem',
        'section-y-md': '6rem',
        'section-y-lg': '8rem',
        tap: '44px',
        'tap-sm': '40px',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // OPTIMIZATION: Add hover and shadow utilities
      boxShadow: {
        // Card hover effects
        'card-default': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15)',
        'card-hover-light': '0 8px 24px -4px rgba(0,0,0,0.1), 0 16px 40px -8px rgba(0,0,0,0.08)',
        'card-hover-dark': '0 8px 24px -4px rgba(0,0,0,0.4), 0 16px 40px -8px rgba(0,0,0,0.3)',
        'card-lift-light': '0 12px 32px -6px rgba(0,0,0,0.12), 0 20px 48px -12px rgba(0,0,0,0.1)',
        'card-lift-dark': '0 12px 32px -6px rgba(0,0,0,0.5), 0 20px 48px -12px rgba(0,0,0,0.4)',

        // Button shadows
        'btn-primary':
          '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(var(--color-primary-600-rgb),0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        'btn-primary-hover':
          '0 2px 4px rgba(0,0,0,0.1), 0 8px 24px rgba(var(--color-primary-600-rgb),0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        'btn-primary-active':
          '0 0 0 rgba(0,0,0,0), 0 2px 8px rgba(var(--color-primary-600-rgb),0.2), inset 0 1px 2px rgba(0,0,0,0.1)',

        'btn-secondary': '0 1px 2px rgba(0,0,0,0.04)',
        'btn-secondary-hover': '0 2px 8px rgba(0,0,0,0.06)',

        'btn-danger':
          '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        'btn-danger-hover':
          '0 2px 4px rgba(0,0,0,0.1), 0 8px 24px rgba(244,63,94,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',

        'btn-success':
          '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        'btn-success-hover':
          '0 2px 4px rgba(0,0,0,0.1), 0 8px 24px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',

        'btn-gradient':
          '0 1px 2px rgba(0,0,0,0.1), 0 4px 16px rgba(var(--color-accent-600-rgb),0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
        'btn-gradient-hover':
          '0 2px 4px rgba(0,0,0,0.1), 0 8px 28px rgba(var(--color-accent-600-rgb),0.3)',

        'btn-glass': '0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)',
        'btn-glass-hover': '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',

        // Preserved existing shadows
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgb(var(--color-accent-600) / 0.4), 0 0 40px rgb(var(--color-accent-600) / 0.2)',
        'glow-primary':
          '0 0 20px rgb(var(--color-primary-600) / 0.4), 0 0 40px rgb(var(--color-primary-600) / 0.2)',
        bold: '0 10px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },

      zIndex: {
        base: '0',
        dropdown: '10',
        sticky: '20',
        header: '30',
        sidebar: '40',
        select: '80',
        modal: '50',
        'mobile-menu-backdrop': '55',
        'mobile-menu': '60',
        'banner-fixed': '65',
        tooltip: '100',
        toast: '110',
        'notification-badge': '120',
        'always-on-top': '9999',
      },

      minHeight: {
        tap: '44px',
        'tap-sm': '40px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'screen-dvh': '100dvh',
      },

      minWidth: {
        tap: '44px',
        'tap-sm': '40px',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // OPTIMIZATION: Reduce to only used fonts
      fontFamily: {
        sans: ['var(--font-main)', 'system-ui', 'sans-serif'],
        display: ['var(--font-main)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],

        // English
        outfit: ['var(--font-outfit)', 'system-ui', 'sans-serif'],

        // Hebrew
        rubik: ['var(--font-rubik)', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cosmos': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        'gradient-brand':
          'linear-gradient(135deg, rgb(var(--color-primary-600)) 0%, rgb(var(--color-accent-600)) 100%)',
      },

      // OPTIMIZATION: Add all animations centrally
      animation: {
        gradient: 'gradient 8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slow-spin': 'spin 12s linear infinite',
        'shine-sweep': 'shine-sweep 700ms ease-in-out',
      },

      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'shine-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
