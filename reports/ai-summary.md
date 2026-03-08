# AI Analysis Summary — Upmount Custody Platform

**Ngày:** 2026-03-05
**Analyst:** AI QA Engine
**Test run:** 432 tests, 307 pass, 125 fail (71.1% pass rate)

---

## 1. Pattern Analysis

### Pattern 1: JWT Token Expiry (ảnh hưởng ~80 tests)

**Phát hiện:** Cả hai JWT tokens trong `auth.config.json` đều hết hạn.
- **user[0]** (owner, sub:1118): Token issued 2025-12-03, expiry ~24h → đã hết hạn ~3 tháng
- **user[1]** (normal, sub:1119): Tương tự

**Tác động:**
- 05-RBAC: 26/26 failures (100%)
- 03-Single: ~33/43 failures (~77%)
- 02-Contract: ~2/46 failures

**Giải pháp:** Login lại cả 2 accounts → update tokens trong `config/auth.config.json` → chạy lại test. Dự kiến pass rate tăng từ 71% lên ~90%.

---

### Pattern 2: Error Envelope Mismatch (ảnh hưởng 44 tests)

**Phát hiện:** OpenAPI spec define ResponseDto là `{ statusCode, message, data }`. Nhưng API thực tế trả error dưới dạng:
```json
{ "success": false, "errorCode": "xxx", "statusCode": 400, "data": null }
```
Thiếu field `message`, thêm fields `success` + `errorCode`.

**Tác động:** 44/46 contract test failures

**Phân tích:**
- Có thể API đã upgrade error format (thêm errorCode cho i18n) nhưng OpenAPI spec chưa update
- Hoặc ngược lại: spec đúng nhưng implementation sai

**Giải pháp:** Confirm với dev team → nếu API format đúng thì update OpenAPI spec + contract tests.

---

### Pattern 3: Server 500 trên 3 endpoints

**Phát hiện:** 3 endpoint trả HTTP 500 thay vì 4xx:
1. `POST /api/users/files/upload-image` — thiếu file trong request
2. `GET /api/users/vault-accounts/{id}/users` — vault ID hợp lệ
3. `GET /api/users/transactions/{transactionId}` — transaction ID

**Phân tích:** Đây là bugs thực sự. Server thiếu null check hoặc error handling khi:
- Upload endpoint nhận empty body (không có multipart)
- Vault users query khi vault tồn tại nhưng relations thiếu
- Transaction detail query khi ID format valid nhưng record không tồn tại

---

### Pattern 4: DB Schema Mismatch

**Phát hiện:** DB tests assume table names:
- `vault_accounts` → thực tế không tồn tại
- `organization_members` → thực tế không tồn tại
- `transactions` → thực tế không tồn tại
- Column `firstName` → thực tế không tồn tại trong `users`

**Phân tích:** NestJS thường dùng TypeORM/Prisma. Tên bảng có thể:
- Singular: `vault_account`, `organization_member`, `transaction`
- Hoặc camelCase: `vaultAccount`
- Column có thể: `first_name` (snake_case) thay vì `firstName` (camelCase)

---

## 2. Risk Assessment

### 🔴 High Risk Areas

| Area | Risk | Reason |
|------|------|--------|
| **File Upload** | Data loss | Server crash (500) khi upload → user mất file, session hỏng |
| **Transaction Detail** | Data integrity | 500 trên view transaction → user không thể verify transactions |
| **Vault Users** | Access control | 500 trên vault users → không verify ai có access vault |
| **Error format** | Client-side bugs | Frontend parse `message` → undefined → crash hoặc blank error |

### 🟡 Medium Risk Areas

| Area | Risk | Reason |
|------|------|--------|
| **IDOR protection** | Security | Org endpoint trả 400 thay 403/404 → information leakage |
| **Content-Length DoS** | Availability | Server chờ 99MB body → resource exhaustion potential |
| **2FA status codes** | UX confusion | 403 vs 400 → user nghĩ "không có quyền" thay vì "OTP sai" |

### 🟢 Low Risk Areas
- Profile update 201 vs 200 — cosmetic
- Host header SSL error — infrastructure level
- DB table name mismatch — test config issue, not API bug

---

## 3. Coverage Gaps

### Chưa test đủ sâu

| Area | Gap | Recommendation |
|------|-----|----------------|
| **Concurrent access** | Không test race conditions | Thêm concurrent vault create, concurrent withdraw approve |
| **Pagination** | Chỉ test page 1 | Test boundary: page 0, negative page, page > total |
| **Rate limiting** | Không test | Thêm brute-force login (>10 attempts) |
| **File types** | Chỉ test empty upload | Test malicious file extensions, oversized files |
| **WebSocket/SSE** | Không test | Nếu có real-time features |
| **Admin endpoints** | Không có admin token | Cần admin credentials để test admin flows |

### Endpoints chưa test ngoài Smoke

| Resource | Endpoints chỉ có Smoke | Reason |
|----------|------------------------|--------|
| Monitoring proxy | 5 endpoints | Proxy — khó test chi tiết |
| Processing proxy | 10 endpoints | Proxy — khó test chi tiết |
| Google OAuth | 3 endpoints | Cần Google OAuth flow |

---

## 4. Prioritized Recommendations

### Ngay lập tức (blocking)

1. **🔴 Refresh JWT tokens** → chạy lại toàn bộ test suite
   - Login user[0] (owner) + user[1] (normal) → copy new tokens
   - Expected: ~80 tests chuyển từ fail → pass
   - Pass rate dự kiến: 71% → ~90%

2. **🔴 Fix 3 server 500 bugs** (BUG-001, 002, 003)
   - Thêm null checks cho upload-image, vault-users, transaction-detail
   - Expected: 3 smoke tests pass, potential single/contract fixes

### Ngắn hạn (1-2 ngày)

3. **🟡 Clarify error envelope format** với dev team
   - Nếu `{success, errorCode}` là format mới → update OpenAPI spec + contract tests
   - Expected: 44 contract tests pass sau update

4. **🟡 Fix DB test table names**
   - Query `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
   - Update DB tests với tên bảng đúng
   - Expected: 4 DB tests pass

5. **🟡 Add Content-Length limit** ở reverse proxy
   - Nginx: `client_max_body_size 10M;`
   - Expected: fix DoS vector + 1 security test pass

### Trung hạn (1 tuần)

6. **Thêm admin token** vào auth.config.json → unlock admin-only test scenarios
7. **Thêm rate limiting tests** — verify brute-force protection
8. **Thêm pagination boundary tests** — page 0, negative, overflow
9. **Review IDOR protection** — org endpoint nên trả 404 thay 400

---

## 5. Dự kiến sau fix

| Scenario | Current | After Token Refresh | After All Fixes |
|----------|---------|--------------------|-----------------|
| Pass rate | 71.1% | ~90% | ~96% |
| Failed tests | 125 | ~45 | ~15 |
| Critical bugs | 3 | 3 | 0 |
| Blocking issues | Token expired | Error envelope | None |

---

## 6. Kết luận

**Tình trạng hiện tại:** API hoạt động tốt ở mức cơ bản (smoke 96%, integration 100%), nhưng có 3 critical server 500 bugs cần fix ngay. Phần lớn test failures (80+) do JWT token hết hạn — đây là vấn đề test config, không phải API bug.

**Ưu tiên số 1:** Refresh tokens → chạy lại test → đánh giá lại tình trạng thực tế.

**Positive signals:**
- Integration layer 100% pass → core business flows hoạt động đúng
- Security layer 93% pass → API resilient với các attack vectors phổ biến
- Smoke 96% pass → chỉ 3/76 endpoints lỗi

**Red flags:**
- 3 endpoints trả 500 (unhandled errors) → cần fix ASAP
- Error envelope format không match spec → cần sync dev + QA
- Không có admin token → coverage gap lớn cho admin flows
