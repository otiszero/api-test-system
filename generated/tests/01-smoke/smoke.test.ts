import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 01 - Smoke Tests
 * Verifies all testable endpoints are reachable
 * Source: generated/canonical-endpoints.json (46 testable endpoints)
 */

describe('01 - Smoke Tests', () => {
  describe('Health Check', () => {
    it('GET / → server is reachable', async () => {
      const response = await apiClient.get('/');
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Markets - Public', () => {
    it('GET /markets → list all markets', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
    });

    it('GET /markets/{id} → get market detail', async () => {
      const response = await apiClient.get('/markets/1');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /markets/category → get categories', async () => {
      const response = await apiClient.get('/markets/category');
      expect(response.status).toBe(200);
    });

    it('GET /markets/top-holders/{id} → top holders', async () => {
      const response = await apiClient.get('/markets/top-holders/1');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /markets/ipfs/{id} → IPFS data', async () => {
      const response = await apiClient.get('/markets/ipfs/1');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Markets - Auth Required', () => {
    it('GET /markets/proposed → proposed markets', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /markets/proposed-detail/{id} → proposed detail', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed-detail/1');
      authHelper.clearAuthToken();
      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it('GET /markets/favorites → user favorites', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/favorites');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('POST /markets/{marketId}/favorite → toggle favorite', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/markets/1/favorite');
      authHelper.clearAuthToken();
      expect([200, 201, 401, 404]).toContain(response.status);
    });

    it('POST /markets/market → create market', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/markets/market', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('PUT /markets/vote/{id} → vote on market', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/markets/vote/1', {});
      authHelper.clearAuthToken();
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    it('PUT /markets/add-liquidity/{id} → add liquidity', async () => {
      const response = await apiClient.put('/markets/add-liquidity/1', {});
      expect([200, 400, 404]).toContain(response.status);
    });

    it('POST /markets/upload → upload file', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/markets/upload', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 500]).toContain(response.status);
    });
  });

  describe('Orders - Auth Required', () => {
    it('GET /orders → list orders', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('POST /orders → create order', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('PUT /orders/{id}/cancelled → cancel order', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/orders/1/cancelled');
      authHelper.clearAuthToken();
      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });

    it('PUT /orders/{id}/claimed → claim order', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/orders/1/claimed');
      authHelper.clearAuthToken();
      expect([200, 400, 401, 403, 404]).toContain(response.status);
    });

    it('GET /orders/position → user positions', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /orders/position-claims → position claims', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position-claims');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('POST /orders/position-claims → save position claim', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders/position-claims', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('POST /orders/add-liquidity → add liquidity', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders/add-liquidity', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('GET /orders/activity → order activity', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/activity');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Trades', () => {
    it('GET /trades → user trades', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /trades/market-trade → market trades', async () => {
      const response = await apiClient.get('/trades/market-trade');
      expect(response.status).toBe(200);
    });

    it('GET /trades/graph → trade graph', async () => {
      const response = await apiClient.get('/trades/graph');
      expect(response.status).toBe(200);
    });

    it('GET /trades/graph-overrall → overall trade graph', async () => {
      const response = await apiClient.get('/trades/graph-overrall');
      expect(response.status).toBe(200);
    });

    it('GET /trades/history → trade history', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades/history');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Comments', () => {
    it('GET /comments/market/{marketId} → market comments', async () => {
      const response = await apiClient.get('/comments/market/1');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /comments/reply/{parentId} → comment replies', async () => {
      const response = await apiClient.get('/comments/reply/1');
      expect([200, 404]).toContain(response.status);
    });

    it('POST /comments → create comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('POST /comments/reply → reply to comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments/reply', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });

    it('POST /comments/{commentId}/like → like comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments/1/like');
      authHelper.clearAuthToken();
      expect([200, 201, 401, 404]).toContain(response.status);
    });

    it('DELETE /comments/{commentId} → delete comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.delete('/comments/999999');
      authHelper.clearAuthToken();
      expect([200, 204, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('Authentication', () => {
    it('POST /auth/login → login endpoint exists', async () => {
      const response = await apiClient.post('/auth/login', {});
      expect([200, 400, 401, 422]).toContain(response.status);
    });

    it('POST /auth/logout → logout endpoint', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/auth/logout');
      authHelper.clearAuthToken();
      expect([200, 204, 401]).toContain(response.status);
    });

    it('POST /auth/refresh-token → refresh token', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/auth/refresh-token', {});
      authHelper.clearAuthToken();
      expect([200, 400, 401]).toContain(response.status);
    });

    it('POST /auth/admin-refresh-token → admin refresh', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/auth/admin-refresh-token', {});
      authHelper.clearAuthToken();
      expect([200, 400, 401]).toContain(response.status);
    });

    it('GET /auth/me → current user profile', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /auth/asset → user assets', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/asset');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Admin', () => {
    it('GET /admin → list admins', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/admin');
      authHelper.clearAuthToken();
      expect([200, 401, 403]).toContain(response.status);
    });

    it('POST /admin → create admin', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/admin', {});
      authHelper.clearAuthToken();
      expect([200, 201, 400, 401, 403, 422]).toContain(response.status);
    });

    it('PUT /admin → update admin', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/admin', {});
      authHelper.clearAuthToken();
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe('Other', () => {
    it('GET /orderbook → orderbook data', async () => {
      const response = await apiClient.get('/orderbook');
      expect(response.status).toBe(200);
    });

    it('GET /statistic/rank → ranking data', async () => {
      const response = await apiClient.get('/statistic/rank');
      expect(response.status).toBe(200);
    });

    it('GET /slack/{id} → slack test', async () => {
      const response = await apiClient.get('/slack/test');
      expect([200, 404]).toContain(response.status);
    });
  });
});
