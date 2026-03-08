import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load E2E config
const e2eConfigPath = resolve(__dirname, '../config/e2e.config.json');
const e2eConfig = JSON.parse(readFileSync(e2eConfigPath, 'utf-8'));

const browserDeviceMap: Record<string, string> = {
  chromium: 'Desktop Chrome',
  firefox: 'Desktop Firefox',
  webkit: 'Desktop Safari',
};

export default defineConfig({
  testDir: './generated',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: e2eConfig.timeout,

  reporter: [
    ['list'],
    ['html', { outputFolder: '../reports/e2e', open: 'never' }],
  ],

  use: {
    baseURL: e2eConfig.appUrl,
    trace: e2eConfig.tracing,
    screenshot: e2eConfig.screenshots,
    video: e2eConfig.video,
    viewport: e2eConfig.viewport,
  },

  projects: [
    {
      name: e2eConfig.browser,
      use: { ...devices[browserDeviceMap[e2eConfig.browser] || 'Desktop Chrome'] },
    },
  ],

  outputDir: './test-results',
});
