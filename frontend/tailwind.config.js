/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c0d2ff',
          300: '#8aaeff',
          400: '#4d82ff',
          500: '#1a56ff',
          600: '#0038e6',
          700: '#002bbf',
          800: '#00249c',
          900: '#001a7a',
          950: '#030e3d',
        },
        slate: {
          750: '#293548',
          850: '#1a2535',
          950: '#0d1526',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
