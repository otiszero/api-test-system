/**
 * 03-single: Users Auth API Tests
 * 20 endpoints: register, login, refresh-token, verify-email, forgot-password,
 *               change-password, google OAuth, logout, 2FA setup/verify/disable/change
 * Mix of public (no auth) and protected (bearer) endpoints
 */
import { describe, it, expect, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const USER_TOKEN = authConfig.accounts.user[0].token;

describe('03-single: Users Auth API', () => {
  afterAll(() => {
    apiClient.clearToken();
  });

  // ─── POST /api/users/auth/register ─────────────────────────────────────────
  describe('POST /api/users/auth/register', () => {
    it('missing email → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/register', {
        password: 'Password123!',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('invalid email format → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/register', {
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('missing password → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/register', {
        email: 'test@example.com',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('duplicate existing email → 400/409', async () => {
      // Email OTP flow — only test validation, not full register flow
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/register', {
        email: 'tien.nguyen2@sotatek.com', // already exists
        password: 'Password123!',
      });
      expect([400, 409, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/login ─────────────────────────────────────────────
  describe('POST /api/users/auth/login', () => {
    it('missing credentials → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/login', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('wrong password → 400/401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/login', {
        email: 'tien.nguyen2@sotatek.com',
        password: 'WrongPassword999!',
      });
      expect([400, 401]).toContain(res.status);
    }, 15000);

    it('invalid email format → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/login', {
        email: 'bad-email',
        password: 'Password123!',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/refresh-token ────────────────────────────────────
  describe('POST /api/users/auth/refresh-token', () => {
    it('invalid refresh token → 400/401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/refresh-token', {
        refreshToken: 'invalid-token',
      });
      expect([400, 401]).toContain(res.status);
    }, 15000);

    it('missing refreshToken body → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/refresh-token', {});
      expect([400, 401, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/verify-email ─────────────────────────────────────
  describe('POST /api/users/auth/verify-email', () => {
    it('invalid OTP → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/verify-email', {
        email: 'test@example.com',
        otp: '000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('missing fields → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/verify-email', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/verify-email/resend ──────────────────────────────
  describe('POST /api/users/auth/verify-email/resend', () => {
    it('invalid email → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/verify-email/resend', {
        email: 'not-valid',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('missing email → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/verify-email/resend', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/forgot-password ─────────────────────────────────
  describe('POST /api/users/auth/forgot-password', () => {
    it('missing email → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/forgot-password', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('invalid email format → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/forgot-password', {
        email: 'not-an-email',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/forgot-password/verify-token ────────────────────
  describe('POST /api/users/auth/forgot-password/verify-token', () => {
    it('invalid token → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/forgot-password/verify-token', {
        token: 'invalid-token-000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);

    it('missing token → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/forgot-password/verify-token', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/forgot-password/update-new-password ─────────────
  describe('POST /api/users/auth/forgot-password/update-new-password', () => {
    it('missing required fields → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/forgot-password/update-new-password', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/change-password ─────────────────────────────────
  describe('POST /api/users/auth/change-password', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/change-password', {
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, wrong old password → 400/401', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/change-password', {
        oldPassword: 'WrongOldPassword!',
        newPassword: 'NewPass123!',
      });
      expect([400, 401]).toContain(res.status);
    }, 15000);

    it('with token, missing fields → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/change-password', {});
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── GET /api/users/auth/google ────────────────────────────────────────────
  describe('GET /api/users/auth/google', () => {
    it('endpoint is reachable (redirect or 200)', async () => {
      apiClient.clearToken();
      const res = await apiClient.get('/api/users/auth/google');
      // OAuth redirect — axios follows redirects, expect 200 or redirect status
      expect([200, 301, 302, 307, 308]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/google/token ─────────────────────────────────────
  describe('POST /api/users/auth/google/token', () => {
    it('missing token → 400/422', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/google/token', {});
      expect([400, 401, 422]).toContain(res.status);
    }, 15000);

    it('invalid google token → 400/401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/google/token', {
        token: 'invalid-google-token',
      });
      expect([400, 401, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/logout ───────────────────────────────────────────
  describe('POST /api/users/auth/logout', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/logout', {
        refreshToken: 'some-token',
      });
      expect(res.status).toBe(401);
    }, 15000);
  });

  // ─── POST /api/users/auth/two-factor/setup ─────────────────────────────────
  describe('POST /api/users/auth/two-factor/setup', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/two-factor/setup');
      expect(res.status).toBe(401);
    }, 15000);

    it('with valid token → 200 or 400 (already enabled)', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/two-factor/setup');
      expect([200, 400]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/two-factor/verify-setup ─────────────────────────
  describe('POST /api/users/auth/two-factor/verify-setup', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/two-factor/verify-setup', {
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, invalid OTP → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/two-factor/verify-setup', {
        otp: '000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/two-factor/verify-login ─────────────────────────
  describe('POST /api/users/auth/two-factor/verify-login', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/two-factor/verify-login', {
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, invalid OTP → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/two-factor/verify-login', {
        otp: '000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/two-factor/disable ──────────────────────────────
  describe('POST /api/users/auth/two-factor/disable', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/two-factor/disable');
      expect(res.status).toBe(401);
    }, 15000);
  });

  // ─── POST /api/users/auth/2fa/change/send-email ────────────────────────────
  describe('POST /api/users/auth/2fa/change/send-email', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/2fa/change/send-email');
      expect(res.status).toBe(401);
    }, 15000);

    it('with valid token → 200 or 400', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/2fa/change/send-email');
      expect([200, 400]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/2fa/change/verify-email ─────────────────────────
  describe('POST /api/users/auth/2fa/change/verify-email', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/2fa/change/verify-email', {
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, invalid OTP → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/2fa/change/verify-email', {
        otp: '000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });

  // ─── POST /api/users/auth/2fa/change/verify-ga ─────────────────────────────
  describe('POST /api/users/auth/2fa/change/verify-ga', () => {
    it('no auth token → 401', async () => {
      apiClient.clearToken();
      const res = await apiClient.post('/api/users/auth/2fa/change/verify-ga', {
        otp: '123456',
      });
      expect(res.status).toBe(401);
    }, 15000);

    it('with token, invalid OTP → 400/422', async () => {
      apiClient.setToken(USER_TOKEN);
      const res = await apiClient.post('/api/users/auth/2fa/change/verify-ga', {
        otp: '000000',
      });
      expect([400, 422]).toContain(res.status);
    }, 15000);
  });
});
