/**
 * 03-single: User Profile API Tests
 * Endpoints: GET /api/users/profile/me, POST /api/users/profile/me
 * Auth: bearer required
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const USER_TOKEN = authConfig.accounts.user[0].token;

describe('03-single: User Profile API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/profile/me ────────────────────────────────────────────
  describe('GET /api/users/profile/me', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/profile/me');
      expect(res.status).toBe(401);
    }, 15000);

    it('valid token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/profile/me');
      expect(res.status).toBe(200);
    }, 15000);

    it('valid token → response has data object', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/profile/me');
      expect(res.data).toBeDefined();
      // Wrapped response: { statusCode, message, data }
      expect(res.data.data).toBeDefined();
    }, 15000);
  });

  // ─── POST /api/users/profile/me ───────────────────────────────────────────
  describe('POST /api/users/profile/me', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/profile/me', {
        firstName: 'Test',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('valid token, valid payload → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/profile/me', {
        firstName: 'Tien',
        lastName: 'Nguyen',
      });
      expect([200, 201]).toContain(res.status);
    }, 15000);

    it('valid token, empty body → 200 or 400', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/profile/me', {});
      // API may accept empty body (no-op) or reject
      expect([200, 400, 422]).toContain(res.status);
    }, 15000);
  });
});
