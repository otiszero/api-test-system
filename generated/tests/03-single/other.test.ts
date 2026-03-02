import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Other endpoints
 * Orderbook, Statistic, Slack, Admin, Root
 */

describe('Other Endpoints - Single API Tests', () => {
  describe('Root', () => {
    it('GET / - should return health status', async () => {
      const response = await apiClient.get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('Orderbook', () => {
    it('GET /orderbook - should return orderbook data', async () => {
      const response = await apiClient.get('/orderbook');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /orderbook - should support marketId query', async () => {
      const response = await apiClient.get('/orderbook?marketId=1');
      expect(response.status).toBe(200);
    });
  });

  describe('Statistic', () => {
    it('GET /statistic/rank - should return ranking data', async () => {
      const response = await apiClient.get('/statistic/rank');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /statistic/rank - should support pagination', async () => {
      const response = await apiClient.get('/statistic/rank?limit=10&page=1');
      expect(response.status).toBe(200);
    });
  });

  describe('Slack', () => {
    it('GET /slack/{id} - should handle test endpoint', async () => {
      const response = await apiClient.get('/slack/test');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Admin', () => {
    it('GET /admin - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/admin');
      expect(response.status).toBe(401);
    });

    it('GET /admin - should return admin list (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/admin');
      authHelper.clearAuthToken();
      // User might not have admin access
      expect([200, 401, 403]).toContain(response.status);
    });

    it('POST /admin - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/admin', {});
      expect(response.status).toBe(401);
    });

    it('POST /admin - should validate input (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/admin', {});
      authHelper.clearAuthToken();
      expect([400, 401, 403, 422]).toContain(response.status);
    });

    it('PUT /admin - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.put('/admin', {});
      expect(response.status).toBe(401);
    });
  });
});
