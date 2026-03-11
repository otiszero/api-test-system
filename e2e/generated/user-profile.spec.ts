// Auto-generated from: features/user-profile.feature
// Generated at: 2026-03-10T01:47:20.477Z
// DO NOT EDIT — regenerate with /generate-e2e user-profile

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('User Profile & Settings', () => {

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
  });

  test('Navigate to user profile', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['user-profile'] || '/user-profile');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Profile & Settings').first()).toBeVisible();
  });

  test('Account tab shows user info', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['user-profile'] || '/user-profile');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Account').first()).toBeVisible();
    await expect(page.getByText('Verified Profile').first()).toBeVisible();
    await expect(page.getByText('Tienkim').first()).toBeVisible();
  });

  test('Password Setting tab is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['user-profile'] || '/user-profile');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Password Setting' }).click();
    await expect(page.getByText('Password Setting').first()).toBeVisible();
  });

  test('Settings & Preferences tab is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['user-profile'] || '/user-profile');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Settings & Preferences' }).click();
    await expect(page.getByText('Settings & Preferences').first()).toBeVisible();
  });

  test('Reset 2FA tab is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['user-profile'] || '/user-profile');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Reset 2FA' }).click();
    await expect(page.getByText('Reset 2FA').first()).toBeVisible();
  });
});
