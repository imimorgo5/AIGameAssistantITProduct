import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node tests/e2e/backend.cjs",
      url: "http://127.0.0.1:8100/api/categories",
      reuseExistingServer: false,
    },
    {
      command: "npm run start",
      url: "http://127.0.0.1:3100/healthz",
      env: {
        PORT: "3100",
        HOSTNAME: "127.0.0.1",
        BACKEND_URL: "http://127.0.0.1:8100",
        APP_PUBLIC_URL: "http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
    },
  ],
});
