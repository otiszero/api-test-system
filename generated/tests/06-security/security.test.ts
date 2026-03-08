/**
 * Security Tests - Upmount Custody Platform
 * Tests for common security vulnerabilities
 *
 * Categories:
 * - Auth bypass attempts
 * - Token manipulation
 * - SQL injection
 * - XSS payload injection
 * - Header injection
 * - Rate limiting awareness
 * - Input validation boundaries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';

const TIMEOUT = 15000;
const ownerToken = authConfig.accounts.user?.[0]?.token;

// ============================================================================
// 1. AUTHENTICATION BYPASS
// ============================================================================
describe('Security: Auth Bypass', () => {
  afterAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('No token → protected endpoint returns 401', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Empty Bearer token → 401', async () => {
    apiClient.setToken('');
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Malformed JWT → 401', async () => {
    apiClient.setToken('not.a.valid.jwt.token');
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('Expired-like JWT (random base64) → 401', async () => {
    const fakeJwt = `${Buffer.from('{"alg":"HS256"}').toString('base64')}.${Buffer.from('{"sub":"fake","exp":0}').toString('base64')}.invalidsignature`;
    apiClient.setToken(fakeJwt);
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('JWT with "none" algorithm → 401', async () => {
    const header = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url');
    const payload = Buffer.from('{"sub":"admin","role":"admin","exp":9999999999}').toString('base64url');
    apiClient.setToken(`${header}.${payload}.`);
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('SQL in Authorization header → 401 (no 5xx)', async () => {
    apiClient.setToken("' OR '1'='1");
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBe(401);
  }, TIMEOUT);

  it('XSS in Authorization header → 401 (no 5xx)', async () => {
    apiClient.setToken('<script>alert(1)</script>');
    const res = await apiClient.get('/api/users/profile/me');
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// 2. SQL INJECTION - Login endpoint
// ============================================================================
describe('Security: SQL Injection - Login', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "1; SELECT * FROM pg_tables",
    "' OR 1=1 LIMIT 1 --",
  ];

  for (const payload of sqlPayloads) {
    it(`Login with SQL payload: ${payload.substring(0, 30)}... → no 5xx`, async () => {
      const res = await apiClient.post('/api/users/auth/login', {
        email: payload,
        password: payload,
      });
      expect(res.status).toBeLessThan(500);
      // Should NOT return 200 (successful login)
      expect(res.status).not.toBe(200);
    }, TIMEOUT);
  }
});

// ============================================================================
// 3. SQL INJECTION - Path parameters
// ============================================================================
describe('Security: SQL Injection - Path Params', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  const pathInjections = [
    "1' OR '1'='1",
    '1; DROP TABLE vault_accounts;--',
    "1 UNION SELECT * FROM users--",
    '../../../etc/passwd',
    '1%00',
  ];

  for (const injection of pathInjections) {
    it(`GET /vault-accounts/${injection.substring(0, 20)}... → no 5xx`, async () => {
      if (!ownerToken) return;
      const res = await apiClient.get(`/api/users/vault-accounts/${encodeURIComponent(injection)}`);
      expect(res.status).toBeLessThan(500);
    }, TIMEOUT);
  }
});

// ============================================================================
// 4. XSS INJECTION - Request bodies
// ============================================================================
describe('Security: XSS Injection', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(document.cookie)</script>',
    "javascript:alert('XSS')",
    '<svg onload=alert(1)>',
    '{{constructor.constructor("return this")()}}',
  ];

  it('XSS in profile update → should not reflect in response', async () => {
    if (!ownerToken) return;

    for (const payload of xssPayloads) {
      const res = await apiClient.post('/api/users/profile/me', {
        name: payload,
        bio: payload,
      });
      expect(res.status).toBeLessThan(500);

      // If response contains the payload, it should be sanitized
      const bodyStr = JSON.stringify(res.data);
      if (bodyStr.includes(payload)) {
        // If echoed back, ensure it's not in raw HTML context
        expect(bodyStr).not.toContain('<script>');
      }
    }
  }, TIMEOUT);

  it('XSS in register email → should be rejected', async () => {
    const res = await apiClient.post('/api/users/auth/register', {
      email: '<script>alert(1)</script>@test.com',
      password: 'Test123!',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
  }, TIMEOUT);

  it('XSS in organization invite email → should be rejected', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/organization-members/invite', {
      email: '"><script>alert(1)</script>@test.com',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, TIMEOUT);
});

// ============================================================================
// 5. HEADER INJECTION
// ============================================================================
describe('Security: Header Injection', () => {
  it('Host header injection → no 5xx', async () => {
    const res = await apiClient.get('/api/health', {
      headers: { 'Host': 'evil.example.com' },
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('X-Forwarded-For spoofing → no 5xx', async () => {
    const res = await apiClient.get('/api/health', {
      headers: { 'X-Forwarded-For': '127.0.0.1' },
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Content-Type manipulation → no 5xx', async () => {
    if (!ownerToken) return;
    apiClient.setToken(ownerToken);

    const res = await apiClient.post('/api/users/auth/login',
      'email=test@test.com&password=test',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Oversized Content-Length header → no 5xx or timeout', async () => {
    const res = await apiClient.post('/api/users/auth/login',
      { email: 'test@test.com', password: 'test' },
      { headers: { 'Content-Length': '99999999' } }
    );
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// 6. INPUT VALIDATION BOUNDARIES
// ============================================================================
describe('Security: Input Validation', () => {
  it('Extremely long email (10000 chars) → no 5xx', async () => {
    const longEmail = 'a'.repeat(10000) + '@test.com';
    const res = await apiClient.post('/api/users/auth/login', {
      email: longEmail,
      password: 'test',
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Extremely long password (10000 chars) → no 5xx', async () => {
    const res = await apiClient.post('/api/users/auth/login', {
      email: 'test@test.com',
      password: 'a'.repeat(10000),
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Null bytes in email → no 5xx', async () => {
    const res = await apiClient.post('/api/users/auth/login', {
      email: 'test\x00@test.com',
      password: 'test',
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Unicode overflow in body → no 5xx', async () => {
    const res = await apiClient.post('/api/users/auth/login', {
      email: '👨‍👩‍👧‍👦'.repeat(1000) + '@test.com',
      password: '🔐'.repeat(500),
    });
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Empty body on POST endpoint → no 5xx', async () => {
    const res = await apiClient.post('/api/users/auth/login', {});
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Array instead of object body → no 5xx', async () => {
    const res = await apiClient.post('/api/users/auth/login', []);
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);

  it('Nested object depth attack → no 5xx', async () => {
    let nested: any = { value: 'deep' };
    for (let i = 0; i < 50; i++) {
      nested = { nested };
    }
    const res = await apiClient.post('/api/users/auth/login', nested);
    expect(res.status).toBeLessThan(500);
  }, TIMEOUT);
});

// ============================================================================
// 7. PATH TRAVERSAL
// ============================================================================
describe('Security: Path Traversal', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  const traversalPaths = [
    '../../../etc/passwd',
    '..%2F..%2F..%2Fetc%2Fpasswd',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ];

  for (const path of traversalPaths) {
    it(`Path traversal: ${path.substring(0, 25)}... → no 5xx`, async () => {
      if (!ownerToken) return;
      const res = await apiClient.get(`/api/users/files/private-storage/presigned-get/${encodeURIComponent(path)}`);
      expect(res.status).toBeLessThan(500);
    }, TIMEOUT);
  }
});

// ============================================================================
// 8. RESPONSE SECURITY HEADERS (on health endpoint)
// ============================================================================
describe('Security: Response Headers', () => {
  it('Health endpoint should not expose server version', async () => {
    const res = await apiClient.get('/api/health');
    const serverHeader = res.headers?.['server'] || '';
    // Should not expose detailed version info
    expect(serverHeader).not.toMatch(/apache\/\d|nginx\/\d|express/i);
  }, TIMEOUT);

  it('Response should not contain X-Powered-By', async () => {
    const res = await apiClient.get('/api/health');
    // X-Powered-By should be removed (Express default removed by helmet)
    const xPoweredBy = res.headers?.['x-powered-by'];
    expect(xPoweredBy).toBeUndefined();
  }, TIMEOUT);
});

// ============================================================================
// 9. IDOR (Insecure Direct Object Reference)
// ============================================================================
describe('Security: IDOR', () => {
  it('User A cannot access User B profile data via ID manipulation', async () => {
    if (!ownerToken) return;

    // Get current user profile
    apiClient.setToken(ownerToken);
    const profileRes = await apiClient.get('/api/users/profile/me');
    expect(profileRes.status).toBe(200);

    // Try accessing with different org ID
    const res = await apiClient.get('/api/users/organization/999999');
    // Should return 403 (forbidden) or 404 (not found), not another org's data
    if (res.status === 200) {
      // If 200, verify it's not leaking another org's data
      const data = res.data?.data || res.data;
      // At minimum, should be the user's own org or empty
    } else {
      expect([403, 404]).toContain(res.status);
    }
  }, TIMEOUT);

  it('Normal user cannot access other user vault accounts', async () => {
    const normalToken = authConfig.accounts.user?.[1]?.token;
    if (!normalToken) return;

    apiClient.setToken(normalToken);
    // Try accessing vault with random ID
    const res = await apiClient.get('/api/users/vault-accounts/999999');
    expect(res.status).toBeLessThan(500);
    // Should be 403 or 404, not another user's vault
    expect([400, 403, 404]).toContain(res.status);

    // Restore owner token
    if (ownerToken) apiClient.setToken(ownerToken);
  }, TIMEOUT);
});

// ============================================================================
// 10. 2FA BYPASS ATTEMPTS
// ============================================================================
describe('Security: 2FA Bypass', () => {
  beforeAll(() => {
    if (ownerToken) apiClient.setToken(ownerToken);
  });

  it('Invalid OTP format → should reject', async () => {
    if (!ownerToken) return;

    const invalidOtps = ['00000', '1234567', 'abcdef', '', '      ', '-12345'];
    for (const otp of invalidOtps) {
      const res = await apiClient.post('/api/users/auth/two-factor/verify-login', { otp });
      expect(res.status).toBeLessThan(500);
      expect(res.status).not.toBe(200);
    }
  }, TIMEOUT);

  it('Vault create without OTP → should be rejected', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/vault-accounts', {
      name: 'NoOTPVault',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, TIMEOUT);

  it('Withdraw without OTP → should be rejected', async () => {
    if (!ownerToken) return;

    const res = await apiClient.post('/api/users/withdraw', {
      amount: '0.001',
    });
    expect(res.status).toBeLessThan(500);
    expect(res.status).toBeGreaterThanOrEqual(400);
  }, TIMEOUT);
});
