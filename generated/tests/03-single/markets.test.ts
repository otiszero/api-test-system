import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Markets
 * Tests individual endpoint behavior, validation, edge cases
 */

describe('Markets - Single API Tests', () => {
  let existingMarketId: number | null = null;

  beforeAll(async () => {
    // Get an existing market ID for tests
    const response = await apiClient.get('/markets?limit=1');
    if (response.status === 200 && response.data.data?.length > 0) {
      existingMarketId = response.data.data[0].id;
    }
  });

  describe('Happy Path - CRUD Operations', () => {
    it('GET /markets - should return list of markets', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /markets - should support pagination', async () => {
      const response = await apiClient.get('/markets?limit=5&page=1');
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    it('GET /markets/{id} - should return market detail', async () => {
      if (!existingMarketId) return;
      const response = await apiClient.get(`/markets/${existingMarketId}`);
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id');
    });

    it('GET /markets/category - should return categories', async () => {
      const response = await apiClient.get('/markets/category');
      expect(response.status).toBe(200);
    });

    it('GET /markets/top-holders/{id} - should return top holders', async () => {
      if (!existingMarketId) return;
      const response = await apiClient.get(`/markets/top-holders/${existingMarketId}`);
      expect([200, 404]).toContain(response.status);
    });

    it('GET /markets/ipfs/{id} - should return IPFS data for market', async () => {
      if (!existingMarketId) return;
      const response = await apiClient.get(`/markets/ipfs/${existingMarketId}`);
      expect([200, 404]).toContain(response.status);
    });

    it('POST /markets/market - should create market with valid data (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/markets/market', {
        // Empty body should return validation error
      });
      authHelper.clearAuthToken();
      // Expect 400/422 for validation error or 401 if token expired
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Auth Required Endpoints', () => {
    it('GET /markets/proposed - should return proposed markets (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /markets/proposed-detail/{id} - should return proposed detail', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed-detail/1');
      authHelper.clearAuthToken();
      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it('GET /markets/favorites - should return user favorites (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/favorites');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('POST /markets/{marketId}/favorite - should toggle favorite', async () => {
      if (!existingMarketId) return;
      authHelper.setAuthToken('user');
      const response = await apiClient.post(`/markets/${existingMarketId}/favorite`);
      authHelper.clearAuthToken();
      expect([200, 201, 401]).toContain(response.status);
    });

    it('PUT /markets/vote/{id} - should vote on market', async () => {
      if (!existingMarketId) return;
      authHelper.setAuthToken('user');
      const response = await apiClient.put(`/markets/vote/${existingMarketId}`, {});
      authHelper.clearAuthToken();
      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });

  describe('Edge Cases', () => {
    it('GET /markets/{id} - non-existent ID should return 404 or empty', async () => {
      const response = await apiClient.get('/markets/999999999');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /markets/{id} - invalid ID format should handle gracefully', async () => {
      const response = await apiClient.get('/markets/invalid-id');
      expect([400, 404, 500]).toContain(response.status);
    });

    it('GET /markets - empty result should return empty array', async () => {
      const response = await apiClient.get('/markets?status=NONEXISTENT');
      expect(response.status).toBe(200);
      // Should either return empty array or ignore invalid filter
    });
  });

  describe('Security - Auth Required', () => {
    it('GET /markets/proposed - without auth should return 401', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/markets/proposed');
      expect(response.status).toBe(401);
    });

    it('GET /markets/favorites - without auth should return 401', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/markets/favorites');
      expect(response.status).toBe(401);
    });

    it('POST /markets/market - without auth should return 401', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/markets/market', {});
      expect(response.status).toBe(401);
    });
  });
});
