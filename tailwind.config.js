/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        negative: '#C81E2D',
        paper: { DEFAULT: '#F7F4EF', deep: '#EFE9E1' },
        ink: { DEFAULT: '#1C1917', soft: '#57534E', mute: '#8A837D' },
        ruby: {
          50: '#FBF1F0',
          100: '#F6DEDF',
          200: '#ECBDBF',
          300: '#DA8E93',
          400: '#C4545D',
          500: '#B02C37',
          600: '#9B1F2A',
          700: '#8B1A24',
          800: '#74101B',
          900: '#5E0B14',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        sheet: '0 1px 2px rgba(28,25,23,.06), 0 8px 24px -6px rgba(28,25,23,.12), 0 30px 60px -30px rgba(94,11,20,.25)',
      },
    },
  },
  plugins: [],
};
