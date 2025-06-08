module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    'jest-canvas-mock/lib/index.js',
    '<rootDir>/tests/setup.js'
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'resources/js/**/*.js',
    '!resources/js/**/*.min.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  globals: {
    'fabric': {},
    'jQuery': {},
    '$': {}
  }
};