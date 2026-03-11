// Auto-generated from: features/action-log.feature
// Generated at: 2026-03-10T01:47:20.463Z
// DO NOT EDIT — regenerate with /generate-e2e action-log

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Action Log', () => {

  test.beforeEach(async ({ page }) => {
    const account = e2eConfig.accounts['owner'];
    await page.goto(e2eConfig.pages['login'] || '/');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(account.emailPlaceholder || 'Enter email address').fill(account.email);
    await page.getByPlaceholder(account.passwordPlaceholder || 'Enter password').fill(account.password);
    await page.getByRole('button', { name: account.submitButton || 'Continue' }).click();
    // Wait for 2FA page, then type OTP digits sequentially into first input (auto-advances)
    const otpInput = page.getByRole('textbox', { name: 'Please enter OTP character 1' });
    await otpInput.waitFor({ state: 'visible', timeout: 15000 });
    const otpCode = generateTOTP(account.totpSecret);
    await otpInput.click();
    await page.keyboard.type(otpCode, { delay: 50 });
    await page.getByRole('button', { name: account.totpSubmitButton || 'Verify' }).click();
    await page.waitForLoadState('networkidle');
    await page.goto(e2eConfig.pages['action-log'] || '/action-log');
    await page.waitForLoadState('networkidle');
  });

  test('Action Log page loads', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Action Log').first()).toBeVisible();
    await expect(page.getByText('Enter actor, service or details').first()).toBeVisible();
  });

  test('Filter controls are visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Past 30 days').first()).toBeVisible();
    await expect(page.getByText('All Roles').first()).toBeVisible();
    await expect(page.getByText('Export').first()).toBeVisible();
  });

  test('Table headers are correct', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Timestamp').first()).toBeVisible();
    await expect(page.getByText('Actor').first()).toBeVisible();
    await expect(page.getByText('Role').first()).toBeVisible();
    await expect(page.getByText('Service').first()).toBeVisible();
    await expect(page.getByText('Details').first()).toBeVisible();
  });

  test('Login action is logged', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('User logged in').first()).toBeVisible();
    await expect(page.getByText('AuthService').first()).toBeVisible();
  });
});
