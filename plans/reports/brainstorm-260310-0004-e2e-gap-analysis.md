# E2E Framework Gap Analysis

**Date**: 2026-03-10 | **Type**: Brainstorm / Gap Review | **Scope**: `e2e/` directory

---

## System Summary

Gherkin-to-Playwright transpiler. `.feature` → `.spec.ts` in one pass. 49-step catalog (navigation, form, assertion, action, API, auth, wallet, data). Suite injection via `@needs` tags. Zero runtime AI cost for matched steps.

**Current state**: 7 features, 13 scenarios, 6 generated specs + 1 wallet spec.

---

## GAP MATRIX

### 🔴 Tier 1 — CRITICAL (blocks reliable testing)

| # | Gap | Impact | Evidence |
|---|-----|--------|----------|
| 1 | **Weak assertions** | Tests pass with wrong data | Specs only check text visibility + status codes; no schema/content validation |
| 2 | **No negative/error tests** | ~80% scenarios missing | login-2fa: only happy path; no wrong OTP, expired OTP, rate limit, lockout |
| 3 | **No test cleanup** | Data persists → flaky | Zero `afterEach`/`afterAll` in any generated spec |
| 4 | **Hardcoded credentials** | Not reproducible | `owner@test.com`, `TestPassword1!` duplicated across specs instead of config ref |
| 5 | **No CI/CD pipeline** | Can't automate | No GitHub Actions, Docker, or any pipeline config exists |

### 🟠 Tier 2 — HIGH (reduces coverage significantly)

| # | Gap | Impact |
|---|-----|--------|
| 6 | **Missing 15+ catalog patterns** | Drag-drop, modal/dialog, table ops, pagination, scroll, multi-select, iframe, PATCH, request bodies, header assertions, response time, keyboard nav, accessibility |
| 7 | **CRUD only ~30% covered** | Vault: only READ tested; KYC: only page visibility; no CREATE/UPDATE/DELETE |
| 8 | **Single browser (Chromium)** | Misses Firefox/Safari bugs |
| 9 | **No Page Object Models** | Selectors scattered in step defs; maintenance nightmare |
| 10 | **No multi-account support** | Only 1 account (owner); can't test permission boundaries |

### 🟡 Tier 3 — MEDIUM (quality issues)

| # | Gap | Impact |
|---|-----|--------|
| 11 | **TOTP timing fragile** | 30s window; code could expire during typing |
| 12 | **No error context in failures** | Assertions lack debug messages |
| 13 | **Credentials in JSON, committed** | Security risk; should use env vars |
| 14 | **Generator lacks validation** | No check for empty features, missing suites, duplicate scenario names, malformed Gherkin |
| 15 | **No JUnit/XML reporting** | CI can't parse results |
| 16 | **Auth token lifecycle unmanaged** | Token set once, never refreshed; mid-test expiry = silent failure |

### 🟢 Tier 4 — LOW (nice-to-have)

| # | Gap |
|---|-----|
| 17 | Visual regression testing |
| 18 | Performance assertions (response time limits) |
| 19 | Accessibility scanning (a11y) |
| 20 | Multi-environment config (dev/staging/prod) |
| 21 | Soft assertions (collect multiple failures per test) |
| 22 | Centralized logging/observability |

---

## COVERAGE SNAPSHOT

| Metric | Current | Target | Delta |
|--------|---------|--------|-------|
| Catalog patterns | 49 | 65+ | -16 |
| Test isolation | 0% | 100% | ❌ |
| Error scenario coverage | ~20% | 80% | -60% |
| Edge case coverage | ~10% | 50% | -40% |
| CRUD coverage | ~30% (R only) | 100% | -70% |
| Multi-account | 1 | 3+ | -2 |
| Multi-browser | 1 | 3 | -2 |
| API schema validation | None | Full | ❌ |

---

## STRENGTHS (what's working well)

- Clean architecture: one-pass transpiler, zero runtime AI cost
- Suite injection with cycle detection + recursive resolution
- Wallet/MetaMask testing via Synpress properly isolated
- 49-step catalog covers ~70% of common UI/API patterns
- QC guide comprehensive (325 lines)
- Scenario Outline data-driven expansion works correctly
- Import detection (API, wallet, TOTP) is smart

---

## RECOMMENDED ACTION TIERS

### ⚡ Immediate (this sprint)
1. Add `afterEach` cleanup in code-emitter template
2. Move hardcoded creds to config references in generated code
3. Add negative test scenarios for login-2fa (wrong OTP, expired, lockout)
4. Add TOTP retry with fresh code if first attempt fails

### 🚀 Short-term (1-2 sprints)
5. Expand catalog: modal, table, pagination, scroll, drag-drop (+15 patterns)
6. Add API request body support in Gherkin steps
7. Generator validation: empty features, missing suites, duplicate scenarios
8. Add JUnit reporter for CI integration
9. Create GitHub Actions workflow for e2e

### 📈 Medium-term (1 month)
10. Page Object Model for complex selectors
11. Multi-account test data (owner, admin, user, guest)
12. Multi-browser config (Firefox, WebKit)
13. API schema validation (AJV against OpenAPI)
14. Auth token refresh helper

---

## GENERATOR-SPECIFIC GAPS

| Issue | Risk | Fix Complexity |
|-------|------|----------------|
| No empty feature validation | Silent failure | Low |
| No `@needs(nonexistent)` warning | Confusing error | Low |
| No duplicate scenario name check | Overwritten tests | Low |
| Data table only supports field\|value | Limited expressiveness | Medium |
| No page name validation vs config | Runtime 404 | Low |
| No multi-column data table | Can't express complex tables | Medium |

---

## UNRESOLVED QUESTIONS

1. Which CI/CD platform? (GitHub Actions most likely given `gh` usage)
2. Test against dev only or also staging/prod?
3. Performance targets for critical flows? (login < Xs?)
4. Secret management strategy? (env vars vs vault?)
5. Cross-browser testing actually required by stakeholders?
6. Should cleanup be API-based (fast) or UI-based (realistic)?
7. Test database isolation strategy for parallel runs?
