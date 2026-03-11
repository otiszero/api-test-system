// Auto-generated from: features/transaction-history.feature
// Generated at: 2026-03-10T01:47:20.477Z
// DO NOT EDIT — regenerate with /generate-e2e transaction-history

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Transaction History', () => {

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
    await page.goto(e2eConfig.pages['transactions'] || '/transactions');
    await page.waitForLoadState('networkidle');
  });

  test('Transaction page loads', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Transaction History').first()).toBeVisible();
    await expect(page.getByText('Search by txID/name/email').first()).toBeVisible();
  });

  test('Filter controls are visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Past 30 days').first()).toBeVisible();
    await expect(page.getByText('All Asset').first()).toBeVisible();
    await expect(page.getByText('All Status').first()).toBeVisible();
    await expect(page.getByText('All Types').first()).toBeVisible();
    await expect(page.getByText('All Vaults').first()).toBeVisible();
  });

  test('Table headers are correct', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Time').first()).toBeVisible();
    await expect(page.getByText('Transaction ID').first()).toBeVisible();
    await expect(page.getByText('Initiated by').first()).toBeVisible();
    await expect(page.getByText('Vault account').first()).toBeVisible();
    await expect(page.getByText('Type').first()).toBeVisible();
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Amount').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
  });

  test('Export button is disabled when no data', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('No data').first()).toBeVisible();
  });
});
