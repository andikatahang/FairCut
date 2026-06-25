/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FBFBFB',
          50: '#FFFFFF',
          100: '#FBFBFB',
          200: '#F5F5F5',
        },
        navy: {
          DEFAULT: '#022E57',
          50: '#E6EEF5',
          100: '#C0D4E6',
          200: '#8AAECC',
          300: '#5489B3',
          400: '#2E6D9E',
          500: '#022E57',
          600: '#02264A',
          700: '#011E3B',
          800: '#01162C',
          900: '#000E1C',
        },
        surface: '#FFFFFF',
        border: '#E8EDF2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(2,46,87,0.06), 0 1px 2px -1px rgba(2,46,87,0.04)',
        'card-md': '0 4px 12px 0 rgba(2,46,87,0.08), 0 2px 4px -2px rgba(2,46,87,0.05)',
        'card-lg': '0 10px 30px 0 rgba(2,46,87,0.10), 0 4px 8px -4px rgba(2,46,87,0.06)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
