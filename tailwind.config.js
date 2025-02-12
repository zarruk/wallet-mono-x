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
        'mono-dark': '#0F0F0F',
        'mono-gray': '#1F1F1F',
        'mono-purple': '#6D28D9',
        mpf: {
          teal: '#005E5D',      // Verde azulado principal
          lime: '#C5E75E',      // Verde lima
          coral: '#FF8B8B',     // Rosa coral
          dark: '#1A1A1A',      // Negro para textos
          gray: '#F5F5F5',      // Gris claro para fondos
          beige: '#F2F0EB',     // Beige más oscuro
          warmGray: '#EBEAE6'   // Gris cálido más oscuro para elementos
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Open Sans"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'gradient-mpf': 'linear-gradient(to right, #005E5D, #C5E75E, #FF8B8B)',
      }
    },
  },
  plugins: [],
} 