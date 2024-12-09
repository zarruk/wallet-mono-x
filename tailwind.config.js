/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          purple: '#8B3DFF', // Color principal morado
          dark: '#14141F',   // Color de fondo oscuro
          pink: '#FF3DFF',   // Color de acento rosado
          gray: '#2A2A3B',   // Color gris para elementos secundarios
        }
      }
    },
  },
  plugins: [],
} 