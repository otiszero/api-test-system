import { apiClient } from './api-client';
import { authHelper } from './auth-helper';
import { cleanup } from './cleanup';
import type { IntegrationContext } from './integration-needs';

/**
 * Provider function signature.
 * Each provider sets up one resource, populates ctx, and tracks cleanup.
 */
export type ResourceProvider = (ctx: IntegrationContext) => Promise<void>;

/**
 * Registry: resource name → async provider that populates IntegrationContext.
 *
 * Providers MUST:
 *  - call API(s) to set up or read the resource
 *  - store relevant IDs / data into ctx.data[key]
 *  - track mutable resources via cleanup.track() for afterAll teardown
 *
 * Providers MAY skip gracefully (console.warn) when prerequisite data
 * is missing — the wrapping withNeeds() resolves deps in priority order,
 * so earlier providers run first.
 */
const providers: Record<string, ResourceProvider> = {
  // -----------------------------------------------------------------------
  // Priority 2 — auth token (no API dep, reads config)
  // -----------------------------------------------------------------------
  'Users auth': async (ctx) => {
    const token = authHelper.getToken('user', 'default');
    if (!token) {
      console.warn('[needs] Users auth: no valid token in auth.config.json');
      return;
    }
    ctx.ownerToken = token;
    apiClient.setToken(token);

    // Also grab secondary user token if available
    const secondToken = authHelper.getToken('user', 'user normal');
    if (secondToken) ctx.data.normalUserToken = secondToken;
  },

  // -----------------------------------------------------------------------
  // Priority 1 — public endpoints
  // -----------------------------------------------------------------------
  Country: async (ctx) => {
    const res = await apiClient.get('/api/countries');
    if (res.status === 200) {
      const list = res.data?.data ?? res.data;
      if (Array.isArray(list) && list.length > 0) {
        ctx.data.countryId = list[0].id;
        ctx.data.countries = list;
      }
    }
  },

  // -----------------------------------------------------------------------
  // Priority 3 — requires token
  // -----------------------------------------------------------------------
  'User Profile': async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.get('/api/users/profile/me');
    if (res.status === 200) {
      const profile = res.data?.data ?? res.data;
      ctx.data.profile = profile;
      ctx.data.orgId =
        profile?.organizationId ?? profile?.organization?.id ?? null;
    }
  },

  Files: async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.post(
      '/api/users/files/private-storage/presigned-post',
      { type: 'kyb', fileName: `needs-setup-${Date.now()}.pdf` },
    );
    if (res.status === 200 || res.status === 201) {
      const data = res.data?.data ?? res.data;
      ctx.data.presignedPost = data;
      ctx.data.fileId = data?.fileId ?? data?.id ?? null;
    }
  },

  'Organization RBAC Management': async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.get('/api/users/rbac/roles');
    if (res.status === 200) {
      ctx.data.roles = res.data?.data ?? res.data;
    }
  },

  // -----------------------------------------------------------------------
  // Priority 4 — depends on auth + other resources
  // -----------------------------------------------------------------------
  'Organization Kyb': async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.get(
      '/api/users/organization-kyb/kyb-status',
    );
    if (res.status === 200) {
      ctx.data.kybStatus = res.data?.data ?? res.data;
    }
  },

  // -----------------------------------------------------------------------
  // Priority 5 — depends on profile + KYB
  // -----------------------------------------------------------------------
  'Vault Accounts': async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.get('/api/users/vault-accounts');
    if (res.status !== 200) return;

    const vaults = res.data?.data ?? res.data;
    if (Array.isArray(vaults) && vaults.length > 0) {
      ctx.data.vaultId = vaults[0].id;
      ctx.data.vaults = vaults;
    }
  },

  // -----------------------------------------------------------------------
  // Priority 6 — depends on vault
  // -----------------------------------------------------------------------
  'User Transactions': async (ctx) => {
    if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    const res = await apiClient.get('/api/users/transactions');
    if (res.status !== 200) return;

    const txns = res.data?.data ?? res.data;
    if (Array.isArray(txns) && txns.length > 0) {
      ctx.data.transactionId = txns[0].id;
      ctx.data.transactions = txns;
    }
  },
};

export function getProvider(
  resource: string,
): ResourceProvider | undefined {
  return providers[resource];
}

export default providers;
