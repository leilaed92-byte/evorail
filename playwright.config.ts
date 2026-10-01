import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174',
    extraHTTPHeaders: {Origin: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
