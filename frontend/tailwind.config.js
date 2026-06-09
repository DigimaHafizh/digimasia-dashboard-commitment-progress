/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: { DEFAULT: '#1A4A7A', light: '#3A7AB8', dark: '#0F2D4E' },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    }
  },
  plugins: []
}
