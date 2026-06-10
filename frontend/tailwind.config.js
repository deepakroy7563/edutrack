/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bcceff',
          300: '#90afff',
          400: '#5c86ff',
          500: '#3b5cff',
          600: '#253eff',
          700: '#1d2ee4',
          800: '#1a27b8',
          900: '#1c2791',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
