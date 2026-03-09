// Auto-generated from: features/wallet-connect.feature
// Generated at: 2026-03-09T07:01:07.541Z
// DO NOT EDIT — regenerate with /generate-e2e wallet-connect

import { test, expect } from '../fixtures/wallet-fixtures.js';
import e2eConfig from '../../config/e2e.config.json' with { type: 'json' };

test.describe('MetaMask Wallet Connection', () => {

  test('Connect MetaMask to dApp', async ({ page, metamask }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['dashboard'] || '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await metamask.connectToDapp();
    await expect(page.getByText('Connected').first()).toBeVisible();
  });

  test('Sign a message with MetaMask', async ({ page, metamask }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['dashboard'] || '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await metamask.connectToDapp();
    await page.getByRole('button', { name: 'Sign Message' }).click();
    await metamask.confirmSignature();
    await expect(page.getByText('Signature verified').first()).toBeVisible();
  });

  test('Approve a transaction', async ({ page, metamask }) => {
    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
    await page.goto(e2eConfig.pages['dashboard'] || '/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    await metamask.connectToDapp();
    await page.getByRole('button', { name: 'Send Transaction' }).click();
    await metamask.confirmTransaction();
    await expect(page.getByText('Transaction confirmed').first()).toBeVisible();
  });
});
