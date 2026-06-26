/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F8F8F8',
          50: '#FFFFFF',
          100: '#F8F8F8',
          200: '#F0F0F0',
        },
        navy: {
          DEFAULT: '#021526',
          50:  '#E5EBF0',
          100: '#BECDD7',
          200: '#88AABF',
          300: '#5287A6',
          400: '#2C6A8C',
          500: '#021526',
          600: '#011120',
          700: '#010C19',
          800: '#010811',
          900: '#000408',
        },
        charcoal: {
          DEFAULT: '#2b2b2b',
          50:  '#F5F5F5',
          100: '#EBEBEB',
          200: '#D6D6D6',
          300: '#ADADAD',
          400: '#707070',
          500: '#2b2b2b',
          600: '#222222',
          700: '#1a1a1a',
          800: '#111111',
          900: '#080808',
        },
        surface: '#FFFFFF',
        border: '#E4E4E4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 30px 0 rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)',
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
