# Bugs Found Report

**Generated**: 2026-02-28
**API**: https://api.foreon.network

---

## Critical Bugs (P1)

### BUG-001: Server Error 500 on `/markets/proposed-detail/{id}`
- **Layer**: Smoke, Single API
- **Endpoint**: `GET /markets/proposed-detail/{id}`
- **Expected**: 200 or 404
- **Actual**: 500 Internal Server Error
- **Impact**: Critical - Users cannot view proposed market details
- **Evidence**:
  ```
  Request: GET /markets/proposed-detail/1
  Response: 500 Internal Server Error
  ```

### BUG-002: Server Error 500 on `/markets/upload`
- **Layer**: Smoke, Single API
- **Endpoint**: `POST /markets/upload`
- **Expected**: 400 (no file) or 200/201 (with file)
- **Actual**: 500 Internal Server Error
- **Impact**: Critical - File upload functionality broken
- **Evidence**:
  ```
  Request: POST /markets/upload (empty body)
  Response: 500 Internal Server Error
  ```

---

## High Priority Bugs (P2)

### BUG-003: Missing Auth on `/orders/activity`
- **Layer**: RBAC, Contract
- **Endpoint**: `GET /orders/activity`
- **Expected**: 401 Unauthorized (without token)
- **Actual**: 200 OK (without token)
- **Impact**: Security - Unauthenticated users can view order activity
- **OpenAPI**: Endpoint has `security: [bearer]` but not enforced
- **Evidence**:
  ```
  Request: GET /orders/activity (no Authorization header)
  Response: 200 OK with activity data
  ```

### BUG-004: Inconsistent Error Response Format
- **Layer**: Contract
- **Endpoint**: Multiple endpoints
- **Expected**: `{ code: number, message: string }`
- **Actual**: `{ data: {}, message: string }` (missing `code`)
- **Impact**: API consumers cannot reliably parse error responses
- **Evidence**:
  ```
  Response on auth error: {"data":{},"message":"Authorization: Bearer <token> header missing"}
  Missing field: code
  ```

---

## Medium Priority Bugs (P3)

### BUG-005: Endpoints Not Found (404)
- **Layer**: Single API
- **Endpoints**:
  - `POST /orderbook/add-liquidity` → 404
  - `POST /slack/send-message` → 404
  - `GET /auth/nonce` → 404
  - `POST /auth/connect-wallet` → 404
  - `GET /auth/verify-wallet` → 404
  - `PUT /auth/me` → 404
  - `POST /auth/register-wallet` → 404
- **Expected**: Endpoints exist per OpenAPI spec
- **Actual**: 404 Not Found
- **Impact**: Tests fail, OpenAPI spec out of sync with implementation

### BUG-006: Incorrect Status Code for Non-existent Resources
- **Layer**: Single API
- **Endpoint**: `GET /markets/{id}` with invalid ID
- **Expected**: 404 Not Found
- **Actual**: 200 OK (returns empty or null data)
- **Impact**: Clients cannot distinguish between empty data and not found

### BUG-007: Missing Validation on Invalid ID Format
- **Layer**: Single API
- **Endpoint**: `GET /markets/{id}` with ID = "abc"
- **Expected**: 400 Bad Request
- **Actual**: 500 Internal Server Error
- **Impact**: Poor error handling exposes server errors to users

---

## Low Priority Bugs (P4)

### BUG-008: Response Schema Mismatch
- **Layer**: Contract
- **Endpoints**: GET list endpoints
- **Issue**: Some list endpoints missing pagination metadata
- **Expected**: `{ code, data, metadata: { total, page, limit } }`
- **Actual**: `{ code, data }` (missing metadata)

### BUG-009: CORS Headers Not Configured
- **Layer**: Security
- **Issue**: Tests timeout checking CORS headers
- **Note**: May be network issue or CORS not properly configured

---

## API Behavior Inconsistencies

### INC-001: Public vs Protected Confusion
| Endpoint | OpenAPI | Actual |
|----------|---------|--------|
| GET /orders/activity | Bearer required | Public (200) |
| GET /trades | Bearer required | Bearer required (correct) |
| GET /trades/history | Bearer required | Bearer required (correct) |

### INC-002: Status Code Inconsistencies
| Operation | Expected | Actual |
|-----------|----------|--------|
| POST resource (success) | 201 Created | 200 OK |
| POST resource (validation fail) | 400 | 400 (correct) |
| DELETE non-existent | 404 | 400 |

---

## Test Failures by Category

| Category | Count | Examples |
|----------|-------|----------|
| Server 500 errors | 2 | proposed-detail, upload |
| Missing endpoints (404) | ~20 | auth endpoints, orderbook/add-liquidity |
| Wrong status code | ~30 | Expected 201 got 200, expected 401 got 200 |
| Schema validation | ~10 | Missing fields, wrong types |
| Timeout | ~15 | Security CORS tests |
| Business logic | ~14 | State-dependent tests |

---

## Recommendations

1. **Immediate**: Fix server 500 bugs (BUG-001, BUG-002)
2. **High**: Add auth middleware to /orders/activity (BUG-003)
3. **Medium**: Update OpenAPI spec to match actual endpoints (BUG-005)
4. **Low**: Standardize error response format with `code` field (BUG-004)
