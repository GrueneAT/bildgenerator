/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./resources/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'gruene-primary': '#8AB414',
        'gruene-secondary': '#538430',
        'gruene-dark': '#2D5016',
      },
      fontFamily: {
        'gotham': ['Gotham Narrow', 'Arial', 'sans-serif'],
        'gotham-bold': ['Gotham Narrow Bold', 'Arial Black', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}