/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#1FB6C6',
          tealDark: '#1699A7',
          tealLight: '#E8F9FB',
          cyan: '#1FB6C6',
          orange: '#EA580C',
          orangeDark: '#C2410C',
          orangeLight: '#FFF1EA',
          peach: '#FFF6F3',
          green: '#8AC443',
          dark: '#18181B',
          muted: '#52525B',
          border: '#E4E4E7',
          surface: '#FFFFFF',
          background: '#FAF8F5',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
