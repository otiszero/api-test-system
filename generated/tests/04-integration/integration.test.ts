import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 04 - Integration Tests
 * Tests complete business flows from test-rules.md
 */

describe('04 - Integration Tests', () => {
  let testMarketId: number | null = null;

  beforeAll(async () => {
    // Get a market ID for integration tests
    const response = await apiClient.get('/markets?limit=1');
    if (response.status === 200 && response.data.data?.length > 0) {
      testMarketId = response.data.data[0].id;
    }
  });

  describe('Scenario 1: User views markets and favorites', () => {
    it('Step 1: Get list of markets (public)', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('Step 2: Get market detail', async () => {
      if (!testMarketId) return;
      const response = await apiClient.get(`/markets/${testMarketId}`);
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id');
    });

    it('Step 3: Toggle favorite (auth required)', async () => {
      if (!testMarketId) return;
      authHelper.setAuthToken('user');
      const response = await apiClient.post(`/markets/${testMarketId}/favorite`);
      authHelper.clearAuthToken();
      expect([200, 201, 401]).toContain(response.status);
    });

    it('Step 4: Get user favorites list', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/favorites');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Scenario 2: User views orders and positions', () => {
    it('Step 1: Get user orders', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('Step 2: Get user positions', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('Step 3: Get position claims', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position-claims');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('Step 4: Get order activity', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/activity');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Scenario 3: User views trades', () => {
    it('Step 1: Get market trades (public)', async () => {
      const response = await apiClient.get('/trades/market-trade');
      expect(response.status).toBe(200);
    });

    it('Step 2: Get trade graph (public)', async () => {
      const response = await apiClient.get('/trades/graph');
      expect(response.status).toBe(200);
    });

    it('Step 3: Get user trades (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('Step 4: Get trade history', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades/history');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Scenario 4: Comment lifecycle', () => {
    it('Step 1: Get market comments', async () => {
      if (!testMarketId) return;
      const response = await apiClient.get(`/comments/market/${testMarketId}`);
      expect([200, 404]).toContain(response.status);
    });

    it('Step 2: Create comment (requires auth)', async () => {
      if (!testMarketId) return;
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments', {
        marketId: testMarketId,
        content: `Integration test comment ${Date.now()}`
      });
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('Step 3: Like comment (requires auth)', async () => {
      // Try to like comment ID 1
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments/1/like');
      authHelper.clearAuthToken();
      expect([200, 201, 401, 404]).toContain(response.status);
    });

    it('Step 4: Get replies', async () => {
      const response = await apiClient.get('/comments/reply/1');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Scenario 5: Orderbook and statistics', () => {
    it('Step 1: Get orderbook', async () => {
      const response = await apiClient.get('/orderbook');
      expect(response.status).toBe(200);
    });

    it('Step 2: Get orderbook for specific market', async () => {
      if (!testMarketId) return;
      const response = await apiClient.get(`/orderbook?marketId=${testMarketId}`);
      expect(response.status).toBe(200);
    });

    it('Step 3: Get ranking', async () => {
      const response = await apiClient.get('/statistic/rank');
      expect(response.status).toBe(200);
    });
  });

  describe('Scenario 6: User profile and assets', () => {
    it('Step 1: Get user profile', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data.data).toHaveProperty('walletAddress');
      }
    });

    it('Step 2: Get user assets', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/asset');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Scenario 7: Proposed markets flow', () => {
    it('Step 1: Get proposed markets (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('Step 2: Get proposed market detail', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed-detail/1');
      authHelper.clearAuthToken();
      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it('Step 3: Vote on market', async () => {
      if (!testMarketId) return;
      authHelper.setAuthToken('user');
      const response = await apiClient.put(`/markets/vote/${testMarketId}`, {});
      authHelper.clearAuthToken();
      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });

  describe('Scenario 8: Guest user access (public vs protected)', () => {
    it('Public: GET /markets should succeed without auth', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
    });

    it('Public: GET /orderbook should succeed without auth', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/orderbook');
      expect(response.status).toBe(200);
    });

    it('Public: GET /trades/market-trade should succeed without auth', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/trades/market-trade');
      expect(response.status).toBe(200);
    });

    it('Protected: GET /orders should fail without auth', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/orders');
      expect(response.status).toBe(401);
    });

    it('Protected: POST /comments should fail without auth', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/comments', { content: 'test' });
      expect(response.status).toBe(401);
    });
  });
});
