import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 12 : undefined,
  reporter: 'html',
  timeout: 10000,
  use: {
    baseURL: 'http://127.0.0.1:1111',
    trace: 'on-first-retry',
    actionTimeout: 5000,
    screenshot: {
      mode: 'only-on-failure',
    },
  },

  // Global screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,  // Allow up to 2% pixel difference
      timeout: 10000,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run the local dev server before starting tests
  webServer: {
    command: 'zola serve',
    url: 'http://127.0.0.1:1111',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
