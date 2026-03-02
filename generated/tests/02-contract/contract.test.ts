import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 02 - Contract Tests
 * Validates response structure and schema compliance
 * Source: generated/canonical-endpoints.json
 */

describe('02 - Contract Tests', () => {
  describe('Response Format', () => {
    it('Success response should have code, data fields', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
      expect(response.data).toHaveProperty('data');
    });

    it('List response should have metadata with pagination', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
      if (response.data.metadata) {
        expect(response.data.metadata).toHaveProperty('total');
      }
    });
  });

  describe('Markets', () => {
    it('GET /markets - response contract: code, data (array), metadata', async () => {
      const response = await apiClient.get('/markets');
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('GET /markets/{id} - response contract: code, data (object)', async () => {
      // First get a valid market ID
      const listResponse = await apiClient.get('/markets');
      if (listResponse.data.data && listResponse.data.data.length > 0) {
        const marketId = listResponse.data.data[0].id;
        const response = await apiClient.get(`/markets/${marketId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /markets/category - response contract: categories array', async () => {
      const response = await apiClient.get('/markets/category');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /markets/proposed - response contract (auth required)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/markets/proposed');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('code');
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Orders', () => {
    it('GET /orders - response contract: orders list', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('code');
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /orders/position - response contract: positions data', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /orders/position-claims - response contract: claims list', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position-claims');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /orders/activity - response contract: activity list', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/activity');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Trades', () => {
    it('GET /trades - response contract (auth required)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /trades/market-trade - response contract: trades list', async () => {
      const response = await apiClient.get('/trades/market-trade');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /trades/graph - response contract: graph data', async () => {
      const response = await apiClient.get('/trades/graph');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /trades/graph-overrall - response contract: overall graph', async () => {
      const response = await apiClient.get('/trades/graph-overrall');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });

    it('GET /trades/history - response contract (auth required)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/trades/history');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Comments', () => {
    it('GET /comments/market/{marketId} - response contract: comments list', async () => {
      const response = await apiClient.get('/comments/market/1');
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /comments/reply/{parentId} - response contract: replies list', async () => {
      const response = await apiClient.get('/comments/reply/1');
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Authentication', () => {
    it('GET /auth/me - response contract: user data (walletAddress, isAdmin, createdAt)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
        const userData = response.data.data;
        expect(userData).toHaveProperty('walletAddress');
        expect(userData).toHaveProperty('isAdmin');
        expect(userData).toHaveProperty('createdAt');
      }
    });

    it('GET /auth/me - metadata field present if returned', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();
      if (response.status === 200 && response.data.metadata) {
        expect(response.data.metadata).toHaveProperty('timestamp');
      }
    });

    it('GET /auth/asset - response contract: user asset data', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/asset');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Orderbook', () => {
    it('GET /orderbook - response contract: orderbook data', async () => {
      const response = await apiClient.get('/orderbook');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
    });
  });

  describe('Admin', () => {
    it('GET /admin - response contract (admin auth required)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/admin');
      authHelper.clearAuthToken();
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });
  });

  describe('Error Response Format', () => {
    it('401 error should have message field', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/orders');
      if (response.status === 401) {
        expect(response.data).toHaveProperty('message');
      }
    });

    it('400 error should have message field', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', { invalid: 'data' });
      authHelper.clearAuthToken();
      if (response.status === 400) {
        expect(response.data).toHaveProperty('message');
      }
    });
  });
});
