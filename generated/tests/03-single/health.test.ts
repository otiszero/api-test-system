/**
 * 03-single: Health API Tests
 * Endpoints: GET /api/health, GET /api/health/ready
 * No auth required - public endpoints
 */
import { describe, it, expect } from 'vitest';
import { apiClient } from '../../helpers/api-client';

describe('03-single: Health API', () => {
  // ─── GET /api/health ───────────────────────────────────────────────────────
  describe('GET /api/health', () => {
    it('returns 200 with health status', async () => {
      const res = await apiClient.get('/api/health');
      expect(res.status).toBe(200);
    }, 15000);

    it('response body is defined', async () => {
      const res = await apiClient.get('/api/health');
      expect(res.data).toBeDefined();
    }, 15000);
  });

  // ─── GET /api/health/ready ─────────────────────────────────────────────────
  describe('GET /api/health/ready', () => {
    it('returns 200 when service is ready', async () => {
      const res = await apiClient.get('/api/health/ready');
      expect(res.status).toBe(200);
    }, 15000);

    it('response body is defined', async () => {
      const res = await apiClient.get('/api/health/ready');
      expect(res.data).toBeDefined();
    }, 15000);
  });
});
