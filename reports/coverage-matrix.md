# Coverage Matrix — Upmount Custody Platform

**Ngày:** 2026-03-05
**Tổng endpoints:** 76 | **Resources:** 17

Ký hiệu: ✅ Tested & Pass | ❌ Tested & Fail | ⚠️ Partial | — Không test | 🚫 N/A

---

## Core Business Endpoints

| Endpoint | Smoke | Contract | Single | Integration | RBAC | Security | DB |
|----------|-------|----------|--------|-------------|------|----------|-----|
| **Health** | | | | | | | |
| `GET /api/health` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `GET /api/health/ready` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| **Users Auth** | | | | | | | |
| `POST /auth/register` | ✅ | ❌ | ✅ | — | — | ✅ | — |
| `POST /auth/login` | ✅ | ❌ | ✅ | — | ✅ | ✅ | — |
| `POST /auth/refresh-token` | ✅ | ❌ | ✅ | ✅ | — | — | — |
| `POST /auth/verify-email` | ✅ | ✅ | ❌ | — | — | — | — |
| `POST /auth/verify-email/resend` | ✅ | ✅ | ✅ | — | — | — | — |
| `POST /auth/forgot-password` | ✅ | ✅ | ✅ | — | — | — | — |
| `POST /auth/forgot-password/verify-token` | ✅ | ❌ | ✅ | — | — | — | — |
| `POST /auth/forgot-password/update-new-password` | ✅ | ✅ | ✅ | — | — | — | — |
| `POST /auth/change-password` | ✅ | ❌ | ✅ | — | — | — | — |
| `GET /auth/google` | ✅ | — | ✅ | — | — | — | — |
| `GET /auth/google/callback` | ✅ | — | ✅ | — | — | — | — |
| `POST /auth/google/token` | ✅ | — | ✅ | — | — | — | — |
| `POST /auth/logout` | ✅ | ❌ | ✅ | — | — | — | — |
| `POST /auth/two-factor/setup` | ✅ | ❌ | ❌ | ✅ | — | — | — |
| `POST /auth/two-factor/verify-setup` | ✅ | ❌ | ❌ | — | — | — | — |
| `POST /auth/two-factor/verify-login` | ✅ | — | ❌ | ✅ | — | ✅ | — |
| `POST /auth/two-factor/disable` | ✅ | — | ✅ | — | — | — | — |
| `POST /auth/2fa/change/send-email` | ✅ | — | ❌ | — | — | — | — |
| `POST /auth/2fa/change/verify-email` | ✅ | — | ❌ | — | — | — | — |
| `POST /auth/2fa/change/verify-ga` | ✅ | — | ❌ | — | — | — | — |
| **User Profile** | | | | | | | |
| `GET /profile/me` | ✅ | ❌ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| `POST /profile/me` | ✅ | ❌ | ❌ | — | — | ✅ | — |
| **Vault Accounts** | | | | | | | |
| `GET /vault-accounts` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | ⚠️ |
| `POST /vault-accounts` | ✅ | ❌ | ⚠️ | ✅ | ❌ | ✅ | — |
| `POST /vault-accounts/{id}` | ✅ | ❌ | ⚠️ | — | ❌ | — | — |
| `POST /vault-accounts/{id}/add-assets` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `POST /vault-accounts/{id}/assign-users` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `POST /vault-accounts/{id}/remove-users` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `GET /vault-accounts/{id}/users` | ❌ | ❌ | ⚠️ | ✅ | — | — | — |
| **User Transactions** | | | | | | | |
| `GET /transactions` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | — |
| `GET /transactions/export` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | — |
| `GET /transactions/{transactionId}` | ❌ | ❌ | ⚠️ | ✅ | — | — | — |
| **Withdraw** | | | | | | | |
| `POST /withdraw` | ✅ | ❌ | ⚠️ | — | ❌ | ✅ | — |
| `POST /withdraw/{id}/approve` | ✅ | ❌ | ⚠️ | — | ❌ | — | — |
| `POST /withdraw/{id}/reject` | ✅ | ❌ | ⚠️ | — | ❌ | — | — |
| **Organization Member** | | | | | | | |
| `POST /organization-members/invite` | ✅ | ❌ | ⚠️ | ✅ | ❌ | ✅ | — |
| `POST /organization-members/resend-invite` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `POST /organization-members/verify-invite` | ✅ | ❌ | ✅ | — | — | — | — |
| `PUT /organization-members/accept-invite` | ✅ | — | ❌ | — | — | — | — |
| `GET /organization-members/members` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | ⚠️ |
| `PUT /organization-members/remove-member` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `PUT /organization-members/change-member-role` | ✅ | — | ⚠️ | — | ❌ | — | — |
| `GET /organization-members/export-members` | ✅ | ❌ | ⚠️ | ✅ | ❌ | — | — |
| **Organization KYB** | | | | | | | |
| `POST /organization-kyb` | ✅ | ❌ | ⚠️ | — | ❌ | — | — |
| `GET /organization-kyb/kyb-status` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | ⚠️ |
| `GET /organization-kyb/primary-owner-data` | ✅ | ❌ | ✅ | ✅ | ⚠️ | — | — |
| `GET /organization-kyb/{id}/detail` | ✅ | ❌ | ✅ | — | — | — | — |
| **Files** | | | | | | | |
| `POST /files/upload-image` | ❌ | — | ❌ | — | — | — | — |
| `POST /files/private-storage/presigned-post` | ✅ | ❌ | ⚠️ | ✅ | — | — | — |
| `GET /files/private-storage/presigned-get/{id}` | ✅ | ❌ | ⚠️ | — | — | ✅ | — |
| **Organization RBAC** | | | | | | | |
| `GET /rbac/roles` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | ⚠️ |
| **Identity Verification** | | | | | | | |
| `POST /identity-verification/kyc/init-kyc` | ✅ | ❌ | ✅ | — | — | — | — |
| `GET /identity-verification/kyc/status` | ✅ | ❌ | ✅ | ✅ | — | — | — |
| **User Organization** | | | | | | | |
| `GET /organization/{id}` | ✅ | ❌ | ❌ | ✅ | — | ⚠️ | ⚠️ |
| `PUT /organization/{id}` | ✅ | ❌ | ⚠️ | — | ❌ | — | — |
| **Country** | | | | | | | |
| `GET /countries` | ✅ | ❌ | ✅ | ✅ | ✅ | — | ⚠️ |
| **Ledger** | | | | | | | |
| `GET /ledgers/export` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | — |
| **Action Logs** | | | | | | | |
| `GET /action-logs` | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | — | — |
| `GET /action-logs/export` | ✅ | ❌ | ⚠️ | ✅ | ❌ | — | — |

---

## Proxy Endpoints (Monitoring & Processing)

| Endpoint | Smoke | Ghi chú |
|----------|-------|---------|
| `GET /api/monitoring/users/{path}` | ✅ | Proxy — chỉ smoke |
| `POST /api/monitoring/users/{path}` | ✅ | Proxy — chỉ smoke |
| `PUT /api/monitoring/users/{path}` | ✅ | Proxy — chỉ smoke |
| `DELETE /api/monitoring/users/{path}` | ✅ | Proxy — chỉ smoke |
| `PATCH /api/monitoring/users/{path}` | ✅ | Proxy — chỉ smoke |
| `GET /api/processing/users/{path}` | ✅ | Proxy — chỉ smoke |
| `POST /api/processing/users/{path}` | ✅ | Proxy — chỉ smoke |
| `PUT /api/processing/users/{path}` | ✅ | Proxy — chỉ smoke |
| `DELETE /api/processing/users/{path}` | ✅ | Proxy — chỉ smoke |
| `PATCH /api/processing/users/{path}` | ✅ | Proxy — chỉ smoke |
| `GET /api/processing/{path}` | ✅ | Proxy — chỉ smoke |
| `POST /api/processing/{path}` | ✅ | Proxy — chỉ smoke |
| `PUT /api/processing/{path}` | ✅ | Proxy — chỉ smoke |
| `DELETE /api/processing/{path}` | ✅ | Proxy — chỉ smoke |
| `PATCH /api/processing/{path}` | ✅ | Proxy — chỉ smoke |

---

## Thống kê Coverage

| Layer | Endpoints Tested | Coverage |
|-------|-----------------|----------|
| Smoke | 76/76 | 100% |
| Contract | 46/76 | 60.5% |
| Single API | 52/76 | 68.4% |
| Integration | 25/76 | 32.9% |
| RBAC | 30/76 | 39.5% |
| Security | 15/76 | 19.7% |
| DB Integrity | 8/76 | 10.5% |

> ⚠️ Contract coverage cao nhưng 90% fail do error envelope mismatch.
> ⚠️ RBAC và Single API coverage bị giảm accuracy do token expired.
