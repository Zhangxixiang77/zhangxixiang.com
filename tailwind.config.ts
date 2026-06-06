import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-fraunces)', 'var(--font-noto-serif-sc)', 'serif'],
        sans: [
          'var(--font-geist)',
          'var(--font-noto-sans-sc)',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-soft': 'rgb(var(--paper-soft) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        // Sky and star are constant hex (used directly in Sky.tsx)
        sky: '#0E1A2C',
        star: '#F8F1E1',
      },
      letterSpacing: {
        widest: '0.18em',
        ultra: '0.35em',
      },
      animation: {
        twinkle: 'twinkle var(--twinkle-duration, 4s) ease-in-out infinite',
        fadeup: 'fadeup 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.78' },
          '50%': { opacity: '1' },
        },
        fadeup: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
