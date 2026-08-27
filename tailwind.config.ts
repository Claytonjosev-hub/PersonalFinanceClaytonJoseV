import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        positive: 'rgb(var(--color-positive) / <alpha-value>)',
        negative: 'rgb(var(--color-negative) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        'accent-muted': 'rgb(var(--color-accent-muted) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(var(--shadow-color) / 0.04), 0 1px 3px 0 rgb(var(--shadow-color) / 0.06)',
        panel: '0 4px 6px -1px rgb(var(--shadow-color) / 0.08), 0 2px 4px -2px rgb(var(--shadow-color) / 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
