module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: [
    "resources/js/**/*.js",
    "!resources/js/**/*.min.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/resources/$1",
  },
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs",
            },
          ],
        ],
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(resources/js)/)"],
  globals: {
    fabric: {},
    jQuery: {},
    $: {},
    FontFaceObserver: {},
  },
};
