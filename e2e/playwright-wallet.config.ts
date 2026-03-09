/**
 * Separate Playwright config for wallet (MetaMask) tests.
 * Uses persistent browser context — headless:false required for extensions.
 * Runs sequentially (workers:1) since wallet state is shared per context.
 */

import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const e2eConfigPath = resolve(__dirname, '../config/e2e.config.json');
const e2eConfig = JSON.parse(readFileSync(e2eConfigPath, 'utf-8'));

export default defineConfig({
  testDir: './generated-wallet',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: e2eConfig.timeout ?? 30000,
  expect: {
    timeout: e2eConfig.expectTimeout ?? 15000,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: '../reports/e2e-wallet', open: 'never' }],
  ],

  use: {
    baseURL: e2eConfig.appUrl,
    trace: e2eConfig.tracing ?? 'retain-on-failure',
    screenshot: e2eConfig.screenshots ?? 'on-failure',
    video: e2eConfig.video ?? 'retain-on-failure',
    viewport: e2eConfig.viewport,
    ...(e2eConfig.basicAuth && {
      httpCredentials: {
        username: e2eConfig.basicAuth.username,
        password: e2eConfig.basicAuth.password,
      },
    }),
    ignoreHTTPSErrors: true,
  },

  // Synpress only supports Chromium (extension API required)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: './wallet-test-results',
});
