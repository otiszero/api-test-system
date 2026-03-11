// Auto-generated from: features/member-management.feature
// Generated at: 2026-03-10T01:47:20.475Z
// DO NOT EDIT — regenerate with /generate-e2e member-management

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Member Management', () => {

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
    await page.goto(e2eConfig.pages['members'] || '/members');
    await page.waitForLoadState('networkidle');
  });

  test('Member Management page loads', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Member Management').first()).toBeVisible();
    await expect(page.getByText('Search by member name or email').first()).toBeVisible();
  });

  test('Filter and action controls are visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('All access').first()).toBeVisible();
    await expect(page.getByText('All Account Status').first()).toBeVisible();
    await expect(page.getByText('Export').first()).toBeVisible();
    await expect(page.getByText('Invite').first()).toBeVisible();
  });

  test('Table headers are correct', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Member').first()).toBeVisible();
    await expect(page.getByText('Joined Date').first()).toBeVisible();
    await expect(page.getByText('Access').first()).toBeVisible();
    await expect(page.getByText('Account Status').first()).toBeVisible();
  });

  test('Owner account is listed', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Tienkim').first()).toBeVisible();
    await expect(page.getByText('Owner').first()).toBeVisible();
    await expect(page.getByText('Active').first()).toBeVisible();
  });
});
