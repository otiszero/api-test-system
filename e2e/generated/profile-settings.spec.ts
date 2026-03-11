// Auto-generated from: features/profile-settings.feature
// Generated at: 2026-03-10T01:47:20.476Z
// DO NOT EDIT — regenerate with /generate-e2e profile-settings

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Organization Profile Settings', () => {

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
    await page.goto(e2eConfig.pages['profile-settings'] || '/profile-settings');
    await page.waitForLoadState('networkidle');
  });

  test('Profile Settings page loads', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Profile Settings').first()).toBeVisible();
  });

  test('Organization Profile tab is active by default', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Organization Profile').first()).toBeVisible();
    await expect(page.getByText('Verified Organization').first()).toBeVisible();
  });

  test('Business information section is visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Business Information').first()).toBeVisible();
    await expect(page.getByText('Legal business name').first()).toBeVisible();
    await expect(page.getByText('Trading name').first()).toBeVisible();
    await expect(page.getByText('Business type').first()).toBeVisible();
    await expect(page.getByText('Country of incorporation').first()).toBeVisible();
  });

  test('Legal registration section is visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Legal & Registration Information').first()).toBeVisible();
  });

  test('Ownership section is visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Ownership & Control').first()).toBeVisible();
  });

  test('Subscription tab is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.getByRole('button', { name: 'Subscription' }).click();
    await expect(page.getByText('Subscription').first()).toBeVisible();
  });

  test('Payment tab is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.getByRole('button', { name: 'Payment' }).click();
    await expect(page.getByText('Payment').first()).toBeVisible();
  });
});
