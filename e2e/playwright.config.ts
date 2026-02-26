import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:7564",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "cd ../backend && npm run dev",
      port: 7563,
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    },
    {
      command: "cd ../frontend && npm run dev",
      port: 7564,
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  ]
})
