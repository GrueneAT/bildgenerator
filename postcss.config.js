module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: true,
        minifySelectors: true,
        minifyParams: true,
        minifyFontValues: true,
        convertValues: true,
        mergeRules: true,
        mergeLonghand: true,
        uniqueSelectors: true,
        reduceIdents: false, // Keep animation names readable
        zindex: false // Don't optimize z-index values
      }]
    }
  }
};