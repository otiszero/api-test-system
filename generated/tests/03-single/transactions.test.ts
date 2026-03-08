/**
 * 03-single: User Transactions + Withdraw API Tests
 * Endpoints (User Transactions):
 *   GET /api/users/transactions
 *   GET /api/users/transactions/export
 *   GET /api/users/transactions/{transactionId}
 * Endpoints (Withdraw):
 *   POST /api/users/withdraw                          (admin + OTP)
 *   POST /api/users/withdraw/{transactionId}/approve  (admin + OTP)
 *   POST /api/users/withdraw/{transactionId}/reject   (admin)
 * Auth: bearer required; withdraw restricted to admin/owner + 2FA OTP
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const OWNER_TOKEN = authConfig.accounts.user[0].token;  // owner/admin
const USER_TOKEN = authConfig.accounts.user[1].token;   // normal user
const DUMMY_TX_ID = '00000000-0000-0000-0000-000000000001';

describe('03-single: User Transactions API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/transactions ──────────────────────────────────────────
  describe('GET /api/users/transactions', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/transactions');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/transactions');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/transactions');
      expect(res.status).toBe(200);
    }, 15000);

    it('owner token → response has data', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/transactions');
      expect(res.data).toBeDefined();
    }, 15000);

    it('accepts pagination query params', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/transactions?page=1&limit=10');
      expect(res.status).toBe(200);
    }, 15000);
  });

  // ─── GET /api/users/transactions/export ───────────────────────────────────
  describe('GET /api/users/transactions/export', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/transactions/export');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/transactions/export');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/transactions/export');
      expect(res.status).toBe(200);
    }, 15000);
  });

  // ─── GET /api/users/transactions/{transactionId} ──────────────────────────
  describe('GET /api/users/transactions/{transactionId}', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get(`/api/users/transactions/${DUMMY_TX_ID}`);
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token, non-existent transaction → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get(`/api/users/transactions/${DUMMY_TX_ID}`);
      expect([400, 404]).toContain(res.status);
    }, 15000);

    it('normal user token, non-existent transaction → 404', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get(`/api/users/transactions/${DUMMY_TX_ID}`);
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });
});

describe('03-single: Withdraw API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/withdraw ──────────────────────────────────────────────
  describe('POST /api/users/withdraw (admin + OTP required)', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/withdraw', {
        amount: '100',
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/withdraw', {
        amount: '100',
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, no OTP → 400 (2FA required)', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/withdraw', {
        amount: '100',
        // no otp
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('owner token, missing required fields → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/withdraw', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/withdraw/{transactionId}/approve ─────────────────────
  describe('POST /api/users/withdraw/{transactionId}/approve', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/approve`, {
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/approve`, {
        otp: '123456',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent transaction → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/approve`, {
        otp: '000000',
      });
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/withdraw/{transactionId}/reject ──────────────────────
  describe('POST /api/users/withdraw/{transactionId}/reject', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/reject`, {});
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/reject`, {});
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent transaction → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post(`/api/users/withdraw/${DUMMY_TX_ID}/reject`, {
        reason: 'Test rejection',
      });
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });
});
