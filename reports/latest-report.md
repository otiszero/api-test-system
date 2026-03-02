# Test Execution Report

**Generated**: 2026-02-28T22:16:00.000Z
**API**: https://api.foreon.network
**Total Duration**: ~214 seconds

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 351 |
| **Passed** | 250 |
| **Failed** | 91 |
| **Skipped** | 10 |
| **Pass Rate** | 71.2% |

---

## Results by Layer

| Layer | Passed | Failed | Skipped | Total | Pass Rate |
|-------|--------|--------|---------|-------|-----------|
| 01-Smoke | 43 | 2 | 1 | 46 | 93.5% |
| 02-Contract | 23 | 6 | 0 | 29 | 79.3% |
| 03-Single API | 70 | 60 | 5 | 135 | 51.9% |
| 04-Integration | 29 | 7 | 0 | 36 | 80.6% |
| 05-RBAC | 46 | 1 | 3 | 50 | 92.0% |
| 06-Security | 29 | 15 | 1 | 45 | 64.4% |
| 07-DB Integrity | 10 | 0 | 0 | 10 | 100.0% |

---

## Top Failure Patterns

### 1. Server 500 Errors (Backend Bugs)
- `GET /markets/proposed-detail/{id}` → 500
- `POST /markets/upload` → 500

### 2. Endpoint Not Found (404)
- Multiple tests expecting endpoints that return 404
- `POST /orderbook/add-liquidity` → 404 (endpoint may not exist)
- `POST /slack/send-message` → 404 (endpoint may not exist)

### 3. Missing Auth Requirement (Expected 401, Got 200)
- `GET /orders/activity` returns 200 without auth (should require auth per OpenAPI)

### 4. Test Assumptions vs API Reality
- Tests expecting 201 for POST but API returns 400 (validation)
- Tests expecting specific status codes that don't match actual behavior

### 5. Timeout Issues
- Security tests hit timeout (10s) during CORS header checks
- API slowness under multiple concurrent requests

---

## Configuration Used

| Config | Value |
|--------|-------|
| Base URL | https://api.foreon.network |
| Timeout | 10000ms |
| Auth Type | bearer_direct |
| Roles | admin, user |
| Account ID | 17 (isAdmin: true) |
| DB | MySQL enabled (foreon@64.23.225.69:32775) |

---

## Recommendations

1. **Fix Server 500 Bugs**: `/markets/proposed-detail/{id}` and `/markets/upload` endpoints
2. **Add Auth Guard**: `/orders/activity` should require authentication
3. **Update Test Expectations**: Several tests have incorrect status code expectations
4. **Increase Timeout**: Consider increasing timeout for security tests
5. **Add Second Test Account**: IDOR tests require 2 different user accounts

---

## Files

| File | Description |
|------|-------------|
| `reports/latest-report.md` | This file |
| `reports/bugs-found.md` | Detailed bug report |
| `reports/coverage-matrix.md` | Endpoint coverage |
| `reports/ai-summary.md` | AI analysis |
