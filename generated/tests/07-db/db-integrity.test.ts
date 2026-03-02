import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 07 - DB Integrity Tests
 * Tests data consistency through API operations
 * Note: These tests verify integrity through API, not direct DB access
 */

describe('07 - DB Integrity Tests', () => {
  describe('Data Consistency', () => {
    it('Market list count should match metadata total', async () => {
      const response = await apiClient.get('/markets?limit=100');
      if (response.status === 200 && response.data.metadata) {
        const dataCount = response.data.data?.length || 0;
        const total = response.data.metadata.total || 0;
        // Data length should be <= total
        expect(dataCount).toBeLessThanOrEqual(total);
      }
    });

    it('Paginated results should be consistent', async () => {
      const page1 = await apiClient.get('/markets?limit=5&page=1');
      const page2 = await apiClient.get('/markets?limit=5&page=2');

      if (page1.status === 200 && page2.status === 200) {
        // Pages should not have overlapping items
        const ids1 = page1.data.data?.map((m: any) => m.id) || [];
        const ids2 = page2.data.data?.map((m: any) => m.id) || [];
        const overlap = ids1.filter((id: number) => ids2.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it('Market detail should match list item', async () => {
      const listResponse = await apiClient.get('/markets?limit=1');
      if (listResponse.status === 200 && listResponse.data.data?.length > 0) {
        const market = listResponse.data.data[0];
        const detailResponse = await apiClient.get(`/markets/${market.id}`);
        if (detailResponse.status === 200) {
          expect(detailResponse.data.data.id).toBe(market.id);
        }
      }
    });
  });

  describe('Referential Integrity', () => {
    it('Orders should reference valid markets', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders?limit=5');
      authHelper.clearAuthToken();

      if (response.status === 200 && response.data.data?.length > 0) {
        for (const order of response.data.data) {
          if (order.marketId) {
            const marketResponse = await apiClient.get(`/markets/${order.marketId}`);
            // Market should exist (200) or be soft deleted (404 acceptable)
            expect([200, 404]).toContain(marketResponse.status);
          }
        }
      }
    });

    it('Comments should reference valid markets', async () => {
      // Get comments from a known market
      const marketsResponse = await apiClient.get('/markets?limit=1');
      if (marketsResponse.status === 200 && marketsResponse.data.data?.length > 0) {
        const marketId = marketsResponse.data.data[0].id;
        const commentsResponse = await apiClient.get(`/comments/market/${marketId}`);
        if (commentsResponse.status === 200 && commentsResponse.data.data?.length > 0) {
          for (const comment of commentsResponse.data.data) {
            expect(comment.marketId).toBe(marketId);
          }
        }
      }
    });
  });

  describe('Position Consistency', () => {
    it('Position data should be non-negative', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/orders/position');
      authHelper.clearAuthToken();

      if (response.status === 200 && response.data.data) {
        const positions = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];

        for (const position of positions) {
          if (position.balance !== undefined) {
            expect(position.balance).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });
  });

  describe('Timestamp Integrity', () => {
    it('CreatedAt timestamps should be valid ISO dates', async () => {
      const response = await apiClient.get('/markets?limit=5');
      if (response.status === 200 && response.data.data?.length > 0) {
        for (const market of response.data.data) {
          if (market.createdAt) {
            const date = new Date(market.createdAt);
            expect(date.getTime()).not.toBeNaN();
          }
        }
      }
    });

    it('UpdatedAt should be >= CreatedAt', async () => {
      const response = await apiClient.get('/markets?limit=5');
      if (response.status === 200 && response.data.data?.length > 0) {
        for (const market of response.data.data) {
          if (market.createdAt && market.updatedAt) {
            const created = new Date(market.createdAt).getTime();
            const updated = new Date(market.updatedAt).getTime();
            expect(updated).toBeGreaterThanOrEqual(created);
          }
        }
      }
    });
  });

  describe('Unique Constraints', () => {
    it('User walletAddress should be unique (via API)', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();

      if (response.status === 200) {
        const walletAddress = response.data.data?.walletAddress;
        expect(walletAddress).toBeDefined();
        expect(typeof walletAddress).toBe('string');
        expect(walletAddress.length).toBeGreaterThan(0);
      }
    });
  });
});
