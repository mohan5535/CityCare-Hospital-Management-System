/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB', // Healthcare blue
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
        },
        navy: {
          900: '#102A56', // Deep navy
          800: '#172033', // Primary text
          700: '#1E293B',
          600: '#334155',
        },
        teal: {
          400: '#14B8A6',
          500: '#0F9D92', // Healthcare teal
          600: '#0D8A80',
          700: '#0B726A',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // Secondary text
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        ice: '#EAF3FF', // Light blue
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(16, 42, 86, 0.05)',
        'soft': '0 10px 30px -5px rgba(16, 42, 86, 0.08), 0 4px 12px -2px rgba(16, 42, 86, 0.03)',
        'soft-xl': '0 20px 40px -10px rgba(16, 42, 86, 0.12), 0 8px 16px -4px rgba(16, 42, 86, 0.04)',
        'floating': '0 25px 50px -12px rgba(37, 99, 235, 0.25)',
      },
    },
  },
  plugins: [],
};
