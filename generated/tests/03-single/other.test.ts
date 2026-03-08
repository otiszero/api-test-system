/**
 * 03-single: Files, RBAC, Action Logs, Ledger, Country API Tests
 * Endpoints (Files):
 *   POST /api/users/files/upload-image
 *   POST /api/users/files/private-storage/presigned-post
 *   GET  /api/users/files/private-storage/presigned-get/{id}
 * Endpoints (RBAC):
 *   GET  /api/users/rbac/roles
 * Endpoints (Action Logs):
 *   GET  /api/users/action-logs
 *   GET  /api/users/action-logs/export    (admin only)
 * Endpoints (Ledger):
 *   GET  /api/users/ledgers/export
 * Endpoints (Country):
 *   GET  /api/countries                   (public)
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const OWNER_TOKEN = authConfig.accounts.user[0].token;  // owner/admin
const USER_TOKEN = authConfig.accounts.user[1].token;   // normal user

describe('03-single: Files API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/files/upload-image ───────────────────────────────────
  describe('POST /api/users/files/upload-image', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/files/upload-image', {});
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, empty body (no file) → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/files/upload-image', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/files/private-storage/presigned-post ─────────────────
  describe('POST /api/users/files/private-storage/presigned-post', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
        type: 'kyb',
        fileName: 'test.pdf',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, valid payload → 200/201', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
        type: 'kyb',
        fileName: 'business-license.pdf',
      });
      expect([200, 201]).toContain(res.status);
    }, 15000);

    it('with token, missing type → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
        fileName: 'test.pdf',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('with token, invalid type enum → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
        type: 'invalid_type',
        fileName: 'test.pdf',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('with token, missing fileName → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {
        type: 'kyb',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/files/private-storage/presigned-get/{id} ──────────────
  describe('GET /api/users/files/private-storage/presigned-get/{id}', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/files/private-storage/presigned-get/test-file-id');
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, non-existent file id → 404', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/files/private-storage/presigned-get/non-existent-file-id-00000');
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });
});

describe('03-single: Organization RBAC Management API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/rbac/roles ────────────────────────────────────────────
  describe('GET /api/users/rbac/roles', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/rbac/roles');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/rbac/roles');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/rbac/roles');
      expect(res.status).toBe(200);
    }, 15000);

    it('owner token → response has data', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/rbac/roles');
      expect(res.data).toBeDefined();
    }, 15000);
  });
});

describe('03-single: User Action Logs API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/action-logs ───────────────────────────────────────────
  describe('GET /api/users/action-logs', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/action-logs');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/action-logs');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/action-logs');
      expect(res.status).toBe(200);
    }, 15000);
  });

  // ─── GET /api/users/action-logs/export ────────────────────────────────────
  describe('GET /api/users/action-logs/export', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/action-logs/export');
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403 (admin only)', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/action-logs/export');
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/action-logs/export');
      expect(res.status).toBe(200);
    }, 15000);
  });
});

describe('03-single: Ledger API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/ledgers/export ────────────────────────────────────────
  describe('GET /api/users/ledgers/export', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/ledgers/export');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/ledgers/export');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/ledgers/export');
      expect(res.status).toBe(200);
    }, 15000);
  });
});

describe('03-single: Country API', () => {
  // ─── GET /api/countries ───────────────────────────────────────────────────
  describe('GET /api/countries', () => {
    it('no auth token → 200 (public endpoint)', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/countries');
      expect(res.status).toBe(200);
    }, 15000);

    it('response has data', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/countries');
      expect(res.data).toBeDefined();
    }, 15000);
  });
});
