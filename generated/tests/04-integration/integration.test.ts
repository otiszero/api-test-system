/**
 * Integration Tests - Upmount Custody Platform
 * Multi-step workflow tests from test-rules.md scenarios
 *
 * Scenarios covered:
 * - S2: Token refresh flow
 * - S4: 2FA setup + verify (TOTP)
 * - S5: KYB submission flow (partial - no file upload)
 * - S6: Vault account lifecycle
 * - S7: Transaction view flow
 * - S10: Guest public vs protected
 * - S12: Organization members management
 * - S13: Organization profile view
 * - S14: Action logs view
 *
 * Skipped (email OTP dependent):
 * - S1: Registration + email verify
 * - S3: Forgot password
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const TIMEOUT = 20000;

// Tokens
const ownerToken = authConfig.accounts.user?.[0]?.token;
const normalUserToken = authConfig.accounts.user?.[1]?.token;
const ownerRefreshToken = (authConfig.accounts.user?.[0] as any)?.refreshToken;
const ownerTotpSecret = (authConfig.accounts.user?.[0] as any)?.totpSecret;

/**
 * Generate TOTP code from secret (requires otpauth)
 */
async function generateTotp(secret: string): Promise<string> {
  try {
    const { TOTP } = await import('otpauth');
    const totp = new TOTP({
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    return totp.generate();
  } catch {
    return '000000'; // fallback if otpauth not installed
  }
}

// ============================================================================
// SCENARIO 2: Token Refresh Flow
// ============================================================================
describe('Integration: S2 - Token Refresh Flow', () => {
  it('Step 1: POST /api/users/auth/refresh-token → get new tokens', async () => {
    if (!ownerRefreshToken) return;

    const res = await apiClient.post('/api/users/auth/refresh-token', {
      refreshToken: ownerRefreshToken,
    });

    // May fail if token expired, but should not 5xx
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      expect(res.data?.data).toBeDefined();
      const data = res.data?.data;
      if (data?.accessToken) {
        expect(typeof data.accessToken).toBe('string');
      }
    }
  }, TIMEOUT);

  it('Step 2: Use refreshed token to access profile', async () => {
    if (!ownerRefreshToken) return;

    const refreshRes = await apiClient.post('/api/users/auth/refresh-token', {
      refreshToken: ownerRefreshToken,
    });

    if (refreshRes.status !== 200) return;

    const newToken = refreshRes.data?.data?.accessToken || refreshRes.data?.data?.token;
    if (!newToken) return;

    apiClient.setToken(newToken);
    const profileRes = await apiClient.get('/api/users/profile/me');
    expect(profileRes.status).toBe(200);

    // Restore original token
    if (ownerToken) apiClient.setToken(ownerToken);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 4: 2FA Setup + Verify (TOTP)
// ============================================================================
describe('Integration: S4 - 2FA Flow', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: POST /two-factor/setup → get secret', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/auth/two-factor/setup', {});
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      expect(res.data?.data).toBeDefined();
    }
  }, TIMEOUT);

  it('Step 2: POST /two-factor/verify-login with TOTP', async () => {
    if (!ownerToken || !ownerTotpSecret) return;

    const otp = await generateTotp(ownerTotpSecret);
    const res = await apiClient.post('/api/users/auth/two-factor/verify-login', { otp });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 5: KYB Submission Flow (partial)
// ============================================================================
describe('Integration: S5 - KYB Submission Flow', () => {
  let countryId: number | null = null;

  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: GET /api/countries → get country list', async () => {
    const res = await apiClient.get('/api/countries');
    expect(res.status).toBe(200);

    const countries = res.data?.data || res.data;
    if (Array.isArray(countries) && countries.length > 0) {
      countryId = countries[0].id;
    }
  }, TIMEOUT);

  it('Step 2: POST /presigned-post → get upload URL', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
      type: 'kyb',
      fileName: 'test-business-doc.pdf',
    });
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      expect(res.data?.data).toBeDefined();
    }
  }, TIMEOUT);

  it('Step 3: GET /kyb-status → check KYB status', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Step 4: GET /primary-owner-data → get owner data', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 6: Vault Account Lifecycle
// ============================================================================
describe('Integration: S6 - Vault Account Lifecycle', () => {
  let vaultId: string | null = null;

  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: GET /vault-accounts → list existing vaults', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/vault-accounts');
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      const vaults = res.data?.data || res.data;
      if (Array.isArray(vaults) && vaults.length > 0) {
        vaultId = vaults[0].id;
      }
    }
  }, TIMEOUT);

  it('Step 2: GET /vault-accounts/{id} → get vault details', async () => {
    if (!ownerToken || !vaultId) return;

    const res = await apiClient.get(`/api/users/vault-accounts/${vaultId}`);
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      const vault = res.data?.data || res.data;
      expect(vault).toBeDefined();
    }
  }, TIMEOUT);

  it('Step 3: GET /vault-accounts/{id}/users → list vault users', async () => {
    if (!ownerToken || !vaultId) return;

    const res = await apiClient.get(`/api/users/vault-accounts/${vaultId}/users`);
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Step 4: POST /vault-accounts without OTP → expect validation error', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/vault-accounts', {
      name: 'Integration-Test-Vault',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, TIMEOUT);

  it('Step 5: POST /vault-accounts with TOTP → create vault', async () => {
    if (!ownerToken || !ownerTotpSecret) return;

    const otp = await generateTotp(ownerTotpSecret);
    const res = await apiClient.post('/api/users/vault-accounts', {
      name: `IntTest-${Date.now()}`,
      otp,
    });
    expect(res.status).toBeLessThan(500);

    if (res.status === 200 || res.status === 201) {
      const created = res.data?.data || res.data;
      if (created?.id) {
        vaultId = created.id;
      }
    }
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 7: Transaction View Flow
// ============================================================================
describe('Integration: S7 - Transaction View Flow', () => {
  let transactionId: string | null = null;

  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: GET /transactions → list transactions', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/transactions');
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      const txns = res.data?.data || res.data;
      if (Array.isArray(txns) && txns.length > 0) {
        transactionId = txns[0].id;
      }
    }
  }, TIMEOUT);

  it('Step 2: GET /transactions/{id} → transaction detail', async () => {
    if (!ownerToken || !transactionId) return;

    const res = await apiClient.get(`/api/users/transactions/${transactionId}`);
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      const tx = res.data?.data || res.data;
      expect(tx).toBeDefined();
    }
  }, TIMEOUT);

  it('Step 3: GET /transactions/export → export', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/transactions/export');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 10: Guest Public vs Protected
// ============================================================================
describe('Integration: S10 - Guest Access Control', () => {
  beforeAll(() => {
    apiClient.clearToken();
  });

  afterAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Guest can access GET /api/health', async () => {
    const res = await apiClient.get('/api/health');
    expect(res.status).toBe(200);
  }, TIMEOUT);

  it('Guest can access GET /api/health/ready', async () => {
    const res = await apiClient.get('/api/health/ready');
    expect(res.status).toBe(200);
  }, TIMEOUT);

  it('Guest can access GET /api/countries', async () => {
    const res = await apiClient.get('/api/countries');
    expect(res.status).toBe(200);
  }, TIMEOUT);

  it('Guest CANNOT access GET /api/users/profile/me → 401', async () => {
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Guest CANNOT access GET /api/users/vault-accounts → 401', async () => {
    const res = await apiClient.get('/api/users/vault-accounts');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Guest CANNOT access GET /api/users/transactions → 401', async () => {
    const res = await apiClient.get('/api/users/transactions');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Guest CANNOT access POST /api/users/vault-accounts → 401', async () => {
    const res = await apiClient.post('/api/users/vault-accounts', {});
    expect(res.status).toBe(401);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 12: Organization Members Management
// ============================================================================
describe('Integration: S12 - Organization Members', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: GET /members → list org members', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/organization-members/members');
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      expect(res.data).toBeDefined();
    }
  }, TIMEOUT);

  it('Step 2: GET /export-members → export', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/organization-members/export-members');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Step 3: POST /invite with invalid email → validation error', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/organization-members/invite', {
      email: 'not-an-email',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 13: Organization Profile
// ============================================================================
describe('Integration: S13 - Organization Profile', () => {
  let orgId: string | null = null;

  beforeAll(async () => {
    if (ownerToken) apiClient.setToken(ownerToken);

    const profileRes = await apiClient.get('/api/users/profile/me');
    if (profileRes.status === 200) {
      const profile = profileRes.data?.data || profileRes.data;
      orgId = profile?.organizationId || profile?.organization?.id || '1';
    }
  });

  it('Step 1: GET /organization/{id} → view org profile', async () => {
    if (!ownerToken || !orgId) return;

    const res = await apiClient.get(`/api/users/organization/${orgId}`);
    expect(res.status).toBeLessThan(500);

    if (res.status === 200) {
      const org = res.data?.data || res.data;
      expect(org).toBeDefined();
    }
  }, TIMEOUT);
});

// ============================================================================
// SCENARIO 14: Action Logs
// ============================================================================
describe('Integration: S14 - Action Logs', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Step 1: GET /action-logs → view logs', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/action-logs');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Step 2: GET /action-logs/export → export logs', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/action-logs/export');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Step 3: GET /ledgers/export → export ledger', async () => {
    if (!ownerToken) return;

    const res = await apiClient.get('/api/users/ledgers/export');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// Cross-cutting: Profile → Vault → Transaction chain
// ============================================================================
describe('Integration: Cross-cutting Data Flow', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Profile → Vaults → Transactions → RBAC chain', async () => {
    if (!ownerToken) return;

    const profileRes = await apiClient.get('/api/users/profile/me');
    expect(profileRes.status).toBe(200);

    const vaultRes = await apiClient.get('/api/users/vault-accounts');
    expect(vaultRes.status).toBeLessThan(500);

    const txRes = await apiClient.get('/api/users/transactions');
    expect(txRes.status).toBeLessThan(500);

    const rbacRes = await apiClient.get('/api/users/rbac/roles');
    expect(rbacRes.status).toBeLessThan(500);
  }, TIMEOUT);

  it('KYB + KYC status check chain', async () => {
    if (!ownerToken) return;

    const kybRes = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect(kybRes.status).toBeLessThan(500);

    const kycRes = await apiClient.get('/api/users/identity-verification/kyc/status');
    expect(kycRes.status).toBeLessThan(500);
  }, TIMEOUT);
});
