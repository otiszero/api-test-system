# Test Report — Upmount Custody Platform

**Ngày chạy:** 2026-03-05
**Môi trường:** DEV (`https://dev.api.upmount.sotatek.works`)
**Tổng endpoints:** 76 | **Test runner:** Vitest 3.0.7

---

## Tổng kết

| Metric | Giá trị |
|--------|---------|
| **Tổng tests** | 432 |
| **Passed** | 307 (71.1%) |
| **Failed** | 125 (28.9%) |
| **Thời gian** | ~4 phút |

---

## Kết quả theo Layer

| Layer | Pass | Fail | Total | Rate | Ghi chú |
|-------|------|------|-------|------|---------|
| 🟢 01-Smoke | 76 | 3 | 79 | 96.2% | 3 server 500 errors |
| 🔵 02-Contract | 5 | 46 | 51 | 9.8% | Error envelope mismatch |
| 🟡 03-Single API | 119 | 43 | 162 | 73.5% | Token hết hạn + RBAC sai |
| 🟠 04-Integration | 32 | 0 | 32 | 100% | ✅ All passed |
| 🔐 05-RBAC | 25 | 26 | 51 | 49.0% | Token user[1] hết hạn |
| ⚫ 06-Security | 41 | 3 | 44 | 93.2% | SSL error, timeout, IDOR |
| 🟣 07-DB Integrity | 9 | 4 | 13 | 69.2% | Sai tên table/column |

---

## Chi tiết Failures theo Layer

### 🟢 01-Smoke (3 failures)

| # | Test | Endpoint | Lỗi |
|---|------|----------|------|
| 1 | Files > upload-image → not 5xx | `POST /api/users/files/upload-image` | Server trả 500 |
| 2 | Vault > vault-accounts/{id}/users → not 5xx | `GET /api/users/vault-accounts/{id}/users` | Server trả 500 |
| 3 | Transactions > transactions/{id} → not 5xx | `GET /api/users/transactions/{transactionId}` | Server trả 500 |

**Evidence:** Cả 3 endpoint đều trả HTTP 500, cho thấy lỗi server-side chưa handle.

---

### 🔵 02-Contract (46 failures)

**Root cause chính:** `assertErrorEnvelope` expect `body.message` nhưng API trả `{ success: false, errorCode, ... }` không có field `message`.

| Nhóm | Số lỗi | Mô tả |
|-------|--------|-------|
| Error envelope thiếu `message` | 44 | API error response có `success`, `errorCode` nhưng không có `message` |
| 2FA setup trả 401 thay vì 200/400 | 1 | Token owner hết hạn hoặc 2FA đã enabled |
| Countries schema validation | 1 | CountryResponseDto validation fail |

---

### 🟡 03-Single API (43 failures)

| Nhóm lỗi | Số lỗi | Root cause |
|-----------|--------|------------|
| Normal user token (user[1]) trả 401 thay vì 200 | 8 | **Token hết hạn** — user[1] JWT expired |
| Normal user token trả 401 thay vì 403 | 19 | **Token hết hạn** — không thể phân biệt 401 vs 403 |
| Owner token (user[0]) trả 401 trên một số endpoint | 6 | **Token user[0] hết hạn trên 2FA/file endpoints** |
| 2FA endpoints trả 403 thay vì 400/422 | 7 | API trả 403 khi 2FA chưa setup đúng (không phải bug) |
| Profile update trả 201 thay vì 200/400 | 1 | Test expect [200,400] nhưng API trả 201 |
| Org GET trả 400 thay vì 200/404 | 1 | Có thể org ID format sai |
| Accept-invite trả 401 | 1 | Token expired |

**Phân tích:** ~80% failures do token hết hạn (user[1] chắc chắn expired, user[0] một phần expired).

---

### 🟠 04-Integration (0 failures) ✅

Tất cả 32 tests passed. Scenarios: Token Refresh, 2FA, KYB, Vault Lifecycle, Transaction, Guest Access, Org Members, Action Logs.

---

### 🔐 05-RBAC (26 failures)

| Nhóm | Số lỗi | Mô tả |
|-------|--------|-------|
| Group 3: Normal user read → 401 thay 2xx | 10 | Token user[1] expired → 401 cho tất cả |
| Group 4: Normal user admin-only → 401 thay 403 | 16 | Token user[1] expired → server trả 401 trước khi check RBAC |

**Root cause:** 100% failures do token `user[1]` (normal user) hết hạn. Server trả 401 (Unauthorized) thay vì 2xx hoặc 403 (Forbidden).

---

### ⚫ 06-Security (3 failures)

| # | Test | Lỗi | Severity |
|---|------|------|----------|
| 1 | Host header injection → no 5xx | SSL EPROTO error — `evil.example.com` gây SSL mismatch | Low |
| 2 | Oversized Content-Length → no 5xx | Timeout 10s — server không reject nhanh | Medium |
| 3 | IDOR: User A access org 999999 | API trả 400 thay vì 403/404 | Medium |

---

### 🟣 07-DB Integrity (4 failures)

| # | Test | Lỗi |
|---|------|------|
| 1 | User Profile matches DB | Column `"firstName"` does not exist trong bảng `users` |
| 2 | No orphan vault_accounts | Relation `"vault_accounts"` does not exist |
| 3 | No orphan organization_members | Relation `"organization_members"` does not exist |
| 4 | No orphan transactions | Relation `"transactions"` does not exist |

**Root cause:** Tên bảng trong DB không match với assumption. Cần query `\dt` để xem tên bảng thực tế (có thể là `vault_account`, `organization_member`, `transaction` — không có "s").

---

## Action Items (ưu tiên cao → thấp)

1. 🔴 **CRITICAL**: Refresh JWT tokens cho cả user[0] và user[1] — ảnh hưởng ~80 tests
2. 🔴 **HIGH**: Fix 3 server 500 endpoints (upload-image, vault/{id}/users, transactions/{id})
3. 🟡 **MEDIUM**: Update contract test `assertErrorEnvelope` — API dùng `{success, errorCode}` không có `message`
4. 🟡 **MEDIUM**: Kiểm tra DB table names thực tế (snake_case singular vs plural)
5. 🟢 **LOW**: Tăng timeout cho oversized Content-Length test
6. 🟢 **LOW**: Handle Host header SSL error trong security test
