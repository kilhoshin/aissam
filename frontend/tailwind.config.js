/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'math': '#3B82F6',
        'english': '#EF4444', 
        'korean': '#10B981',
        'social': '#F97316',
        'science': '#8B5CF6',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
