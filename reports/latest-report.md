# Test Report - Foreon Prediction Market API

**Ngày chạy:** 2026-03-02 10:39:14
**API:** https://api.foreon.network
**Duration:** 11.31s

---

## Tổng Quan

| Metric | Giá trị |
|--------|---------|
| **Total Tests** | 233 |
| **Passed** | 221 (94.8%) |
| **Failed** | 12 (5.2%) |
| **Skipped** | 0 |

```
████████████████████████████████████████████░░  94.8%
```

---

## Kết Quả Theo Layer

| Layer | Pass | Fail | Skip | Rate | Status |
|-------|------|------|------|------|--------|
| 🟢 01-Smoke | 44 | 2 | 0 | 95.7% | ⚠️ |
| 🔵 02-Contract | 24 | 0 | 0 | 100% | ✅ |
| 🟡 03-Single | 63 | 5 | 0 | 92.6% | ⚠️ |
| 🟠 04-Integration | 28 | 2 | 0 | 93.3% | ⚠️ |
| 🔐 05-RBAC | 25 | 0 | 0 | 100% | ✅ |
| ⚫ 06-Security | 19 | 5 | 0 | 79.2% | ⚠️ |
| 🟣 07-DB Integrity | 10 | 0 | 0 | 100% | ✅ |

---

## Chi Tiết Failures

### 1. POST /auth/logout - Wrong Status Code
- **File:** `03-single/auth.test.ts:34`
- **Expected:** 200, 204, hoặc 401
- **Actual:** 201
- **Severity:** Low
- **Analysis:** API trả về 201 (Created) thay vì 200/204 cho logout action. Không ảnh hưởng chức năng nhưng không đúng REST convention.

### 2. GET /trades/graph - Missing Required Params
- **File:** `03-single/trades.test.ts:23`
- **Expected:** 200
- **Actual:** 400
- **Severity:** Low
- **Analysis:** Endpoint yêu cầu query params (outcomeId, interval) nhưng OpenAPI spec không document rõ required params.

### 3. GET /trades/graph-overrall - Missing Required Params
- **File:** `03-single/trades.test.ts:29`
- **Expected:** 200
- **Actual:** 400
- **Severity:** Low
- **Analysis:** Tương tự endpoint graph, cần document required params.

### 4. 🔴 Expired Token Accepted (SECURITY)
- **File:** `06-security/security.test.ts:18`
- **Expected:** 401 Unauthorized
- **Actual:** 200 OK
- **Severity:** **CRITICAL**
- **Analysis:** API chấp nhận JWT token đã expired. Đây là lỗ hổng bảo mật nghiêm trọng cho phép attacker sử dụng token cũ vô thời hạn.

### 5. 🔴 Malformed Token Causes 500 (SECURITY)
- **File:** `06-security/security.test.ts:26`
- **Expected:** 401 Unauthorized
- **Actual:** 500 Internal Server Error
- **Severity:** **HIGH**
- **Analysis:** Token không hợp lệ gây crash server thay vì trả về 401. Có thể bị khai thác để DoS.

### 6. 🔴 Non-numeric ID Causes 500 (SECURITY)
- **File:** `06-security/security.test.ts:143`
- **Expected:** 400 hoặc 404
- **Actual:** 500 Internal Server Error
- **Severity:** **HIGH**
- **Analysis:** Input validation thiếu cho path params. Server crash khi nhận ID không phải số.

### 7-12. Trade Graph Endpoints (Contract Issues)
- **Endpoints:** `/trades/graph`, `/trades/graph-overrall`
- **Severity:** Low
- **Analysis:** Các endpoint này cần query params nhưng test gọi không có params. Cần update OpenAPI spec để document required params.

---

## Endpoints Coverage

| Resource | Total Endpoints | Tested | Coverage |
|----------|----------------|--------|----------|
| Markets | 13 | 13 | 100% |
| Orders | 9 | 9 | 100% |
| Trades | 5 | 5 | 100% |
| Comments | 6 | 6 | 100% |
| Auth | 6 | 6 | 100% |
| Admin | 3 | 3 | 100% |
| Other | 4 | 4 | 100% |

---

## Thống Kê Security

| Check | Result |
|-------|--------|
| Auth bypass (no token) | ✅ Passed |
| Auth bypass (expired token) | ❌ **FAILED** |
| Auth bypass (malformed token) | ❌ **FAILED** |
| SQL injection | ⚠️ Partial (some 500s) |
| XSS prevention | ✅ Passed |
| Input validation | ❌ **FAILED** |
| RBAC enforcement | ✅ Passed |
| IDOR protection | ✅ Passed |

---

## Recommendations

1. **[CRITICAL]** Fix JWT token validation - expired tokens phải bị reject
2. **[HIGH]** Add error handling cho malformed tokens - return 401 không phải 500
3. **[HIGH]** Add input validation cho path params - validate trước khi query DB
4. **[LOW]** Update OpenAPI spec với required params cho graph endpoints
5. **[LOW]** Chuẩn hóa status code cho logout (200/204 thay vì 201)
