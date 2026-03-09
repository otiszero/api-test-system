// Auto-generated from: features/login.feature
// Generated at: 2026-03-09T07:01:23.594Z
// DO NOT EDIT — regenerate with /generate-e2e login

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };

test.describe('Login Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(e2eConfig.pages['login'] || '/login');
    await page.waitForLoadState('networkidle');
  });

  test('Login page is visible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await expect(page.getByText('Welcome back,').first()).toBeVisible();
    await expect(page.getByText('Enter the email with your Upmount account').first()).toBeVisible();
  });

  test('Login validation - invalid email format', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.getByPlaceholder('Enter email address').fill('notanemail');
    await page.getByPlaceholder('Enter password').fill('TestPassword1!');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Email address is invalid').first()).toBeVisible();
  });

  test('Login validation - weak password format', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.getByPlaceholder('Enter email address').fill('owner@test.com');
    await page.getByPlaceholder('Enter password').fill('wrongpass');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('At least 1 uppercase, 1 lowercase, and 1 digit').first()).toBeVisible();
  });

  test('Login validation - wrong credentials', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.getByPlaceholder('Enter email address').fill('owner@test.com');
    await page.getByPlaceholder('Enter password').fill('TestPassword1!');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Your email or password is incorrect, try again.').first()).toBeVisible();
  });
});
