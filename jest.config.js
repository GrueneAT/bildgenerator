module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'resources/js/**/*.js',
    '!resources/js/**/*.min.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/resources/$1'
  },
  globals: {
    'fabric': {},
    'jQuery': {},
    '$': {},
    'FontFaceObserver': {}
  }
};