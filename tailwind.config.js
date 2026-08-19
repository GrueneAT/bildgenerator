/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./resources/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors are wired to the Gruene-AT design-system tokens
        // (loaded via the design-system.css CDN). Static fallback values
        // ensure the build keeps the brand look if the DS stylesheet
        // ever fails to load.
        'gruene-primary': 'var(--gat-color-primary, #257639)',
        'gruene-secondary': 'var(--gat-color-secondary, #3e8a25)',
        'gruene-dark': 'var(--gat-web-green-deep, #1a5428)',
        'gruene-magenta': 'var(--gat-color-magenta, #e6007e)',
        'gruene-gelb': 'var(--gat-color-gelb, #ffed00)',
      },
      fontFamily: {
        'gotham': ['Gotham Narrow', 'Arial', 'sans-serif'],
        'gotham-bold': ['Gotham Narrow', 'Arial Black', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}