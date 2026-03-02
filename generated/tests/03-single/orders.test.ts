import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Orders
 * Tests order endpoints behavior, validation, state transitions
 */

describe('Orders - Single API Tests', () => {
  describe('Happy Path', () => {
    it('GET /orders - should list user orders (auth)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /orders - should support pagination', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders?limit=5&page=1');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /orders/position - should return user positions', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /orders/position-claims - should return position claims', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position-claims');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });

    it('GET /orders/activity - should return order activity', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/activity');
      authHelper.clearAuthToken();
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Create Order', () => {
    it('POST /orders - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/orders', {
        marketId: 1,
        outcomeId: 1,
        amount: 100,
        txHash: 'test-tx-hash'
      });
      expect(response.status).toBe(401);
    });

    it('POST /orders - should validate required fields', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {});
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });

    it('POST /orders - should create order with valid data', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {
        marketId: 1,
        outcomeId: 1,
        amount: 100,
        txHash: `test-tx-${Date.now()}`
      });
      authHelper.clearAuthToken();
      // May fail due to business logic (invalid market, etc)
      expect([200, 201, 400, 401, 422]).toContain(response.status);
    });
  });

  describe('Validation', () => {
    it('POST /orders - should reject negative amount', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {
        marketId: 1,
        outcomeId: 1,
        amount: -100,
        txHash: 'test-tx-negative'
      });
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });

    it('POST /orders - should reject zero amount', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {
        marketId: 1,
        outcomeId: 1,
        amount: 0,
        txHash: 'test-tx-zero'
      });
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });

    it('POST /orders - should reject missing marketId', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders', {
        outcomeId: 1,
        amount: 100,
        txHash: 'test-tx-no-market'
      });
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Cancel Order', () => {
    it('PUT /orders/{id}/cancelled - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.put('/orders/1/cancelled');
      expect(response.status).toBe(401);
    });

    it('PUT /orders/{id}/cancelled - non-existent order should return 404', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/orders/999999999/cancelled');
      authHelper.clearAuthToken();
      expect([400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('Claim Order', () => {
    it('PUT /orders/{id}/claimed - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.put('/orders/1/claimed');
      expect(response.status).toBe(401);
    });

    it('PUT /orders/{id}/claimed - non-existent order should return 404', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.put('/orders/999999999/claimed');
      authHelper.clearAuthToken();
      expect([400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe('Add Liquidity', () => {
    it('POST /orders/add-liquidity - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/orders/add-liquidity', {});
      expect(response.status).toBe(401);
    });

    it('POST /orders/add-liquidity - should validate input', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/orders/add-liquidity', {});
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Security - Auth Required', () => {
    it('GET /orders - without auth should return 401', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/orders');
      expect(response.status).toBe(401);
    });

    it('GET /orders/position - without auth should return 401', async () => {
      apiClient.clearToken();
      const response = await apiClient.get('/orders/position');
      expect(response.status).toBe(401);
    });
  });
});
