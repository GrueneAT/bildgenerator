/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./resources/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'gruene-primary': '#257639',
        'gruene-secondary': '#56AF31',
        'gruene-dark': '#1a5428',
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