/**
 * 03-single: Organization + Members API Tests
 * Endpoints (User Organization):
 *   GET /api/users/organization/{id}
 *   PUT /api/users/organization/{id}   (admin only)
 * Endpoints (Organization Member):
 *   POST /api/users/organization-members/invite         (admin only)
 *   POST /api/users/organization-members/resend-invite  (admin only)
 *   POST /api/users/organization-members/verify-invite  (public)
 *   PUT  /api/users/organization-members/accept-invite  (bearer)
 *   GET  /api/users/organization-members/members
 *   PUT  /api/users/organization-members/remove-member   (admin only)
 *   PUT  /api/users/organization-members/change-member-role (admin only)
 *   GET  /api/users/organization-members/export-members  (admin only)
 * Auth: bearer required for most; user[0] = owner/admin, user[1] = normal user
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const OWNER_TOKEN = authConfig.accounts.user[0].token;  // owner/admin
const USER_TOKEN = authConfig.accounts.user[1].token;   // normal user
const DUMMY_ORG_ID = '1';

describe('03-single: User Organization API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── GET /api/users/organization/{id} ─────────────────────────────────────
  describe('GET /api/users/organization/{id}', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get(`/api/users/organization/${DUMMY_ORG_ID}`);
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token, valid id → 200 or 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get(`/api/users/organization/${DUMMY_ORG_ID}`);
      expect([200, 404]).toContain(res.status);
    }, 15000);

    it('normal user token → 200 or 404 (can view)', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get(`/api/users/organization/${DUMMY_ORG_ID}`);
      expect([200, 404]).toContain(res.status);
    }, 15000);
  });

  // ─── PUT /api/users/organization/{id} ─────────────────────────────────────
  describe('PUT /api/users/organization/{id}', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.put(`/api/users/organization/${DUMMY_ORG_ID}`, {
        name: 'Updated Org',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.put(`/api/users/organization/${DUMMY_ORG_ID}`, {
        name: 'Updated Org',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent org → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.put('/api/users/organization/999999', {
        name: 'Updated Org',
      });
      expect([400, 403, 404]).toContain(res.status);
    }, 15000);
  });
});

describe('03-single: Organization Members API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/organization-members/invite ──────────────────────────
  describe('POST /api/users/organization-members/invite', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/organization-members/invite', {
        email: 'newmember@example.com',
        role: 'user',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/organization-members/invite', {
        email: 'newmember@example.com',
        role: 'user',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, missing email → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/organization-members/invite', {
        role: 'user',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('owner token, invalid email format → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/organization-members/invite', {
        email: 'not-an-email',
        role: 'user',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/organization-members/resend-invite ───────────────────
  describe('POST /api/users/organization-members/resend-invite', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/organization-members/resend-invite', {
        email: 'member@example.com',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/organization-members/resend-invite', {
        email: 'member@example.com',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent invite → 400/404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/organization-members/resend-invite', {
        email: 'nonexistent@example.com',
      });
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/organization-members/verify-invite (public) ──────────
  describe('POST /api/users/organization-members/verify-invite', () => {
    it('missing token → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/organization-members/verify-invite', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('invalid invite token → 400/404', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/organization-members/verify-invite', {
        token: 'invalid-invite-token-00000',
      });
      expect([400, 404, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── PUT /api/users/organization-members/accept-invite ────────────────────
  describe('PUT /api/users/organization-members/accept-invite', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.put('/api/users/organization-members/accept-invite', {
        token: 'invite-token',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, invalid invite → 400/404', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.put('/api/users/organization-members/accept-invite', {
        token: 'invalid-invite-token-00000',
      });
      expect([400, 404, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/organization-members/members ──────────────────────────
  describe('GET /api/users/organization-members/members', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/organization-members/members');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-members/members');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/organization-members/members');
      expect(res.status).toBe(200);
    }, 15000);
  });

  // ─── PUT /api/users/organization-members/remove-member ────────────────────
  describe('PUT /api/users/organization-members/remove-member', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.put('/api/users/organization-members/remove-member', {
        userId: 9999,
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.put('/api/users/organization-members/remove-member', {
        userId: 9999,
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, non-existent member → 400/404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.put('/api/users/organization-members/remove-member', {
        userId: 9999999,
      });
      expect([400, 404]).toContain(res.status);
    }, 15000);
  });

  // ─── PUT /api/users/organization-members/change-member-role ───────────────
  describe('PUT /api/users/organization-members/change-member-role', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.put('/api/users/organization-members/change-member-role', {
        userId: 9999,
        role: 'user',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.put('/api/users/organization-members/change-member-role', {
        userId: 9999,
        role: 'user',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, missing fields → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.put('/api/users/organization-members/change-member-role', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/organization-members/export-members ───────────────────
  describe('GET /api/users/organization-members/export-members', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/organization-members/export-members');
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/organization-members/export-members');
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-members/export-members');
      expect(res.status).toBe(200);
    }, 15000);
  });
});
