// Auto-generated from: features/kyc-submission.feature
// Generated at: 2026-03-08T13:28:08.996Z
// DO NOT EDIT — regenerate with /generate-e2e kyc-submission

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json';
import { apiClient } from '../../generated/helpers/api-client.js';
import { authHelper } from '../../generated/helpers/auth-helper.js';

test.describe('KYC Submission', () => {

  test('Submit KYC and verify via API', async ({ page }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    authHelper.setAuthToken('owner');
    await page.goto(e2eConfig.pages['kyc/status'] || '/kyc/status');
    await expect(page.getByText('KYC')).toBeVisible();
    ctx.lastApiResponse = await apiClient.get('/kyb');
    expect(ctx.lastApiResponse.status).toBe(200);
  });
});
