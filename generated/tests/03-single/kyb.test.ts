/**
 * 03-single: Organization KYB API Tests
 * Endpoints:
 *   POST /api/users/organization-kyb              (admin only)
 *   GET  /api/users/organization-kyb/kyb-status
 *   GET  /api/users/organization-kyb/primary-owner-data
 *   GET  /api/users/organization-kyb/{id}/detail
 * Auth: bearer required; POST restricted to admin/owner
 * Note: user[0] = "owner org", user[1] = "normal user"
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const OWNER_TOKEN = authConfig.accounts.user[0].token;  // owner org
const USER_TOKEN = authConfig.accounts.user[1].token;   // normal user

describe('03-single: Organization KYB API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/organization-kyb ─────────────────────────────────────
  describe('POST /api/users/organization-kyb', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/organization-kyb', {});
      expect(res.status).toBe(401);
    }, 15000);

    it('normal user (non-owner) → 403', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/organization-kyb', {
        legalBusinessName: 'Test Corp',
      });
      expect(res.status).toBe(403);
    }, 15000);

    it('owner token, missing required fields → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/organization-kyb', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('owner token, invalid businessType enum → 400/422', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.post('/api/users/organization-kyb', {
        legalBusinessName: 'Test Corp',
        countryId: 1,
        contactEmail: 'contact@test.com',
        businessAddress: '123 Main St',
        businessDescription: 'Test business',
        registrationNumber: 'REG-001',
        dateOfIncorporation: '2020-01-01',
        businessType: 'invalid_type', // invalid enum
        ownerships: [],
        fileIds: [],
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/organization-kyb/kyb-status ───────────────────────────
  describe('GET /api/users/organization-kyb/kyb-status', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
      expect(res.status).toBe(200);
    }, 15000);

    it('normal user token → 200', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
      expect(res.status).toBe(200);
    }, 15000);
  });

  // ─── GET /api/users/organization-kyb/primary-owner-data ───────────────────
  describe('GET /api/users/organization-kyb/primary-owner-data', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token → 200', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
      expect(res.status).toBe(200);
    }, 15000);

    it('response has data', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
      expect(res.data).toBeDefined();
    }, 15000);
  });

  // ─── GET /api/users/organization-kyb/{id}/detail ──────────────────────────
  describe('GET /api/users/organization-kyb/{id}/detail', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/organization-kyb/1/detail');
      expect(res.status).toBe(401);
    }, 15000);

    it('owner token, non-existent id → 404', async () => {
      apiClient.setToken(OWNER_TOKEN);
      const res = await apiClient.get('/api/users/organization-kyb/999999/detail');
      expect([404, 400]).toContain(res.status);
    }, 15000);
  });
});
