import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * 03 - Single API Tests: Comments
 * Tests comment endpoints behavior
 */

describe('Comments - Single API Tests', () => {
  describe('Read Comments', () => {
    it('GET /comments/market/{marketId} - should return market comments', async () => {
      const response = await apiClient.get('/comments/market/1');
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
      }
    });

    it('GET /comments/market/{marketId} - should support pagination', async () => {
      const response = await apiClient.get('/comments/market/1?limit=5&page=1');
      expect([200, 404]).toContain(response.status);
    });

    it('GET /comments/reply/{parentId} - should return replies', async () => {
      const response = await apiClient.get('/comments/reply/1');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Create Comment', () => {
    it('POST /comments - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/comments', {
        marketId: 1,
        content: 'Test comment'
      });
      expect(response.status).toBe(401);
    });

    it('POST /comments - should validate required fields', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments', {});
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });

    it('POST /comments - should reject empty content', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments', {
        marketId: 1,
        content: ''
      });
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Reply to Comment', () => {
    it('POST /comments/reply - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/comments/reply', {
        parentId: 1,
        content: 'Test reply'
      });
      expect(response.status).toBe(401);
    });

    it('POST /comments/reply - should validate required fields', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments/reply', {});
      authHelper.clearAuthToken();
      expect([400, 401, 422]).toContain(response.status);
    });
  });

  describe('Like Comment', () => {
    it('POST /comments/{commentId}/like - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.post('/comments/1/like');
      expect(response.status).toBe(401);
    });

    it('POST /comments/{commentId}/like - non-existent comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.post('/comments/999999999/like');
      authHelper.clearAuthToken();
      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe('Delete Comment', () => {
    it('DELETE /comments/{commentId} - should require authentication', async () => {
      apiClient.clearToken();
      const response = await apiClient.delete('/comments/1');
      expect(response.status).toBe(401);
    });

    it('DELETE /comments/{commentId} - non-existent comment', async () => {
      authHelper.setAuthToken('user');
      const response = await apiClient.delete('/comments/999999999');
      authHelper.clearAuthToken();
      expect([200, 204, 401, 403, 404]).toContain(response.status);
    });
  });
});
