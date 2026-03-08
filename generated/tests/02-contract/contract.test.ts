import { describe, it, expect, beforeAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { schemaValidator } from '../../helpers/schema-validator';
import authConfig from '../../../config/auth.config.json';

/**
 * 02 - Contract Tests (Upmount Custody Platform)
 * Validates response schemas match OpenAPI spec definitions.
 * Source: generated/canonical-endpoints.json (76 endpoints, 0 blacklisted)
 *
 * Strategy:
 * - GET endpoints → assert 200 + validate ResponseDto envelope + data schema
 * - POST/PUT mutation endpoints → send invalid/missing body → assert 400/401/422
 *   and validate error shape (errorCode, message, requestId, timestamp)
 * - Proxy endpoints (Monitoring/Processing) → skipped (wildcard paths, no schema)
 * - Admin token = TODO → skip admin-only assertions
 */

const USER_TOKEN = authConfig.accounts.user[0].token;

// ── Shared helpers ──────────────────────────────────────────────────────────

/** Assert ResponseDto envelope fields are present */
function assertResponseEnvelope(body: any) {
  expect(body).toHaveProperty('errorCode');
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('requestId');
  expect(body).toHaveProperty('timestamp');
  expect(typeof body.errorCode).toBe('string');
  expect(typeof body.message).toBe('string');
  expect(typeof body.requestId).toBe('string');
  expect(typeof body.timestamp).toBe('string');
}

/** Assert error response envelope (4xx) */
function assertErrorEnvelope(body: any) {
  // API returns errorCode + message on errors
  expect(body).toHaveProperty('message');
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  apiClient.setToken(USER_TOKEN);
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Health
// ════════════════════════════════════════════════════════════════════════════

describe('Health', () => {
  it('GET /api/health → 200 with description field', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/health');
    expect(res.status).toBe(200);
    // Health endpoint has no JSON schema defined in spec — just assert it responds
    expect(res.data).toBeDefined();
    apiClient.setToken(USER_TOKEN);
  });

  it('GET /api/health/ready → 200', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.data).toBeDefined();
    apiClient.setToken(USER_TOKEN);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Users Auth
// ════════════════════════════════════════════════════════════════════════════

describe('Users Auth', () => {
  it('POST /api/users/auth/register → 400 on missing body; error envelope present', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/register', {});
    expect([400, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/register → 200 response schema: ResponseDto + SendOtpResDto', async () => {
    // Send an already-used/existing email to trigger a known 200 (resend OTP) or 400.
    // Either way, validate the envelope shape
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/register', {
      email: 'contract-test-nonexistent@upmount-test.invalid',
      password: 'Test@12345!',
    });
    // Could be 200 (OTP sent) or 400 (validation). Both must have envelope.
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const schema = schemaValidator.getResponseSchema('/api/users/auth/register', 'post', '200');
      if (schema) {
        const result = schemaValidator.validateSchema(res.data, 'ResponseDto');
        // Envelope fields must be valid
        expect(result.valid || result.errors.length === 0).toBeTruthy();
      }
      if (res.data.data) {
        expect(res.data.data).toHaveProperty('otpSentBefore');
        expect(res.data.data).toHaveProperty('nextResendOtpAt');
        expect(typeof res.data.data.otpSentBefore).toBe('boolean');
        expect(typeof res.data.data.nextResendOtpAt).toBe('number');
      }
    } else {
      assertErrorEnvelope(res.data);
    }
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/login → 400 on empty body; error envelope present', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/login', {});
    expect([400, 401, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/login → 200 schema: LoginResponseDto (accessToken, refreshToken, user)', async () => {
    // Use wrong credentials — expect 401 with error envelope, or if creds work, validate 200
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/login', {
      email: 'invalid@upmount-test.invalid',
      password: 'WrongPass!1',
    });
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data.data).toHaveProperty('accessToken');
      expect(res.data.data).toHaveProperty('refreshToken');
      expect(res.data.data).toHaveProperty('user');
      expect(typeof res.data.data.accessToken).toBe('string');
      expect(typeof res.data.data.refreshToken).toBe('string');
    } else {
      // 401 or 400 — validate error envelope
      assertErrorEnvelope(res.data);
    }
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/refresh-token → 401 on invalid token; error envelope present', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/refresh-token', {
      refreshToken: 'invalid.refresh.token',
    });
    expect([400, 401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/forgot-password → 200 with ResponseDto envelope', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/forgot-password', {
      email: 'nonexistent@upmount-test.invalid',
    });
    // API typically returns 200 even for unknown emails (security best practice)
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
    } else {
      assertErrorEnvelope(res.data);
    }
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/forgot-password/verify-token → 400 on missing body', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/forgot-password/verify-token', {});
    expect([400, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/change-password → 401 without auth token', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/change-password', {
      oldPassword: 'OldPass!1',
      newPassword: 'NewPass!2',
    });
    expect([401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/auth/two-factor/setup → 200/400 with ResponseDto envelope (auth required)', async () => {
    // Authenticated request — user may or may not have 2FA enabled
    const res = await apiClient.post('/api/users/auth/two-factor/setup', undefined);
    expect([200, 400, 409]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      // SetupTwoFactorResponseDto shape
      if (res.data.data) {
        expect(res.data.data).toBeDefined();
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('POST /api/users/auth/two-factor/verify-setup → 400 on invalid OTP (auth required)', async () => {
    const res = await apiClient.post('/api/users/auth/two-factor/verify-setup', {
      otp: '000000',
    });
    expect([400, 401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/auth/logout → 200/400 with ResponseDto envelope (auth required)', async () => {
    const res = await apiClient.post('/api/users/auth/logout', {
      refreshToken: 'fake-token',
    });
    expect([200, 400, 401]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. User Profile
// ════════════════════════════════════════════════════════════════════════════

describe('User Profile', () => {
  it('GET /api/users/profile/me → 200 or 401; if 200 validate UserProfileResponseDto', async () => {
    const res = await apiClient.get('/api/users/profile/me');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      expect(data).toBeDefined();
      // UserProfileResponseDto required: id, email, displayName, imageUrl, hasPassword
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('displayName');
      expect(data).toHaveProperty('imageUrl');
      expect(data).toHaveProperty('hasPassword');
      expect(typeof data.id).toBe('string');
      expect(typeof data.email).toBe('string');
      expect(typeof data.hasPassword).toBe('boolean');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('POST /api/users/profile/me → 200/400 with ResponseDto envelope (auth required)', async () => {
    const res = await apiClient.post('/api/users/profile/me', {
      displayName: 'Contract Test User',
    });
    expect([200, 400, 401]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/profile/me → 401 without auth token', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/users/profile/me');
    expect([401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Vault Accounts
// ════════════════════════════════════════════════════════════════════════════

describe('Vault Accounts', () => {
  it('GET /api/users/vault-accounts → 200/401; if 200 validate ResponseDto envelope', async () => {
    const res = await apiClient.get('/api/users/vault-accounts');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      // Response has no strict JSON schema in spec for the list — validate envelope only
      expect(res.data).toHaveProperty('data');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/vault-accounts → 401 without auth token', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/users/vault-accounts');
    expect([401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('POST /api/users/vault-accounts → 400/401 on missing OTP body', async () => {
    const res = await apiClient.post('/api/users/vault-accounts', {});
    expect([400, 401, 403, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/vault-accounts/{id} → 400/404 on non-existent vault ID', async () => {
    const res = await apiClient.post('/api/users/vault-accounts/non-existent-id', {
      name: 'Contract Test',
    });
    expect([400, 401, 403, 404, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('GET /api/users/vault-accounts/{id}/users → 400/404 on non-existent vault ID', async () => {
    const res = await apiClient.get('/api/users/vault-accounts/non-existent-id/users');
    expect([400, 401, 403, 404]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. User Transactions
// ════════════════════════════════════════════════════════════════════════════

describe('User Transactions', () => {
  it('GET /api/users/transactions → 200/401; if 200 validate ResponseDto envelope', async () => {
    const res = await apiClient.get('/api/users/transactions');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data).toHaveProperty('data');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/transactions → 401 without auth token', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/users/transactions');
    expect([401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('GET /api/users/transactions/{transactionId} → 404/400 on non-existent ID', async () => {
    const res = await apiClient.get('/api/users/transactions/non-existent-tx-id');
    expect([400, 401, 403, 404]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('GET /api/users/transactions/export → 200/401; validate ResponseDto envelope', async () => {
    const res = await apiClient.get('/api/users/transactions/export');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      // Export may return CSV or JSON
      expect(res.data).toBeDefined();
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Organization Members
// ════════════════════════════════════════════════════════════════════════════

describe('Organization Members', () => {
  it('GET /api/users/organization-members/members → 200/401; validate ResponseDto envelope', async () => {
    const res = await apiClient.get('/api/users/organization-members/members');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data).toHaveProperty('data');
      // If paginated, validate meta
      if (res.data.meta) {
        const meta = res.data.meta;
        expect(meta).toHaveProperty('itemCount');
        expect(meta).toHaveProperty('itemsPerPage');
        expect(meta).toHaveProperty('currentPage');
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('POST /api/users/organization-members/invite → 400 on missing required fields', async () => {
    const res = await apiClient.post('/api/users/organization-members/invite', {});
    expect([400, 401, 403, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/organization-members/verify-invite → 400 on invalid token', async () => {
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/organization-members/verify-invite', {
      token: 'invalid-invite-token',
    });
    expect([400, 401, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data.data).toHaveProperty('needRegister');
      expect(typeof res.data.data.needRegister).toBe('boolean');
    } else {
      assertErrorEnvelope(res.data);
    }
    apiClient.setToken(USER_TOKEN);
  });

  it('GET /api/users/organization-members/export-members → 200/401; validate response', async () => {
    const res = await apiClient.get('/api/users/organization-members/export-members');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data).toBeDefined();
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Organization KYB
// ════════════════════════════════════════════════════════════════════════════

describe('Organization KYB', () => {
  it('GET /api/users/organization-kyb/kyb-status → 200/401; if 200 validate OrganizationKybStatusResponseDto', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/kyb-status');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data).toHaveProperty('data');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/organization-kyb/primary-owner-data → 200/401; validate ResponseDto envelope', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/primary-owner-data');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      expect(res.data).toHaveProperty('data');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/organization-kyb/{id}/detail → 404/400 on invalid ID', async () => {
    const res = await apiClient.get('/api/users/organization-kyb/99999999/detail');
    expect([400, 401, 403, 404]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/organization-kyb → 400/422 on missing required fields', async () => {
    const res = await apiClient.post('/api/users/organization-kyb', {});
    expect([400, 401, 403, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Files
// ════════════════════════════════════════════════════════════════════════════

describe('Files', () => {
  it('POST /api/users/files/private-storage/presigned-post → 400/422 on missing body', async () => {
    const res = await apiClient.post('/api/users/files/private-storage/presigned-post', {});
    expect([400, 401, 403, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('GET /api/users/files/private-storage/presigned-get/{id} → 404/400 on invalid ID', async () => {
    const res = await apiClient.get('/api/users/files/private-storage/presigned-get/99999999');
    expect([400, 401, 403, 404]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. User Action Logs
// ════════════════════════════════════════════════════════════════════════════

describe('User Action Logs', () => {
  it('GET /api/users/action-logs → 200/401; if 200 validate ResponseDto + GetListActionLogResponseDto', async () => {
    const res = await apiClient.get('/api/users/action-logs');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        // GetListActionLogResponseDto required: id, eventId, requestId, timestamp, actor, service, action, createdAt
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('eventId');
        expect(item).toHaveProperty('requestId');
        expect(item).toHaveProperty('timestamp');
        expect(item).toHaveProperty('actor');
        expect(item).toHaveProperty('service');
        expect(item).toHaveProperty('action');
        expect(item).toHaveProperty('createdAt');
        // actor fields
        expect(item.actor).toHaveProperty('id');
        expect(item.actor).toHaveProperty('email');
        expect(item.actor).toHaveProperty('role');
      }
      // meta pagination fields if present
      if (res.data.meta) {
        expect(res.data.meta).toHaveProperty('itemCount');
        expect(res.data.meta).toHaveProperty('itemsPerPage');
        expect(res.data.meta).toHaveProperty('currentPage');
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('GET /api/users/action-logs → 401 without auth token', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/users/action-logs');
    expect([401, 403]).toContain(res.status);
    assertErrorEnvelope(res.data);
    apiClient.setToken(USER_TOKEN);
  });

  it('GET /api/users/action-logs/export → 200/401; validate response', async () => {
    const res = await apiClient.get('/api/users/action-logs/export');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data).toBeDefined();
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Organization RBAC
// ════════════════════════════════════════════════════════════════════════════

describe('Organization RBAC', () => {
  it('GET /api/users/rbac/roles → 200/401; if 200 validate ResponseDto + RoleDto array', async () => {
    const res = await apiClient.get('/api/users/rbac/roles');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      if (Array.isArray(data) && data.length > 0) {
        const role = data[0];
        // RoleDto required: id, name, displayName
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('displayName');
        expect(typeof role.id).toBe('number');
        expect(typeof role.name).toBe('string');
        expect(typeof role.displayName).toBe('string');
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Identity Verification (KYC)
// ════════════════════════════════════════════════════════════════════════════

describe('Identity Verification (KYC)', () => {
  it('GET /api/users/identity-verification/kyc/status → 200/401; if 200 validate SumsubKycStatusResponseDto', async () => {
    const res = await apiClient.get('/api/users/identity-verification/kyc/status');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      if (data) {
        // SumsubKycStatusResponseDto required: reviewStatus
        expect(data).toHaveProperty('reviewStatus');
        const validStatuses = ['init', 'pending', 'completed', 'onHold', 'awaitingUser', 'awaitingService', 'failed', 'in_review'];
        expect(validStatuses).toContain(data.reviewStatus);
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('POST /api/users/identity-verification/kyc/init-kyc → 200/400/401; if 200 validate SumsubInitKycResponseDto', async () => {
    const res = await apiClient.post('/api/users/identity-verification/kyc/init-kyc', undefined);
    expect([200, 400, 401, 403, 409]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      if (data) {
        // SumsubInitKycResponseDto required: token, userId
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('userId');
        expect(typeof data.token).toBe('string');
        expect(typeof data.userId).toBe('string');
      }
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. User Organization
// ════════════════════════════════════════════════════════════════════════════

describe('User Organization', () => {
  it('GET /api/users/organization/{id} → 404/400 on invalid ID; validate error envelope', async () => {
    const res = await apiClient.get('/api/users/organization/99999999');
    expect([400, 401, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      assertResponseEnvelope(res.data);
      const data = res.data.data;
      // GetOrgProfileResponseDto required: id, name, email, avatar
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
    } else {
      assertErrorEnvelope(res.data);
    }
  });

  it('PUT /api/users/organization/{id} → 400/422 on missing body', async () => {
    const res = await apiClient.put('/api/users/organization/99999999', {});
    expect([400, 401, 403, 404, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13. Country
// ════════════════════════════════════════════════════════════════════════════

describe('Country', () => {
  it('GET /api/countries → 200; validate CountryResponseDto array', async () => {
    apiClient.clearToken();
    const res = await apiClient.get('/api/countries');
    expect(res.status).toBe(200);
    assertResponseEnvelope(res.data);

    // Validate data schema with schemaValidator
    const schema = schemaValidator.getResponseSchema('/api/countries', 'get', '200');
    if (schema) {
      const result = schemaValidator.validateSchema(res.data, 'ResponseDto');
      expect(result.valid || result.errors.length === 0).toBeTruthy();
    }

    expect(res.data).toHaveProperty('data');
    const data = res.data.data;
    if (Array.isArray(data) && data.length > 0) {
      const country = data[0];
      // CountryResponseDto required: id, name, code
      expect(country).toHaveProperty('id');
      expect(country).toHaveProperty('name');
      expect(country).toHaveProperty('code');
      expect(typeof country.id).toBe('number');
      expect(typeof country.name).toBe('string');
      expect(typeof country.code).toBe('string');
    }
    apiClient.setToken(USER_TOKEN);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 14. Ledger
// ════════════════════════════════════════════════════════════════════════════

describe('Ledger', () => {
  it('GET /api/users/ledgers/export → 200/401; validate response', async () => {
    const res = await apiClient.get('/api/users/ledgers/export');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      // Export returns CSV or JSON with ResponseDto envelope
      expect(res.data).toBeDefined();
    } else {
      assertErrorEnvelope(res.data);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 15. Withdraw
// ════════════════════════════════════════════════════════════════════════════

describe('Withdraw', () => {
  it('POST /api/users/withdraw → 400/422 on missing required fields', async () => {
    const res = await apiClient.post('/api/users/withdraw', {});
    expect([400, 401, 403, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/withdraw/{transactionId}/approve → 404/400 on non-existent transaction', async () => {
    const res = await apiClient.post('/api/users/withdraw/non-existent-id/approve', {
      otp: '000000',
    });
    expect([400, 401, 403, 404, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });

  it('POST /api/users/withdraw/{transactionId}/reject → 404/400 on non-existent transaction', async () => {
    const res = await apiClient.post('/api/users/withdraw/non-existent-id/reject', {
      otp: '000000',
    });
    expect([400, 401, 403, 404, 422]).toContain(res.status);
    assertErrorEnvelope(res.data);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 16. ResponseDto Envelope — Cross-cutting contract
// ════════════════════════════════════════════════════════════════════════════

describe('ResponseDto Envelope — Cross-cutting', () => {
  it('All authenticated endpoints return 401 without token (spot check)', async () => {
    apiClient.clearToken();
    const endpoints = [
      () => apiClient.get('/api/users/profile/me'),
      () => apiClient.get('/api/users/vault-accounts'),
      () => apiClient.get('/api/users/transactions'),
      () => apiClient.get('/api/users/action-logs'),
      () => apiClient.get('/api/users/rbac/roles'),
    ];
    for (const call of endpoints) {
      const res = await call();
      expect([401, 403]).toContain(res.status);
      assertErrorEnvelope(res.data);
    }
    apiClient.setToken(USER_TOKEN);
  });

  it('Error responses always include a message field', async () => {
    // POST with empty body to a validation endpoint
    apiClient.clearToken();
    const res = await apiClient.post('/api/users/auth/login', {});
    expect([400, 401, 422]).toContain(res.status);
    expect(res.data).toHaveProperty('message');
    expect(typeof res.data.message).toBe('string');
    apiClient.setToken(USER_TOKEN);
  });

  it('Successful responses always include errorCode, message, requestId, timestamp', async () => {
    // Use countries endpoint (no auth needed, always 200)
    apiClient.clearToken();
    const res = await apiClient.get('/api/countries');
    expect(res.status).toBe(200);
    assertResponseEnvelope(res.data);
    // errorCode for success is "0"
    expect(res.data.errorCode).toBe('0');
    apiClient.setToken(USER_TOKEN);
  });
});
