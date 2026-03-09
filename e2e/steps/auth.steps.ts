/**
 * Auth step definitions — login flows with optional 2FA/TOTP support.
 * Uses accounts from e2e.config.json for credentials + TOTP secrets.
 */

import { StepDef } from './types.js';

export const authSteps: StepDef[] = [
  {
    pattern: 'I login as "{user}" with 2FA',
    generateCode: ([user]) =>
      [
        `const account = e2eConfig.accounts['${user}'];`,
        `await page.goto(e2eConfig.pages['login'] || '/');`,
        `await page.waitForLoadState('networkidle');`,
        `await page.getByPlaceholder(account.emailPlaceholder || 'Enter email address').fill(account.email);`,
        `await page.getByPlaceholder(account.passwordPlaceholder || 'Enter password').fill(account.password);`,
        `await page.getByRole('button', { name: account.submitButton || 'Continue' }).click();`,
        `// Wait for 2FA page, then type OTP digits sequentially into first input (auto-advances)`,
        `const otpInput = page.getByRole('textbox', { name: 'Please enter OTP character 1' });`,
        `await otpInput.waitFor({ state: 'visible', timeout: 15000 });`,
        `const otpCode = generateTOTP(account.totpSecret);`,
        `await otpInput.click();`,
        `await page.keyboard.type(otpCode, { delay: 50 });`,
        `await page.getByRole('button', { name: account.totpSubmitButton || 'Verify' }).click();`,
        `await page.waitForLoadState('networkidle');`,
      ].join('\n'),
  },
  {
    pattern: 'I login as "{user}"',
    generateCode: ([user]) =>
      [
        `const account = e2eConfig.accounts['${user}'];`,
        `await page.goto(e2eConfig.pages['login'] || '/');`,
        `await page.waitForLoadState('networkidle');`,
        `await page.getByPlaceholder(account.emailPlaceholder || 'Enter email address').fill(account.email);`,
        `await page.getByPlaceholder(account.passwordPlaceholder || 'Enter password').fill(account.password);`,
        `await page.getByRole('button', { name: account.submitButton || 'Continue' }).click();`,
        `await page.waitForLoadState('networkidle');`,
      ].join('\n'),
  },
];
