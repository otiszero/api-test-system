// Auto-generated from: features/login-2fa.feature
// Generated at: 2026-03-09T08:42:25.394Z
// DO NOT EDIT — regenerate with /generate-e2e login-2fa

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { generateTOTP } from '../helpers/totp-helper.js';

test.describe('Login with 2FA', () => {

  test('Login with 2FA using account config', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
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
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });
});
