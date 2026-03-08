// Auto-generated from: features/health-check.feature
// Generated at: 2026-03-08T13:28:08.992Z
// DO NOT EDIT — regenerate with /generate-e2e health-check

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json';
import { apiClient } from '../../generated/helpers/api-client.js';
import { authHelper } from '../../generated/helpers/auth-helper.js';

test.describe('Health Check', () => {

  test('API health endpoint responds', async () => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    authHelper.setAuthToken('owner');
    ctx.lastApiResponse = await apiClient.get('/health');
    expect(ctx.lastApiResponse.status).toBe(200);
    expect(ctx.lastApiResponse.data).toHaveProperty('status');
  });

  test('Web app is accessible', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto('/');
    await expect(page.getByText('Login')).toBeVisible();
  });
});
