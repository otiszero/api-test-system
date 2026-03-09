// Auto-generated from: features/vault-management.feature
// Generated at: 2026-03-09T03:20:23.995Z
// DO NOT EDIT — regenerate with /generate-e2e vault-management

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };
import { apiClient } from '../../generated/helpers/api-client.js';
import { authHelper } from '../../generated/helpers/auth-helper.js';

test.describe('Vault Management', () => {

  test.beforeEach(async ({ page }) => {
    authHelper.setAuthToken('owner');
  });

  test('View vault list page', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['vault/accounts'] || '/vault/accounts');
    await expect(page.getByText('Vault')).toBeVisible();
  });

  test('API vault list returns data', async () => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    ctx.lastApiResponse = await apiClient.get('/vaults');
    expect(ctx.lastApiResponse.status).toBe(200);
    expect(ctx.lastApiResponse.data).toHaveProperty('data');
  });
});
