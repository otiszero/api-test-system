# Test Plan - Foreon Prediction Market API

**Generated**: 2026-03-02
**API**: https://api.foreon.network
**OpenAPI Version**: 3.0.0

---

## Summary

| Metric | Value |
|--------|-------|
| Total Endpoints | 68 |
| Testable Endpoints | 46 |
| Blacklisted Endpoints | 22 |
| Resources | 9 |

### Blacklisted Patterns
- `/admin/*` - Admin management endpoints
- `*/admin/*` - Admin-related auth endpoints

---

## Resources & Execution Order

```
1. Authentication (6 endpoints) - No dependencies
2. Statistic (1 endpoint) - Public, no dependencies
3. Slack (1 endpoint) - Public, no dependencies
4. Markets (13 endpoints) - Depends on: Authentication
5. Admin (3 endpoints) - Depends on: Authentication
6. Orderbook (1 endpoint) - Depends on: Markets
7. Comments (6 endpoints) - Depends on: Authentication, Markets
8. Orders (9 endpoints) - Depends on: Authentication, Markets
9. Trades (5 endpoints) - Depends on: Orders
```

---

## Test Estimate per Layer

| Layer | Endpoints | Est. Tests | Notes |
|-------|-----------|------------|-------|
| 🟢 Smoke | 46 | 46 | 1 reachability test per endpoint |
| 🔵 Contract | 46 | 60 | Schema validation + error format |
| 🟡 Single API | 46 | 180 | ~4 tests per endpoint (CRUD, validation, edge cases) |
| 🟠 Integration | 8 scenarios | 40 | From test-rules.md |
| 🔐 RBAC | 25 | 75 | Endpoints with security: bearer |
| ⚫ Security | 46 | 50 | Auth bypass, injection, headers |
| 🟣 DB Integrity | 9 resources | 20 | Cascade delete, constraints |

**Total Estimated Tests: ~471**
**Estimated Runtime: ~15-20 minutes**

---

## Detailed Test Cases by Resource

### 1. Authentication (6 testable endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|:-----:|:--------:|:------:|:----:|:--------:|
| `POST /auth/login` | ✓ | ✓ | ✓ | — | ✓ |
| `POST /auth/logout` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/refresh-token` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /auth/admin-refresh-token` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /auth/me` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /auth/asset` | ✓ | ✓ | ✓ | ✓ | ✓ |

**Single API Tests:**
- `GET /auth/me` - Return current user profile (200)
- `GET /auth/me` - Without token (401)
- `GET /auth/asset` - Return user assets
- `POST /auth/logout` - Invalidate token
- `POST /auth/refresh-token` - Get new access token

---

### 2. Markets (13 testable endpoints)

| Endpoint | Smoke | Contract | Single | Integration | RBAC | Security |
|----------|:-----:|:--------:|:------:|:-----------:|:----:|:--------:|
| `GET /markets` | ✓ | ✓ | ✓ | ✓ | — | — |
| `GET /markets/{id}` | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `GET /markets/proposed` | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `GET /markets/proposed-detail/{id}` | ✓ | ✓ | ✓ | — | ✓ | — |
| `GET /markets/top-holders/{id}` | ✓ | ✓ | ✓ | — | — | — |
| `GET /markets/category` | ✓ | ✓ | ✓ | — | — | — |
| `GET /markets/favorites` | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `POST /markets/{marketId}/favorite` | ✓ | — | ✓ | ✓ | ✓ | — |
| `GET /markets/ipfs/{id}` | ✓ | — | ✓ | — | — | — |
| `POST /markets/market` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `PUT /markets/vote/{id}` | ✓ | — | ✓ | ✓ | ✓ | — |
| `PUT /markets/add-liquidity/{id}` | ✓ | — | ✓ | ✓ | — | — |
| `POST /markets/upload` | ✓ | — | ✓ | — | ✓ | ✓ |

**Single API Tests:**
- `GET /markets` - List all markets with pagination
- `GET /markets` - Filter by category, status
- `GET /markets/{id}` - Get market detail
- `GET /markets/{id}` - Non-existent ID (404)
- `GET /markets/{id}` - Invalid ID format (400)
- `POST /markets/market` - Create market with valid data
- `POST /markets/market` - Missing required fields (400)
- `POST /markets/market` - Without auth (401)
- `PUT /markets/vote/{id}` - Vote on market outcome
- `POST /markets/upload` - Upload market image

**Business Rules (from test-rules.md):**
- Market must have at least 2 outcomes
- endTime > publishedAt
- startVoteTime < endVoteTime

---

### 3. Orders (9 testable endpoints)

| Endpoint | Smoke | Contract | Single | Integration | RBAC | Security |
|----------|:-----:|:--------:|:------:|:-----------:|:----:|:--------:|
| `GET /orders` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /orders` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `PUT /orders/{id}/cancelled` | ✓ | — | ✓ | ✓ | ✓ | — |
| `PUT /orders/{id}/claimed` | ✓ | — | ✓ | ✓ | ✓ | — |
| `GET /orders/position` | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `GET /orders/position-claims` | ✓ | ✓ | ✓ | — | ✓ | — |
| `POST /orders/position-claims` | ✓ | — | ✓ | ✓ | ✓ | — |
| `POST /orders/add-liquidity` | ✓ | — | ✓ | ✓ | ✓ | — |
| `GET /orders/activity` | ✓ | ✓ | ✓ | ✓ | ✓ | — |

**Single API Tests:**
- `GET /orders` - List user orders
- `POST /orders` - Create order with valid data
- `POST /orders` - Negative amount (400)
- `POST /orders` - Zero amount (400)
- `POST /orders` - Missing txHash (400)
- `PUT /orders/{id}/cancelled` - Cancel own order
- `PUT /orders/{id}/cancelled` - Cancel already claimed (400)
- `PUT /orders/{id}/claimed` - Claim filled order
- `GET /orders/position` - Get user positions

**State Machine (from test-rules.md):**
```
OPEN → FILLED → CLAIMED
OPEN → CANCELLED
Invalid: CLAIMED → CANCELLED, CANCELLED → FILLED
```

---

### 4. Trades (5 testable endpoints)

| Endpoint | Smoke | Contract | Single | Integration | RBAC | Security |
|----------|:-----:|:--------:|:------:|:-----------:|:----:|:--------:|
| `GET /trades` | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `GET /trades/market-trade` | ✓ | ✓ | ✓ | — | — | — |
| `GET /trades/graph` | ✓ | ✓ | ✓ | — | — | — |
| `GET /trades/graph-overrall` | ✓ | ✓ | ✓ | — | — | — |
| `GET /trades/history` | ✓ | ✓ | ✓ | — | ✓ | — |

---

### 5. Comments (6 testable endpoints)

| Endpoint | Smoke | Contract | Single | Integration | RBAC | Security |
|----------|:-----:|:--------:|:------:|:-----------:|:----:|:--------:|
| `POST /comments` | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| `POST /comments/reply` | ✓ | — | ✓ | ✓ | ✓ | — |
| `GET /comments/market/{marketId}` | ✓ | ✓ | ✓ | ✓ | — | — |
| `GET /comments/reply/{parentId}` | ✓ | ✓ | ✓ | ✓ | — | — |
| `POST /comments/{commentId}/like` | ✓ | — | ✓ | ✓ | ✓ | — |
| `DELETE /comments/{commentId}` | ✓ | — | ✓ | ✓ | ✓ | — |

**Business Rules:**
- Comment content không được rỗng
- User chỉ có thể update/delete comment của chính mình

---

### 6. Admin (3 testable endpoints)

| Endpoint | Smoke | Contract | Single | RBAC | Security |
|----------|:-----:|:--------:|:------:|:----:|:--------:|
| `GET /admin` | ✓ | ✓ | ✓ | ✓ | — |
| `POST /admin` | ✓ | — | ✓ | ✓ | — |
| `PUT /admin` | ✓ | — | ✓ | ✓ | — |

---

### 7. Other Resources

| Resource | Endpoint | Smoke | Contract | Single |
|----------|----------|:-----:|:--------:|:------:|
| Root | `GET /` | ✓ | ✓ | ✓ |
| Orderbook | `GET /orderbook` | ✓ | ✓ | ✓ |
| Statistic | `GET /statistic/rank` | ✓ | ✓ | ✓ |
| Slack | `GET /slack/{id}` | ✓ | — | ✓ |

---

## Integration Scenarios (from test-rules.md)

| # | Scenario | Steps | Priority |
|---|----------|-------|----------|
| 1 | User tạo market và place order | POST market → GET market → POST order → GET position | High |
| 2 | User cancel order trước khi filled | POST order → PUT cancelled → GET position | High |
| 3 | User không thể cancel order đã claimed | PUT cancelled on CLAIMED order → expect 400 | Medium |
| 4 | User claim profit sau khi market resolved | PUT claimed → GET position-claims | Medium |
| 5 | User A không thể cancel order của User B (IDOR) | User B POST order → User A PUT cancel → expect 403 | Critical |
| 6 | User add liquidity vào market | POST add-liquidity → GET orderbook | Medium |
| 7 | User comment CRUD lifecycle | POST → PUT → DELETE → GET verify | Low |
| 8 | Guest user chỉ có thể read public data | GET markets ✓, POST orders ✗ | High |

---

## Security Test Cases

| Category | Test | Endpoints |
|----------|------|-----------|
| Auth Bypass | Request without token | All protected endpoints |
| Auth Bypass | Expired token | All protected endpoints |
| Auth Bypass | Malformed token | All protected endpoints |
| Injection | SQL injection in query params | GET endpoints with query |
| Injection | SQL injection in body | POST/PUT endpoints |
| Injection | XSS in comment content | POST /comments |
| IDOR | Access other user's orders | GET/PUT /orders/{id} |
| IDOR | Delete other user's comment | DELETE /comments/{id} |

---

## RBAC Test Matrix

| Endpoint | admin | user | guest |
|----------|:-----:|:----:|:-----:|
| GET /orders | ✅ all | 🔒 own | ❌ 401 |
| PUT /orders/{id}/cancelled | ✅ all | 🔒 own | ❌ 401 |
| DELETE /comments/{id} | ✅ all | 🔒 own | ❌ 401 |
| POST /markets/market | ✅ | ✅ | ❌ 401 |
| GET /markets | ✅ | ✅ | ✅ |

---

## Notes

1. **Admin token expired** - Cần refresh trước khi chạy tests
2. **IDOR tests** - Cần 2 user accounts cùng role (hiện chỉ có 1)
3. **DB tests** - db-schema.sql chưa có, sẽ skip DB integrity tests
