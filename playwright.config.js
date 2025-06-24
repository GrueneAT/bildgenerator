import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.js", "visual-regression/**/*.spec.js"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:8000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "make server",
    url: "http://localhost:8000",
    reuseExistingServer: !process.env.CI,
  },
});
