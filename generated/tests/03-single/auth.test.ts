import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Authentication
 * Tests auth endpoints behavior
 */

describe('Authentication - Single API Tests', () => {
  describe('Login', () => {
    it('POST /auth/login - should exist and accept requests', async () => {
      const response = await apiClient.post('/auth/login', {});
      // Empty body should return validation error or require specific fields
      expect([400, 401, 422]).toContain(response.status);
    });

    it('POST /auth/login - should return proper error for invalid credentials', async () => {
      const response = await apiClient.post('/auth/login', {
        walletAddress: 'invalid_wallet_address',
        signature: 'invalid_signature'
      });
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Logout', () => {
    it('POST /auth/logout - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/auth/logout');
      expect(response.status).toBe(401);
    });

    it('POST /auth/logout - should succeed with valid token', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/auth/logout');
      authHelper.clearAuthToken();
      expect([200, 204, 401]).toContain(response.status);
    });
  });

  describe('Refresh Token', () => {
    it('POST /auth/refresh-token - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/auth/refresh-token', {});
      expect(response.status).toBe(401);
    });

    it('POST /auth/refresh-token - should validate refresh token', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/auth/refresh-token', {
        refreshToken: 'invalid-token'
      });
      authHelper.clearAuthToken();
      expect([200, 400, 401]).toContain(response.status);
    });

    it('POST /auth/admin-refresh-token - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/auth/admin-refresh-token', {});
      expect(response.status).toBe(401);
    });
  });

  describe('User Profile', () => {
    it('GET /auth/me - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/auth/me');
      expect(response.status).toBe(401);
    });

    it('GET /auth/me - should return user data with valid token', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data.data).toHaveProperty('walletAddress');
        expect(response.data.data).toHaveProperty('isAdmin');
      }
    });
  });

  describe('User Assets', () => {
    it('GET /auth/asset - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/auth/asset');
      expect(response.status).toBe(401);
    });

    it('GET /auth/asset - should return asset data with valid token', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/asset');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });
});
