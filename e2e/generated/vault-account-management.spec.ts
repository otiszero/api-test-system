// Auto-generated from: features/vault-account-management.feature
// Generated at: 2026-03-10T01:47:20.477Z
// DO NOT EDIT — regenerate with /generate-e2e vault-account-management

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Vault Account Management', () => {

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
    await page.goto(e2eConfig.pages['vault-account-management'] || '/vault-account-management');
    await page.waitForLoadState('networkidle');
  });

  test('Vault Account Management page loads', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Vault Account Management').first()).toBeVisible();
    await expect(page.getByText('Search by vault account name').first()).toBeVisible();
  });

  test('Create vault account button is visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Create vault account').first()).toBeVisible();
  });

  test('Table headers are correct', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Vault account').first()).toBeVisible();
    await expect(page.getByText('Vault balance').first()).toBeVisible();
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Member').first()).toBeVisible();
    await expect(page.getByText('Action').first()).toBeVisible();
  });
});
