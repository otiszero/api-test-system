/**
 * Smoke Tests - Upmount Custody Platform API
 * Generated: 2026-03-05
 *
 * Purpose: Verify all endpoints are reachable and not returning 5xx errors
 * - Health endpoints → expect 200
 * - Auth endpoints → expect valid response
 * - Protected endpoints → expect 401 without auth, 2xx/4xx with auth
 * - Proxy endpoints → expect any non-5xx response
 *
 * Source: generated/canonical-endpoints.json (76 testable endpoints)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';
import dbConfig from '../../../config/db.config.json';
import { Pool } from 'pg';

// Timeout for smoke tests (generous to account for cold starts)
const SMOKE_TIMEOUT = 15000;

// API timeout from config
const API_TIMEOUT = 10000;

// Get user token for authenticated requests
const userToken = authConfig.accounts.user?.[0]?.token;

// DB connection (if enabled)
let dbPool: Pool | null = null;

describe('Smoke Tests - API Reachability', () => {
  beforeAll(async () => {
    // Setup DB connection if enabled
    if (dbConfig.enabled && dbConfig.type === 'pg') {
      try {
        dbPool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.username,
          password: dbConfig.password,
          ssl: dbConfig.ssl,
          max: dbConfig.pool?.max || 5,
          min: dbConfig.pool?.min || 1,
        });
      } catch (error) {
        console.warn('DB connection setup failed:', error);
      }
    }
  });

  afterAll(async () => {
    if (dbPool) {
      await dbPool.end();
    }
    apiClient.clearToken();
  });

  // ============================================================================
  // DB CONNECTION SMOKE TEST
  // ============================================================================
  describe('Database Connection', () => {
    it('should connect to PostgreSQL database', async () => {
      if (!dbConfig.enabled) {
        console.log('⏭️ DB disabled, skipping');
        return;
      }

      expect(dbPool).toBeTruthy();
      const result = await dbPool!.query('SELECT 1 as connected');
      expect(result.rows[0].connected).toBe(1);
    }, SMOKE_TIMEOUT);
  });

  // ============================================================================
  // PHASE 1: PUBLIC ENDPOINTS (No Auth Required)
  // ============================================================================
  describe('Phase 1: Public Endpoints', () => {
    describe('Health', () => {
      it('GET /api/health → should return 200', async () => {
        const response = await apiClient.get('/api/health');
        expect(response.status).toBe(200);
        expect(apiClient.getLastEvidence()?.duration).toBeLessThan(API_TIMEOUT);
      }, SMOKE_TIMEOUT);

      it('GET /api/health/ready → should return 200', async () => {
        const response = await apiClient.get('/api/health/ready');
        expect(response.status).toBe(200);
      }, SMOKE_TIMEOUT);
    });

    describe('Country', () => {
      it('GET /api/countries → should return 200 with countries array', async () => {
        const response = await apiClient.get('/api/countries');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data?.data) || Array.isArray(response.data)).toBe(true);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 2: AUTH ENDPOINTS (Mixed Auth)
  // ============================================================================
  describe('Phase 2: Auth Endpoints', () => {
    describe('Users auth - Public', () => {
      it('POST /api/users/auth/login → should accept request (not 5xx)', async () => {
        // Send invalid creds to test endpoint reachability
        const response = await apiClient.post('/api/users/auth/login', {
          email: 'smoke-test@example.com',
          password: 'smoke-test-password',
        });
        // Expect 400/401 (bad creds) but NOT 5xx
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/register → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/register', {
          email: 'smoke-test-register@example.com',
          password: 'SmokeTest123!',
        });
        // Expect 400/409 (validation/duplicate) but NOT 5xx
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/refresh-token → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/refresh-token', {
          refreshToken: 'invalid-token-for-smoke-test',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/verify-email → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/verify-email', {
          otp: '000000',
          email: 'smoke@test.com',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/verify-email/resend → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/verify-email/resend', {
          email: 'smoke@test.com',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/forgot-password → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/forgot-password', {
          email: 'smoke@test.com',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/forgot-password/verify-token → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/forgot-password/verify-token', {
          token: 'invalid-token',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/forgot-password/update-new-password → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/forgot-password/update-new-password', {
          token: 'invalid-token',
          newPassword: 'NewPass123!',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/auth/google → should redirect or respond (not 5xx)', async () => {
        const response = await apiClient.get('/api/users/auth/google');
        // OAuth redirect might return 302 or error
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/auth/google/callback → should accept request (not 5xx)', async () => {
        const response = await apiClient.get('/api/users/auth/google/callback');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/google/token → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/auth/google/token', {
          token: 'invalid-google-token',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/organization-members/verify-invite → should accept request (not 5xx)', async () => {
        const response = await apiClient.post('/api/users/organization-members/verify-invite', {
          token: 'invalid-invite-token',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Users auth - Protected (requires auth)', () => {
      beforeAll(() => {
        if (userToken) {
          apiClient.setToken(userToken);
        }
      });

      it('POST /api/users/auth/change-password → should require auth', async () => {
        apiClient.clearToken();
        const response = await apiClient.post('/api/users/auth/change-password', {
          currentPassword: 'old',
          newPassword: 'new',
        });
        expect(response.status).toBe(401);

        // Restore token
        if (userToken) apiClient.setToken(userToken);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/logout → should accept with auth (not 5xx)', async () => {
        if (!userToken) {
          console.log('⏭️ No user token, skipping');
          return;
        }
        const response = await apiClient.post('/api/users/auth/logout', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/two-factor/setup → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/two-factor/setup', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/two-factor/verify-setup → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/two-factor/verify-setup', {
          otp: '000000',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/two-factor/verify-login → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/two-factor/verify-login', {
          otp: '000000',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/two-factor/disable → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/two-factor/disable', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/2fa/change/send-email → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/2fa/change/send-email', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/2fa/change/verify-email → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/2fa/change/verify-email', {
          otp: '000000',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/auth/2fa/change/verify-ga → should accept with auth (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/auth/2fa/change/verify-ga', {
          otp: '000000',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 3: USER-LEVEL ENDPOINTS (Bearer Auth)
  // ============================================================================
  describe('Phase 3: User-level Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('User Profile', () => {
      it('GET /api/users/profile/me → should return 200 with profile', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/profile/me');
        expect(response.status).toBe(200);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/profile/me → should accept request (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/profile/me', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Identity Verification', () => {
      it('POST /api/users/identity-verification/kyc/init-kyc → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/identity-verification/kyc/init-kyc', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/identity-verification/kyc/status → should return status', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/identity-verification/kyc/status');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Files', () => {
      it('POST /api/users/files/upload-image → should accept (not 5xx)', async () => {
        if (!userToken) return;
        // Test with minimal data, expect 400 (bad request) but not 5xx
        const response = await apiClient.post('/api/users/files/upload-image', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/files/private-storage/presigned-post → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/files/private-storage/presigned-post', {
          filename: 'test.txt',
          contentType: 'text/plain',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/files/private-storage/presigned-get/{id} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/files/private-storage/presigned-get/test-id');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Organization RBAC', () => {
      it('GET /api/users/rbac/roles → should return roles', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/rbac/roles');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 4: ORGANIZATION ENDPOINTS (Bearer Auth)
  // ============================================================================
  describe('Phase 4: Organization Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('User Organization', () => {
      it('GET /api/users/organization/{id} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization/1');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/users/organization/{id} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/users/organization/1', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Organization KYB', () => {
      it('POST /api/users/organization-kyb → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/organization-kyb', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/organization-kyb/kyb-status → should return status', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization-kyb/kyb-status');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/organization-kyb/primary-owner-data → should return data', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/organization-kyb/{id}/detail → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization-kyb/1/detail');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Organization Member', () => {
      it('POST /api/users/organization-members/invite → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/organization-members/invite', {
          email: 'smoke-test-invite@example.com',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/organization-members/resend-invite → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/organization-members/resend-invite', {
          email: 'smoke-test-invite@example.com',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/users/organization-members/accept-invite → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/users/organization-members/accept-invite', {
          token: 'invalid-token',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/organization-members/members → should return members', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization-members/members');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/users/organization-members/remove-member → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/users/organization-members/remove-member', {
          userId: 'test-user-id',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/users/organization-members/change-member-role → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/users/organization-members/change-member-role', {
          userId: 'test-user-id',
          role: 'member',
        });
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/organization-members/export-members → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/organization-members/export-members');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 5: VAULT ENDPOINTS (Bearer + 2FA)
  // ============================================================================
  describe('Phase 5: Vault Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('Vault Accounts', () => {
      it('GET /api/users/vault-accounts → should return vaults', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/vault-accounts');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/vault-accounts → should accept (not 5xx)', async () => {
        if (!userToken) return;
        // This requires 2FA, so expect 400/403 but not 5xx
        const response = await apiClient.post('/api/users/vault-accounts', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/vault-accounts/{id} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/vault-accounts/1', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/vault-accounts/{id}/add-assets → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/vault-accounts/1/add-assets', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/vault-accounts/{id}/assign-users → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/vault-accounts/1/assign-users', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/vault-accounts/{id}/remove-users → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/vault-accounts/1/remove-users', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/vault-accounts/{id}/users → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/vault-accounts/1/users');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 6: TRANSACTION ENDPOINTS (Bearer Auth)
  // ============================================================================
  describe('Phase 6: Transaction Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('User Transactions', () => {
      it('GET /api/users/transactions → should return transactions', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/transactions');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/transactions/export → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/transactions/export');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/transactions/{transactionId} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/transactions/test-tx-id');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Withdraw', () => {
      it('POST /api/users/withdraw → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/withdraw', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/withdraw/{transactionId}/approve → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/withdraw/test-tx-id/approve', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/users/withdraw/{transactionId}/reject → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/users/withdraw/test-tx-id/reject', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 7: AUDIT ENDPOINTS (Bearer Auth)
  // ============================================================================
  describe('Phase 7: Audit Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('User Action Log', () => {
      it('GET /api/users/action-logs → should return logs', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/action-logs');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('GET /api/users/action-logs/export → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/action-logs/export');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Ledger', () => {
      it('GET /api/users/ledgers/export → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/users/ledgers/export');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // PHASE 8: PROXY ENDPOINTS
  // ============================================================================
  describe('Phase 8: Proxy Endpoints', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    describe('Monitoring Proxy (requires auth)', () => {
      it('GET /api/monitoring/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/monitoring/users/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/monitoring/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/monitoring/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/monitoring/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/monitoring/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('DELETE /api/monitoring/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.delete('/api/monitoring/users/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PATCH /api/monitoring/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.patch('/api/monitoring/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Processing Proxy - Auth Required', () => {
      it('GET /api/processing/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.get('/api/processing/users/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/processing/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.post('/api/processing/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/processing/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.put('/api/processing/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('DELETE /api/processing/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.delete('/api/processing/users/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PATCH /api/processing/users/{path} → should accept (not 5xx)', async () => {
        if (!userToken) return;
        const response = await apiClient.patch('/api/processing/users/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });

    describe('Processing Proxy - Public', () => {
      beforeAll(() => {
        apiClient.clearToken();
      });

      it('GET /api/processing/{path} → should accept (not 5xx)', async () => {
        const response = await apiClient.get('/api/processing/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('POST /api/processing/{path} → should accept (not 5xx)', async () => {
        const response = await apiClient.post('/api/processing/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PUT /api/processing/{path} → should accept (not 5xx)', async () => {
        const response = await apiClient.put('/api/processing/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('DELETE /api/processing/{path} → should accept (not 5xx)', async () => {
        const response = await apiClient.delete('/api/processing/test-path');
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);

      it('PATCH /api/processing/{path} → should accept (not 5xx)', async () => {
        const response = await apiClient.patch('/api/processing/test-path', {});
        expect(response.status).toBeLessThan(500);
      }, SMOKE_TIMEOUT);
    });
  });

  // ============================================================================
  // RESPONSE TIME CHECKS
  // ============================================================================
  describe('Response Time', () => {
    beforeAll(() => {
      if (userToken) apiClient.setToken(userToken);
    });

    it('All health endpoints should respond within timeout', async () => {
      const response1 = await apiClient.get('/api/health');
      const response2 = await apiClient.get('/api/health/ready');

      expect(apiClient.getAllEvidence().filter(e => e.url.includes('/health'))
        .every(e => e.duration < API_TIMEOUT)).toBe(true);
    }, SMOKE_TIMEOUT);

    it('Critical endpoints should respond within 5s', async () => {
      if (!userToken) return;

      const startTime = Date.now();
      await apiClient.get('/api/users/profile/me');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    }, SMOKE_TIMEOUT);
  });
});
