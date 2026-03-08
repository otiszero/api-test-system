# Test Plan - Upmount Custody Platform API

**Generated**: 2026-03-05
**API**: https://dev.api.upmount.sotatek.works
**OpenAPI Version**: 3.0.0

---

## Summary

| Metric | Value |
|--------|-------|
| Total Endpoints | 76 |
| Testable Endpoints | 76 |
| Blacklisted Endpoints | 0 |
| Resources | 17 |

### Blacklist Patterns (from api.config.json)
- `/admin/*` - Admin management endpoints
- `*/admin/*` - Admin-related auth endpoints

*Note: No endpoints matched blacklist patterns in current OpenAPI spec.*

---

## Resources & Execution Order

```
Phase 1 (Public):
  1. Health (2 endpoints) - No auth required
  2. Country (1 endpoint) - No auth required

Phase 2 (Auth):
  3. Users auth (20 endpoints) - Mixed auth

Phase 3 (User-level):
  4. User Profile (2 endpoints) - Bearer auth
  5. Identity Verification (2 endpoints) - Bearer auth
  6. Files (3 endpoints) - Bearer auth
  7. Organization RBAC Management (1 endpoint) - Bearer auth

Phase 4 (Organization):
  8. User Organization (2 endpoints) - Bearer auth
  9. Organization Kyb (4 endpoints) - Depends: Files, Country
  10. Organization Member (8 endpoints) - Depends: User Organization

Phase 5 (Vault):
  11. Vault Accounts (7 endpoints) - Bearer + 2FA, Depends: User Profile, Org Kyb

Phase 6 (Transactions):
  12. User Transactions (3 endpoints) - Depends: Vault Accounts
  13. Withdraw (3 endpoints) - Bearer + 2FA, Depends: Vault Accounts

Phase 7 (Audit):
  14. User Action Log (2 endpoints) - Bearer auth
  15. Ledger (1 endpoint) - Bearer auth

Phase 8 (Proxy):
  16. Monitoring proxy (5 endpoints) - Generic proxy
  17. Processing proxy (10 endpoints) - Generic proxy
```

---

## Test Estimate per Layer

| Layer | Endpoints | Est. Tests | Notes |
|-------|-----------|------------|-------|
| 🟢 Smoke | 76 | 76 | 1 reachability test per endpoint |
| 🔵 Contract | 76 | 152 | Schema validation + error format |
| 🟡 Single API | 76 | 228 | ~3 tests per endpoint (happy, validation, edge) |
| 🟠 Integration | 18 scenarios | 72 | From integration-scenarios.json |
| 🔐 RBAC | 71 protected | 142 | 2 roles × protected endpoints |
| ⚫ Security | 76 | 228 | Auth bypass, injection, headers |
| 🟣 DB Integrity | 0 | 0 | No db-schema.sql configured |

**Est. Total Runtime**: ~6.5 min (excluding DB layer)

---

## Detailed Test Cases by Resource

### 1. Health (2 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/health` | ✅ 200 OK | ✅ Response schema | ✅ Returns status | — | ✅ No auth needed |
| `GET /api/health/ready` | ✅ 200 OK | ✅ Response schema | ✅ Readiness check | — | ✅ No auth needed |

---

### 2. Country (1 endpoint)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/countries` | ✅ 200 OK | ✅ Array of countries | ✅ List countries | — | ✅ No auth needed |

---

### 3. Users auth (20 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/auth/register` | ✅ 200/201 | ✅ User schema | ✅ Valid email, ❌ Invalid email, ❌ Duplicate | — | ✅ Rate limit |
| `POST /api/users/auth/login` | ✅ 200 | ✅ Token schema | ✅ Valid creds, ❌ Invalid creds | — | ✅ Rate limit, brute force |
| `POST /api/users/auth/refresh-token` | ✅ 200 | ✅ Token schema | ✅ Valid refresh, ❌ Expired, ❌ Invalid | — | ✅ Token validation |
| `POST /api/users/auth/verify-email` | ✅ 200 | ✅ Success schema | ✅ Valid OTP, ❌ Invalid OTP | — | ✅ OTP brute force |
| `POST /api/users/auth/verify-email/resend` | ✅ 200 | ✅ Success schema | ✅ Resend, ❌ Rate limit | — | ✅ Rate limit |
| `POST /api/users/auth/forgot-password` | ✅ 200 | ✅ Success schema | ✅ Valid email, ❌ Unknown email | — | ✅ Enumeration |
| `POST /api/users/auth/forgot-password/verify-token` | ✅ 200 | ✅ Success schema | ✅ Valid token | — | ✅ Token validation |
| `POST /api/users/auth/forgot-password/update-new-password` | ✅ 200 | ✅ Success schema | ✅ Valid password | — | ✅ Password strength |
| `POST /api/users/auth/change-password` | ✅ 200 | ✅ Success schema | ✅ Valid change, ❌ Wrong current | 🔐 Auth | ✅ Auth required |
| `GET /api/users/auth/google` | ✅ 302 redirect | — | ✅ OAuth redirect | — | ✅ OAuth security |
| `GET /api/users/auth/google/callback` | ✅ 200/302 | ✅ Token schema | ✅ Valid callback | — | ✅ State validation |
| `POST /api/users/auth/google/token` | ✅ 200 | ✅ Token schema | ✅ Valid token | — | ✅ Token validation |
| `POST /api/users/auth/logout` | ✅ 200 | ✅ Success schema | ✅ Logout | 🔐 Auth | ✅ Token invalidation |
| `POST /api/users/auth/two-factor/setup` | ✅ 200 | ✅ TOTP schema | ✅ Generate secret | 🔐 Auth | ✅ Secret exposure |
| `POST /api/users/auth/two-factor/verify-setup` | ✅ 200 | ✅ Success schema | ✅ Valid TOTP | 🔐 Auth | ✅ TOTP brute force |
| `POST /api/users/auth/two-factor/verify-login` | ✅ 200 | ✅ Token schema | ✅ Valid TOTP | 🔐 Auth | ✅ TOTP validation |
| `POST /api/users/auth/two-factor/disable` | ✅ 200 | ✅ Success schema | ✅ Disable 2FA | 🔐 Auth | ✅ Requires 2FA verify |
| `POST /api/users/auth/2fa/change/send-email` | ✅ 200 | ✅ Success schema | ✅ Send email | 🔐 Auth | ✅ Rate limit |
| `POST /api/users/auth/2fa/change/verify-email` | ✅ 200 | ✅ Success schema | ✅ Verify OTP | 🔐 Auth | ✅ OTP brute force |
| `POST /api/users/auth/2fa/change/verify-ga` | ✅ 200 | ✅ Success schema | ✅ Verify TOTP | 🔐 Auth | ✅ TOTP validation |

---

### 4. User Profile (2 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/profile/me` | ✅ 200 | ✅ Profile schema | ✅ Get profile | 🔐 Auth, 👤 admin, 👤 user | ✅ Auth required |
| `POST /api/users/profile/me` | ✅ 200 | ✅ Profile schema | ✅ Update profile, ❌ Invalid data | 🔐 Auth | ✅ XSS in fields |

---

### 5. Identity Verification (2 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/identity-verification/kyc/init-kyc` | ✅ 200 | ✅ KYC schema | ✅ Init KYC | 🔐 Auth | ✅ Auth required |
| `GET /api/users/identity-verification/kyc/status` | ✅ 200 | ✅ Status schema | ✅ Get status | 🔐 Auth | ✅ Auth required |

---

### 6. Files (3 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/files/upload-image` | ✅ 200 | ✅ Upload schema | ✅ Valid image, ❌ Invalid type | 🔐 Auth | ✅ File type validation |
| `POST /api/users/files/private-storage/presigned-post` | ✅ 200 | ✅ Presigned schema | ✅ Get URL | 🔐 Auth | ✅ URL expiration |
| `GET /api/users/files/private-storage/presigned-get/{id}` | ✅ 200 | ✅ Presigned schema | ✅ Get file, ❌ Not found | 🔐 Auth, IDOR | ✅ IDOR protection |

---

### 7. Organization RBAC Management (1 endpoint)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/rbac/roles` | ✅ 200 | ✅ Roles array | ✅ List roles | 🔐 Auth | ✅ Auth required |

---

### 8. User Organization (2 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/organization/{id}` | ✅ 200 | ✅ Org schema | ✅ Get org, ❌ Not found | 🔐 Auth, IDOR | ✅ IDOR protection |
| `PUT /api/users/organization/{id}` | ✅ 200 | ✅ Org schema | ✅ Update org | 🔐 Admin only | ✅ XSS in fields |

---

### 9. Organization Kyb (4 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/organization-kyb` | ✅ 200/201 | ✅ KYB schema | ✅ Submit KYB, ❌ Duplicate | 🔐 Admin only | ✅ Data validation |
| `GET /api/users/organization-kyb/kyb-status` | ✅ 200 | ✅ Status schema | ✅ Get status | 🔐 Auth | ✅ Auth required |
| `GET /api/users/organization-kyb/primary-owner-data` | ✅ 200 | ✅ Owner schema | ✅ Get owner | 🔐 Auth | ✅ Auth required |
| `GET /api/users/organization-kyb/{id}/detail` | ✅ 200 | ✅ KYB schema | ✅ Get detail, ❌ Not found | 🔐 Auth, IDOR | ✅ IDOR protection |

---

### 10. Organization Member (8 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/organization-members/invite` | ✅ 200 | ✅ Invite schema | ✅ Send invite, ❌ Duplicate | 🔐 Admin only | ✅ Email validation |
| `POST /api/users/organization-members/resend-invite` | ✅ 200 | ✅ Success schema | ✅ Resend | 🔐 Admin only | ✅ Rate limit |
| `POST /api/users/organization-members/verify-invite` | ✅ 200 | ✅ Verify schema | ✅ Valid token | — | ✅ Token validation |
| `PUT /api/users/organization-members/accept-invite` | ✅ 200 | ✅ Success schema | ✅ Accept | 🔐 Auth | ✅ Token validation |
| `GET /api/users/organization-members/members` | ✅ 200 | ✅ Members array | ✅ List, pagination | 🔐 Auth | ✅ Auth required |
| `PUT /api/users/organization-members/remove-member` | ✅ 200 | ✅ Success schema | ✅ Remove, ❌ Self-remove | 🔐 Admin only | ✅ Can't remove self |
| `PUT /api/users/organization-members/change-member-role` | ✅ 200 | ✅ Success schema | ✅ Change role | 🔐 Admin only | ✅ Role validation |
| `GET /api/users/organization-members/export-members` | ✅ 200 | ✅ CSV/file | ✅ Export | 🔐 Admin only | ✅ Auth required |

---

### 11. Vault Accounts (7 endpoints) — Requires 2FA

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/vault-accounts` | ✅ 200 | ✅ Vaults array | ✅ List vaults, pagination | 🔐 Auth | ✅ Auth required |
| `POST /api/users/vault-accounts` | ✅ 200/201 | ✅ Vault schema | ✅ Create + OTP, ❌ Invalid OTP | 🔐 Admin only | ✅ 2FA required |
| `POST /api/users/vault-accounts/{id}` | ✅ 200 | ✅ Vault schema | ✅ Update + OTP | 🔐 Admin only, IDOR | ✅ 2FA, IDOR |
| `POST /api/users/vault-accounts/{id}/add-assets` | ✅ 200 | ✅ Success schema | ✅ Add assets + OTP | 🔐 Admin only, IDOR | ✅ 2FA, IDOR |
| `POST /api/users/vault-accounts/{id}/assign-users` | ✅ 200 | ✅ Success schema | ✅ Assign + OTP | 🔐 Admin only, IDOR | ✅ 2FA, IDOR |
| `POST /api/users/vault-accounts/{id}/remove-users` | ✅ 200 | ✅ Success schema | ✅ Remove + OTP | 🔐 Admin only, IDOR | ✅ 2FA, IDOR |
| `GET /api/users/vault-accounts/{id}/users` | ✅ 200 | ✅ Users array | ✅ List users | 🔐 Auth, IDOR | ✅ IDOR protection |

---

### 12. User Transactions (3 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/transactions` | ✅ 200 | ✅ Transactions array | ✅ List, pagination, filters | 🔐 Auth | ✅ Auth required |
| `GET /api/users/transactions/export` | ✅ 200 | ✅ CSV/file | ✅ Export | 🔐 Auth | ✅ Auth required |
| `GET /api/users/transactions/{transactionId}` | ✅ 200 | ✅ Transaction schema | ✅ Get detail, ❌ Not found | 🔐 Auth, IDOR | ✅ IDOR protection |

---

### 13. Withdraw (3 endpoints) — Requires 2FA

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `POST /api/users/withdraw` | ✅ 200/201 | ✅ Withdraw schema | ✅ Initiate + OTP, ❌ Invalid | 🔐 Admin only | ✅ 2FA, amount validation |
| `POST /api/users/withdraw/{transactionId}/approve` | ✅ 200 | ✅ Success schema | ✅ Approve + OTP | 🔐 Admin only, IDOR | ✅ 2FA, IDOR |
| `POST /api/users/withdraw/{transactionId}/reject` | ✅ 200 | ✅ Success schema | ✅ Reject | 🔐 Admin only, IDOR | ✅ IDOR protection |

---

### 14. User Action Log (2 endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/action-logs` | ✅ 200 | ✅ Logs array | ✅ List, pagination | 🔐 Auth | ✅ Auth required |
| `GET /api/users/action-logs/export` | ✅ 200 | ✅ CSV/file | ✅ Export | 🔐 Admin only | ✅ Auth required |

---

### 15. Ledger (1 endpoint)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/users/ledgers/export` | ✅ 200 | ✅ CSV/file | ✅ Export, filters | 🔐 Auth | ✅ Auth required |

---

### 16. Monitoring proxy (5 endpoints) — Generic Proxy

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/monitoring/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `POST /api/monitoring/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `PUT /api/monitoring/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `DELETE /api/monitoring/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `PATCH /api/monitoring/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |

---

### 17. Processing proxy (10 endpoints) — Generic Proxy

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|-------|----------|--------|------|----------|
| `GET /api/processing/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `POST /api/processing/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `PUT /api/processing/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `DELETE /api/processing/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `PATCH /api/processing/users/{path}` | ✅ 200/404 | — | ✅ Proxy pass | 🔐 Auth | ✅ Path traversal |
| `GET /api/processing/{path}` | ✅ 200/404 | — | ✅ Proxy pass | — | ✅ Path traversal |
| `POST /api/processing/{path}` | ✅ 200/404 | — | ✅ Proxy pass | — | ✅ Path traversal |
| `PUT /api/processing/{path}` | ✅ 200/404 | — | ✅ Proxy pass | — | ✅ Path traversal |
| `DELETE /api/processing/{path}` | ✅ 200/404 | — | ✅ Proxy pass | — | ✅ Path traversal |
| `PATCH /api/processing/{path}` | ✅ 200/404 | — | ✅ Proxy pass | — | ✅ Path traversal |

---

## Integration Scenarios (18 total)

| ID | Scenario | Steps | Auth | 2FA |
|----|----------|-------|------|-----|
| S01 | Health check | 2 | — | — |
| S02 | User profile view | 1 | user | — |
| S03 | Token refresh flow | 2 | user | — |
| S04 | Vault accounts listing | 3 | user | — |
| S05 | Countries lookup | 1 | — | — |
| S06 | Transactions listing | 3 | user | — |
| S07 | KYC/KYB status | 3 | user | — |
| S08 | File presigned URL | 2 | user | — |
| S09 | Org members listing | 1 | user | — |
| S10 | Guest vs authenticated | 5 | — | — |
| S11 | RBAC user limits | 4 | user | — |
| S12 | Action logs view | 1 | user | — |
| S13 | RBAC roles listing | 1 | user | — |
| S14 | Vault create → assign | 4 | admin | ✅ |
| S15 | File → KYB chain | 4 | admin | — |
| S16 | Vault → add assets | 3 | admin | ✅ |
| S17 | Withdrawal flow | 3 | admin | ✅ |
| S18 | Member invite flow | 3 | admin | — |

---

## Skipped Flows (Email OTP Required)

⛔ **Registration + Email verify** — Requires email OTP, use pre-authenticated accounts
⛔ **Forgot password flow** — Requires email OTP, cannot automate

---

## Notes

1. **2FA Automation**: Tests use `otpauth` library with pre-configured TOTP secrets from `auth.config.json`
2. **Pre-authenticated accounts**: Tests use tokens from `auth.config.json` (no email OTP needed)
3. **IDOR Testing**: Requires 2+ user accounts to test cross-account access
4. **Proxy endpoints**: Generic wildcards, limited schema validation possible
5. **DB Layer**: Blocked until `db-schema.sql` is provided
