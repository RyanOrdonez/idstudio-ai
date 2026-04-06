import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        // Warm neutral palette — no pure white, no cold grays
        cream: {
          50: '#FEFDFB',
          100: '#FBF8F3',
          200: '#F5F0E8',
          300: '#EDE6D9',
          400: '#E0D5C3',
          500: '#C9BAA3',
          600: '#A89880',
          700: '#87755E',
          800: '#6B5C49',
          900: '#4A3F33',
        },
        stone: {
          50: '#FAF9F7',
          100: '#F3F1ED',
          200: '#E8E4DD',
          300: '#D9D3C9',
          400: '#C4BBB0',
          500: '#A69E93',
          600: '#887E72',
          700: '#6B6358',
          800: '#524B42',
          900: '#3A352E',
        },
        warm: {
          50: '#FFFCF8',
          100: '#FFF8EE',
          200: '#FFEFD6',
          300: '#FFE4BA',
          400: '#FFD699',
          500: '#EDBE7A',
          600: '#D4A55E',
          700: '#B58A45',
          800: '#8A6A35',
          900: '#5E4926',
        },
        accent: {
          DEFAULT: '#B58A45',
          light: '#D4A55E',
          dark: '#8A6A35',
          muted: '#E8DCC8',
        },
        // shadcn/ui CSS variable colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(74, 63, 51, 0.08), 0 4px 16px -4px rgba(74, 63, 51, 0.04)',
        'soft-md': '0 4px 12px -2px rgba(74, 63, 51, 0.10), 0 8px 24px -4px rgba(74, 63, 51, 0.06)',
        'soft-lg': '0 8px 24px -4px rgba(74, 63, 51, 0.12), 0 16px 48px -8px rgba(74, 63, 51, 0.08)',
        'warm': '0 1px 3px rgba(181, 138, 69, 0.08), 0 4px 12px rgba(181, 138, 69, 0.04)',
        'editorial': '0 24px 48px -12px rgba(74, 63, 51, 0.15)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
