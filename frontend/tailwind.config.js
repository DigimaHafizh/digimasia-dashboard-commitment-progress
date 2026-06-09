/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#4F46E5', light: '#818CF8', dark: '#3730A3' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    }
  },
  plugins: []
}
