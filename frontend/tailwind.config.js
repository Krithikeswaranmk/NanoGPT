/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          50:  '#f8f9fb',
          100: '#f0f2f7',
          200: '#e2e6ef',
          800: '#1a1d27',
          850: '#141720',
          900: '#0f1117',
          950: '#090b10',
        },
        accent: {
          400: '#7c6ff7',
          500: '#6c63f6',
          600: '#5a51e0',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
        },
        amber: { 400: '#fbbf24' },
        coral: { 400: '#f87171' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease',
        'slide-up':   'slideUp 0.35s ease',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'thinking':   'thinking 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        thinking: { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
