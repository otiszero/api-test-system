// Auto-generated from: features/login.feature
// Generated at: 2026-03-08T13:28:08.997Z
// DO NOT EDIT — regenerate with /generate-e2e login

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json';

test.describe('Login Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(e2eConfig.pages['login'] || '/login');
  });

  test('Successful login', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.locator('[data-testid="email"]').fill('owner@test.com');
    await page.locator('[data-testid="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(new RegExp('/dashboard'));
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('Login validation - empty email', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.locator('[data-testid="email"]').fill('');
    await page.locator('[data-testid="password"]').fill('TestPassword1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Required')).toBeVisible();
  });

  test('Login validation - empty password', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.locator('[data-testid="email"]').fill('owner@test.com');
    await page.locator('[data-testid="password"]').fill('');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Required')).toBeVisible();
  });

  test('Login validation - invalid email', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.locator('[data-testid="email"]').fill('notanemail');
    await page.locator('[data-testid="password"]').fill('TestPassword1!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email')).toBeVisible();
  });

  test('Login validation - wrong password', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.locator('[data-testid="email"]').fill('owner@test.com');
    await page.locator('[data-testid="password"]').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});
