import { defineConfig, devices } from "@playwright/test";
import { cpus } from "os";

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.js", "visual-regression/**/*.spec.js"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 
    Math.min(6, Math.ceil(cpus().length * 0.75)) : 
    undefined,
  reporter: "list", // Simple stdout reporter
  timeout: 30000, // Increased timeout for visual tests
  expect: { timeout: 10000 }, // Longer timeout for visual comparisons
  use: {
    baseURL: "http://localhost:8000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    headless: true,
    launchOptions: {
      args: [
        '--font-render-hinting=none',           // Disable font hinting for consistency
        '--disable-font-subpixel-positioning',  // Prevent subpixel positioning differences
        '--disable-lcd-text',                   // Disable LCD text anti-aliasing
        '--force-device-scale-factor=1',        // Consistent DPI scaling
        '--disable-gpu',                         // Use software rendering for consistency
        '--disable-dev-shm-usage',              // Prevent shared memory issues in CI
        '--no-sandbox',                          // CI compatibility
      ]
    }
  },
  projects: [
    {
      name: "fast-tests",
      testMatch: [
        "**/core-functionality.spec.js",
        "**/elements.spec.js",
        "**/layouts.spec.js",
        "**/logo-positioning-debug.spec.js"
      ],
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "medium-tests",
      testMatch: [
        "**/text-system.spec.js",
        "**/positioning.spec.js",
        "**/background-images.spec.js",
        "**/qr-codes.spec.js",
        "**/logo-toggle.spec.js",
        "**/logo-text-positioning.spec.js"
      ],
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "complex-tests",
      testMatch: [
        "**/qr-generator.spec.js",
        "**/templates.spec.js",
        "**/error-handling.spec.js",
        "**/wizard-navigation.spec.js"
      ],
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "e2e-tests",
      testMatch: ["e2e/**/*.spec.js"],
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "make serve-build",
    url: "http://localhost:8000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
