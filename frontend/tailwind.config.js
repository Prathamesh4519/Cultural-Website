/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',    // Dark Blue/Slate
          navy: '#1e3a8a',    // Navy Blue
          blue: '#2563eb',    // Bright Blue
          orange: '#f97316',  // Bright Orange
          orangeDark: '#ea580c', // Dark Orange
          light: '#f8fafc'    // Ice White/Slate 50
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
