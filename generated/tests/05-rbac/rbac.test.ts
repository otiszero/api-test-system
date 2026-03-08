import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

/**
 * 05 - RBAC Permission Tests
 * Source of truth: config/test-rules.md §4 Permission Matrix
 * Roles: admin (org owner = user[0]), user (regular = user[1]), guest (no token)
 *
 * Groups:
 *   Group 1: Guest → Public endpoints → 200
 *   Group 2: Guest → Protected endpoints → 401
 *   Group 3: Normal user → Allowed read endpoints → 2xx
 *   Group 4: Normal user → Admin-only write endpoints → 403
 *   Group 5: Org owner → Admin-only endpoints → 2xx (not 403)
 */

const ownerOrgToken = authConfig.accounts.user[0].token;   // org owner (admin-level)
const normalUserToken = authConfig.accounts.user[1].token; // regular member
const TIMEOUT = 15000;

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — Guest → Public endpoints (expect 200)
// ─────────────────────────────────────────────────────────────────────────────
describe('Group 1: Guest → Public endpoints → 200', () => {
  beforeAll(() => {
    apiClient.clearToken();
  });

  it('GET /api/health → 200', async () => {
    const res = await apiClient.get('/api/health');
    expect(res.status).toBe(200);
  }, TIMEOUT);

  it('GET /api/health/ready → 200', async () => {
    const res = await apiClient.get('/api/health/ready');
    expect(res.status).toBe(200);
  }, TIMEOUT);

  it('GET /api/countries → 200', async () => {
    const res = await apiClient.get('/api/countries');
    expect(res.status).toBe(200);
  }, TIMEOUT);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — Guest → Protected endpoints (expect 401)
// ─────────────────────────────────────────────────────────────────────────────
describe('Group 2: Guest → Protected endpoints → 401', () => {
  beforeAll(() => {
    apiClient.clearToken();
  });

  it('GET /api/users/profile/me → 401', async () => {
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/vault-accounts → 401', async () => {
    const res = await apiClient.get('/api/users/vault-accounts');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('POST /api/users/vault-accounts → 401', async () => {
    const res = await apiClient.post('/api/users/vault-accounts', {});
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/transactions → 401', async () => {
    const res = await apiClient.get('/api/users/transactions');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/organization-members/members → 401', async () => {
    const res = await apiClient.get('/api/users/organization-members/members');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('POST /api/users/organization-kyb → 401', async () => {
    const res = await apiClient.post('/api/users/organization-kyb', {});
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/organization-kyb/kyb-status → 401', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('POST /api/users/withdraw → 401', async () => {
    const res = await apiClient.post('/api/users/withdraw', {});
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/action-logs → 401', async () => {
    const res = await apiClient.get('/api/users/action-logs');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/rbac/roles → 401', async () => {
    const res = await apiClient.get('/api/users/rbac/roles');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('POST /api/users/organization-members/invite → 401', async () => {
    const res = await apiClient.post('/api/users/organization-members/invite', {});
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('GET /api/users/ledgers/export → 401', async () => {
    const res = await apiClient.get('/api/users/ledgers/export');
    expect(res.status).toBe(401);
  }, TIMEOUT);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — Normal user → Allowed read endpoints (expect 2xx)
// ─────────────────────────────────────────────────────────────────────────────
describe('Group 3: Normal user → Allowed read endpoints → 2xx', () => {
  beforeAll(() => {
    apiClient.setToken(normalUserToken);
  });

  afterAll(() => {
    apiClient.clearToken();
  });

  it('GET /api/users/profile/me → 2xx', async () => {
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/vault-accounts → 2xx', async () => {
    const res = await apiClient.get('/api/users/vault-accounts');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/transactions → 2xx', async () => {
    const res = await apiClient.get('/api/users/transactions');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-members/members → 2xx', async () => {
    const res = await apiClient.get('/api/users/organization-members/members');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-kyb/kyb-status → 2xx', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-kyb/primary-owner-data → 2xx', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/action-logs → 2xx', async () => {
    const res = await apiClient.get('/api/users/action-logs');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/rbac/roles → 2xx', async () => {
    const res = await apiClient.get('/api/users/rbac/roles');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/transactions/export → 2xx', async () => {
    const res = await apiClient.get('/api/users/transactions/export');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/ledgers/export → 2xx', async () => {
    const res = await apiClient.get('/api/users/ledgers/export');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 4 — Normal user → Admin-only endpoints (expect 403)
// ─────────────────────────────────────────────────────────────────────────────
describe('Group 4: Normal user → Admin-only endpoints → 403', () => {
  beforeAll(() => {
    apiClient.setToken(normalUserToken);
  });

  afterAll(() => {
    apiClient.clearToken();
  });

  // Vault write operations — admin only
  it('POST /api/users/vault-accounts (create) → 403', async () => {
    const res = await apiClient.post('/api/users/vault-accounts', { name: 'test', otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/vault-accounts/:id (update) → 403', async () => {
    const res = await apiClient.post('/api/users/vault-accounts/dummy-vault-id', { name: 'new-name', otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/vault-accounts/:id/add-assets → 403', async () => {
    const res = await apiClient.post('/api/users/vault-accounts/dummy-vault-id/add-assets', { assetIds: [], otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/vault-accounts/:id/assign-users → 403', async () => {
    const res = await apiClient.post('/api/users/vault-accounts/dummy-vault-id/assign-users', { userIds: [], otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/vault-accounts/:id/remove-users → 403', async () => {
    const res = await apiClient.post('/api/users/vault-accounts/dummy-vault-id/remove-users', { userIds: [], otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  // KYB submit — admin only
  it('POST /api/users/organization-kyb (submit KYB) → 403', async () => {
    const res = await apiClient.post('/api/users/organization-kyb', { legalBusinessName: 'Test' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  // Withdraw operations — admin only
  it('POST /api/users/withdraw → 403', async () => {
    const res = await apiClient.post('/api/users/withdraw', { amount: '100', otp: '000000' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/withdraw/:transactionId/approve → 403', async () => {
    const res = await apiClient.post('/api/users/withdraw/dummy-tx-id/approve', {});
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/withdraw/:transactionId/reject → 403', async () => {
    const res = await apiClient.post('/api/users/withdraw/dummy-tx-id/reject', {});
    expect(res.status).toBe(403);
  }, TIMEOUT);

  // Org member management — admin only
  it('POST /api/users/organization-members/invite → 403', async () => {
    const res = await apiClient.post('/api/users/organization-members/invite', { email: 'x@y.com', role: 'user' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('POST /api/users/organization-members/resend-invite → 403', async () => {
    const res = await apiClient.post('/api/users/organization-members/resend-invite', { email: 'x@y.com' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('PUT /api/users/organization-members/remove-member → 403', async () => {
    const res = await apiClient.put('/api/users/organization-members/remove-member', { userId: 1 });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('PUT /api/users/organization-members/change-member-role → 403', async () => {
    const res = await apiClient.put('/api/users/organization-members/change-member-role', { userId: 1, role: 'admin' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  it('GET /api/users/organization-members/export-members → 403', async () => {
    const res = await apiClient.get('/api/users/organization-members/export-members');
    expect(res.status).toBe(403);
  }, TIMEOUT);

  // Org profile update — admin only
  it('PUT /api/users/organization/:id (update org) → 403', async () => {
    const res = await apiClient.put('/api/users/organization/1', { name: 'Hacked' });
    expect(res.status).toBe(403);
  }, TIMEOUT);

  // Action logs export — admin only
  it('GET /api/users/action-logs/export → 403', async () => {
    const res = await apiClient.get('/api/users/action-logs/export');
    expect(res.status).toBe(403);
  }, TIMEOUT);
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 5 — Org owner (admin) → Admin-only endpoints (expect 2xx, NOT 403)
// ─────────────────────────────────────────────────────────────────────────────
describe('Group 5: Org owner → Admin endpoints → NOT 403', () => {
  beforeAll(() => {
    apiClient.setToken(ownerOrgToken);
  });

  afterAll(() => {
    apiClient.clearToken();
  });

  // Read endpoints accessible by owner
  it('GET /api/users/vault-accounts → 2xx (owner can list vaults)', async () => {
    const res = await apiClient.get('/api/users/vault-accounts');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-kyb/kyb-status → 2xx (owner can view KYB)', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-members/members → 2xx (owner can list members)', async () => {
    const res = await apiClient.get('/api/users/organization-members/members');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/organization-kyb/primary-owner-data → 2xx', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/action-logs → 2xx (owner can view action logs)', async () => {
    const res = await apiClient.get('/api/users/action-logs');
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  }, TIMEOUT);

  it('GET /api/users/action-logs/export → NOT 403 (owner can export logs)', async () => {
    const res = await apiClient.get('/api/users/action-logs/export');
    expect(res.status).not.toBe(403);
  }, TIMEOUT);

  it('GET /api/users/organization-members/export-members → NOT 403 (owner can export)', async () => {
    const res = await apiClient.get('/api/users/organization-members/export-members');
    expect(res.status).not.toBe(403);
  }, TIMEOUT);

  // Write operations — owner should NOT get 403
  it('POST /api/users/vault-accounts (create) → NOT 403 (owner may create vault)', async () => {
    // Sending minimal body — expect auth to pass, validation may fail (400/422)
    const res = await apiClient.post('/api/users/vault-accounts', { name: 'rbac-test-vault', otp: '000000' });
    expect(res.status).not.toBe(403);
  }, TIMEOUT);

  it('POST /api/users/organization-members/invite → NOT 403 (owner may invite)', async () => {
    const res = await apiClient.post('/api/users/organization-members/invite', { email: 'rbac-test@example.com', role: 'user' });
    expect(res.status).not.toBe(403);
  }, TIMEOUT);

  it('POST /api/users/withdraw → NOT 403 (owner may initiate withdraw)', async () => {
    const res = await apiClient.post('/api/users/withdraw', { amount: '1', otp: '000000' });
    expect(res.status).not.toBe(403);
  }, TIMEOUT);
});
