/**
 * 03-single: Identity Verification (KYC) API Tests
 * Endpoints:
 *   POST /api/users/identity-verification/kyc/init-kyc
 *   GET  /api/users/identity-verification/kyc/status
 * Auth: bearer required
 * Note: KYC handled by Sumsub (third-party), tests verify auth + reachability
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const USER_TOKEN = authConfig.accounts.user[0].token;

describe('03-single: Identity Verification (KYC) API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/identity-verification/kyc/init-kyc ───────────────────
  describe('POST /api/users/identity-verification/kyc/init-kyc', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/identity-verification/kyc/init-kyc');
      expect(res.status).toBe(401);
    }, 15000);

    it('valid token → 200 or 400 (KYC already initiated)', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/identity-verification/kyc/init-kyc');
      // KYC init may return 200 (success) or 400 (already in progress/completed)
      expect([200, 201, 400]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/identity-verification/kyc/status ──────────────────────
  describe('GET /api/users/identity-verification/kyc/status', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/identity-verification/kyc/status');
      expect(res.status).toBe(401);
    }, 15000);

    it('valid token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/identity-verification/kyc/status');
      expect(res.status).toBe(200);
    }, 15000);

    it('valid token → response has data', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/identity-verification/kyc/status');
      expect(res.data).toBeDefined();
    }, 15000);
  });
});
