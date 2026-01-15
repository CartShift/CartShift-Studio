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
        xs: '375px', // iPhone SE / small phones
        '3xl': '1920px', // Large desktops
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
          600: 'rgb(var(--color-primary-600) / <alpha-value>)', // Brand Primary
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
          600: 'rgb(var(--color-accent-600) / <alpha-value>)', // Brand Accent
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
          850: 'rgb(var(--color-surface-850) / <alpha-value>)', // Intermediate dark shade
          900: 'rgb(var(--color-surface-900) / <alpha-value>)', // Dark surface base
          950: 'rgb(var(--color-surface-950) / <alpha-value>)', // Darker surface base
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },

      fontSize: {
        // Fluid typography with clamp() for responsive scaling
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
        tap: '44px', // Minimum touch target size (WCAG)
        'tap-sm': '40px', // Compact touch target
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      zIndex: {
        // Base layering system - from bottom to top
        base: 0,
        dropdown: 10,
        sticky: 20,
        header: 30,
        sidebar: 40,
        modal: 50,
        'banner-fixed': 60, // For ImpersonationBanner and other fixed banners
        tooltip: 100,
        toast: 110, // For sonner toast notifications
        'notification-badge': 120,
        'always-on-top': 9999,
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
      fontFamily: {
        item: ['var(--font-item)', 'sans-serif'],
        sans: ['var(--font-main)', 'system-ui', 'sans-serif'],
        display: ['var(--font-main)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],

        // English
        outfit: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        roboto: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        'plus-jakarta': ['var(--font-plus-jakarta)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        lato: ['var(--font-lato)', 'sans-serif'],
        'open-sans': ['var(--font-open-sans)', 'sans-serif'],
        raleway: ['var(--font-raleway)', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'sans-serif'],
        merriweather: ['var(--font-merriweather)', 'serif'],
        oswald: ['var(--font-oswald)', 'sans-serif'],
        quicksand: ['var(--font-quicksand)', 'sans-serif'],
        'work-sans': ['var(--font-work-sans)', 'sans-serif'],
        'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
        'crimson-text': ['var(--font-crimson-text)', 'serif'],

        // Hebrew
        assistant: ['var(--font-assistant)', 'sans-serif'],
        heebo: ['var(--font-heebo)', 'sans-serif'],
        rubik: ['var(--font-rubik)', 'sans-serif'],
        varela: ['var(--font-varela)', 'sans-serif'],
        secular: ['var(--font-secular)', 'sans-serif'],
        amatic: ['var(--font-amatic)', 'cursive'],
        'frank-ruhl': ['var(--font-frank-ruhl)', 'serif'],
        miriam: ['var(--font-miriam)', 'sans-serif'],
        alef: ['var(--font-alef)', 'sans-serif'],
        tinos: ['var(--font-tinos)', 'serif'],
        arimo: ['var(--font-arimo)', 'sans-serif'],
        'suez-one': ['var(--font-suez-one)', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgb(var(--color-accent-600) / 0.4), 0 0 40px rgb(var(--color-accent-600) / 0.2)', // Based on accent-600
        'glow-primary':
          '0 0 20px rgb(var(--color-primary-600) / 0.4), 0 0 40px rgb(var(--color-primary-600) / 0.2)', // Based on primary-600
        bold: '0 10px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cosmos': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', // Deep dark blue/purple
        'gradient-brand':
          'linear-gradient(135deg, rgb(var(--color-primary-600)) 0%, rgb(var(--color-accent-600)) 100%)', // Primary to Accent
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slow-spin': 'spin 12s linear infinite',
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
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
