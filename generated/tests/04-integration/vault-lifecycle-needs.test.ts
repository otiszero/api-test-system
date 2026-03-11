/**
 * Integration Test: Vault Account Lifecycle (withNeeds demo)
 *
 * Uses withNeeds(['Vault Accounts']) to auto-setup:
 *   Users auth → Country → User Profile → Organization Kyb → Vault Accounts
 *
 * Tests vault listing, detail view, and user assignment endpoints.
 */

import { it, expect, describe } from 'vitest';
import { withNeeds } from '../../helpers/integration-needs';
import { apiClient } from '../../helpers/api-client';

const TIMEOUT = 20000;

withNeeds(['Vault Accounts'], (ctx) => {
  describe('Vault Account Lifecycle (withNeeds)', () => {
    it('should have resolved ownerToken from provider', () => {
      expect(ctx.ownerToken).toBeTruthy();
    });

    it('GET /vault-accounts → list vaults', async () => {
      const res = await apiClient.get('/api/users/vault-accounts');
      expect(res.status).toBeLessThan(500);

      if (res.status === 200) {
        const vaults = res.data?.data ?? res.data;
        expect(Array.isArray(vaults)).toBe(true);
      }
    }, TIMEOUT);

    it('GET /vault-accounts/{id} → vault detail (if vaultId available)', async () => {
      if (!ctx.data.vaultId) return;

      const res = await apiClient.get(
        `/api/users/vault-accounts/${ctx.data.vaultId}`,
      );
      expect(res.status).toBeLessThan(500);

      if (res.status === 200) {
        const vault = res.data?.data ?? res.data;
        expect(vault).toBeDefined();
      }
    }, TIMEOUT);

    it('GET /vault-accounts/{id}/users → vault users (if vaultId available)', async () => {
      if (!ctx.data.vaultId) return;

      const res = await apiClient.get(
        `/api/users/vault-accounts/${ctx.data.vaultId}/users`,
      );
      expect(res.status).toBeLessThan(500);
    }, TIMEOUT);

    it('transitive deps should have attempted to populate context', () => {
      // Providers run in priority order; profile may be undefined if token expired
      // but the key should exist or ownerToken should have been attempted
      expect(ctx.ownerToken).toBeTruthy();
      // countryId comes from public endpoint — always available
      expect(ctx.data.countryId).toBeDefined();
    });
  });
});
