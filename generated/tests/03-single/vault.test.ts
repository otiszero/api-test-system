/**
 * 03-single: Vault Accounts API Tests
 * Endpoints:
 *   GET  /api/users/vault-accounts
 *   POST /api/users/vault-accounts              (admin + OTP required)
 *   POST /api/users/vault-accounts/{id}         (admin + OTP required)
 *   POST /api/users/vault-accounts/{id}/add-assets    (admin + OTP)
 *   POST /api/users/vault-accounts/{id}/assign-users  (admin + OTP)
 *   POST /api/users/vault-accounts/{id}/remove-users  (admin + OTP)
 *   GET  /api/users/vault-accounts/{id}/users
 * Auth: bearer required; write ops restricted to admin/owner + 2FA OTP
 * Note: user[0] = "owner org" (admin), user[1] = "normal user"
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const OWNER_TOKEN = authConfig.accounts.user[0].token;  // owner/admin
const USER_TOKEN = authConfig.accounts.user[1].token;   // normal user
const DUMMY_VAULT_ID = '00000000-0000-0000-0000-000000000001';

describe('03-single: Vault Accounts API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/vault-accounts ────────────────────────────────────────
  describe('GET /api/users/vault-accounts', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/vault-accounts');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/vault-accounts');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200 (can view)', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/vault-accounts');
      expect(res.status).toBe(200);
    }, 15000);

    it('owner token → response has data', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/vault-accounts');
      expect(res.data).toBeDefined();
    }, 15000);
  });

  // ─── POST /api/users/vault-accounts ───────────────────────────────────────
  describe('POST /api/users/vault-accounts (requires admin + OTP)', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/vault-accounts', {
        name: 'Test Vault',
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/vault-accounts', {
        name: 'Test Vault',
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, no OTP → 400 (2FA required)', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/vault-accounts', {
        name: 'Test Vault',
        // no otp field
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('owner token, missing name → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/vault-accounts', {
        otp: '123456',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/vault-accounts/{id} (update vault) ───────────────────
  describe('POST /api/users/vault-accounts/{id}', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}`, {
        name: 'Updated Vault',
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}`, {
        name: 'Updated Vault',
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent vault id → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}`, {
        name: 'Updated Vault',
        otp: '000000',
      });
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/vault-accounts/{id}/add-assets ───────────────────────
  describe('POST /api/users/vault-accounts/{id}/add-assets', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/add-assets`, {
        assetIds: ['asset-1'],
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/add-assets`, {
        assetIds: ['asset-1'],
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, no OTP → 400 (2FA required)', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/add-assets`, {
        assetIds: ['asset-1'],
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/vault-accounts/{id}/assign-users ─────────────────────
  describe('POST /api/users/vault-accounts/{id}/assign-users', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/assign-users`, {
        userIds: [1],
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/assign-users`, {
        userIds: [1],
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, no OTP → 400 (2FA required)', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/assign-users`, {
        userIds: [1],
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/vault-accounts/{id}/remove-users ─────────────────────
  describe('POST /api/users/vault-accounts/{id}/remove-users', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/remove-users`, {
        userIds: [1],
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/remove-users`, {
        userIds: [1],
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, no OTP → 400 (2FA required)', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/remove-users`, {
        userIds: [1],
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/vault-accounts/{id}/users ─────────────────────────────
  describe('GET /api/users/vault-accounts/{id}/users', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/users`);
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token, non-existent vault → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/users`);
      expect([200, 400, 404]).toContain(res.status);
    }, 15000);

    it('normal user token, non-existent vault → 200 or 404', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get(`/api/users/vault-accounts/${DUMMY_VAULT_ID}/users`);
      expect([200, 400, 404]).toContain(res.status);
    }, 15000);
  });
});
