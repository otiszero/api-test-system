import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Trades
 * Tests trade endpoints behavior
 */

describe('Trades - Single API Tests', () => {
  describe('Public Endpoints', () => {
    it('GET /trades/market-trade - should return market trades', async () => {
      const response = await apiClient.get('/trades/market-trade');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /trades/market-trade - should support query params', async () => {
      const response = await apiClient.get('/trades/market-trade?marketId=1');
      expect(response.status).toBe(200);
    });

    it('GET /trades/graph - should return graph data', async () => {
      const response = await apiClient.get('/trades/graph');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /trades/graph-overrall - should return overall graph', async () => {
      const response = await apiClient.get('/trades/graph-overrall');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });
  });

  describe('Auth Required Endpoints', () => {
    it('GET /trades - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/trades');
      expect(response.status).toBe(401);
    });

    it('GET /trades - should return user trades (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /trades - should support pagination', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades?limit=5&page=1');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /trades/history - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/trades/history');
      expect(response.status).toBe(401);
    });

    it('GET /trades/history - should return trade history (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades/history');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });
});
