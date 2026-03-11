# E2E Data Dependencies Analysis Report

**Date**: 2026-03-09
**Project**: api-test-system
**Focus**: How data dependencies between test suites are currently handled

---

## Executive Summary

The E2E testing framework **does NOT implement runtime data sharing between tests**. Instead, it uses:

1. **@needs tags + Suite Injection** — Authoring-time mechanism (zero runtime cost)
2. **Per-test context objects** — Each test has isolated `ctx` (variables map + lastApiResponse)
3. **Static data via config** — Accounts, pages, auth tokens stored in `config/e2e.config.json`
4. **No cross-test data flow** — Tests cannot share dynamically created data (e.g., orderId from Test A to Test B)

This is a **STATELESS design** — suitable for independent tests but NOT for multi-step user journeys where later tests depend on data created by earlier tests.

---

## 1. What IS Currently Implemented for Data Dependencies

### 1.1 Suite Injection (@needs tags)

**Location**: `e2e/generator/suite-injector.ts`

**How it works**:
- Feature files declare prerequisites with `@needs(suite-name)` tags
- Suite injector reads `config/suites.config.json` and resolves suite definitions
- Resolved steps are injected into feature's Background (runs via `test.beforeEach()`)
- Deduplication by step text prevents duplicate steps

**Example**:
```gherkin
@smoke @needs(login-owner)
Feature: Dashboard Access

Scenario: Dashboard visible
  Then I should see "Dashboard"
```

Becomes (after injection):
```gherkin
Background:
  Given I login as "owner" with 2FA    # <-- injected from login-owner suite

Scenario: Dashboard visible
  Then I should see "Dashboard"
```

**Supported Suites** (from `config/suites.config.json`):
- `login-owner` — Login as owner with 2FA
- `login-owner-no2fa` — Login as owner without 2FA
- `navigate-dashboard` — Navigate to dashboard page
- `navigate-login` — Navigate to login page
- `logged-in-dashboard` — Composite suite (login-owner + navigate-dashboard)

**Composite Suites**: Suites can reference other suites via `needs` field with cycle detection.

**Code Flow**:
1. `parseFeature()` — Parse .feature file
2. `loadSuitesConfig()` — Load `config/suites.config.json`
3. `injectSuites()` — Extract @needs tags, resolve suite steps, prepend to Background
4. `emitSpecFile()` — Generate .spec.ts with injected steps in `test.beforeEach()`

**Generated Output Example** (from `dashboard-access.spec.ts`):
```typescript
test.beforeEach(async ({ page }) => {
  // Injected from @needs(login-owner)
  const account = e2eConfig.accounts['owner'];
  await page.goto(e2eConfig.pages['login'] || '/');
  await page.waitForLoadState('networkidle');
  // ... fill email, password, 2FA code ...
});

test('Dashboard visible after login', async ({ page }) => {
  const ctx = { variables: new Map(), lastApiResponse: null };
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await expect(page).toHaveURL(new RegExp('/dashboard'));
});
```

### 1.2 Per-Test Context Objects

**Location**: `e2e/generator/code-emitter.ts` (lines 96, 16-17)

**Structure**:
```typescript
const ctx = {
  variables: new Map<string, any>(),  // For step-defined variables
  lastApiResponse: null as any         // For API response storage
};
```

**Current Scope**: Context is **local to each test** (created fresh in each `test()` block).

**Usage in Generated Steps**:
- API steps store responses: `ctx.lastApiResponse = await apiClient.get('/vaults')`
- Assertion steps read responses: `expect(ctx.lastApiResponse.status).toBe(200)`
- Variable steps exist in catalog but are **UNUSED** (defined but no implementation):
  - `I save "{value}" as "{variable}"`
  - `I save element "{selector}" text as "{variable}"`
  - `variable "{name}" should equal "{expected}"`

### 1.3 Static Data via Configuration

**Stored in**:
- `config/e2e.config.json` — Pages, accounts (email, password, TOTP secret), wallet config
- `config/suites.config.json` — Pre-defined login/navigation suites

**Data Available**:
- Account credentials: `e2eConfig.accounts['owner']` (email, password, TOTP secret)
- Page mappings: `e2eConfig.pages['login']` → `/`
- Timeouts, viewport, browser settings

**NO dynamic data creation**: All data is predefined and reused.

### 1.4 Auth State Management

**Location**: `e2e/generated/helpers/auth-helper.ts` (referenced but not shown)

**Usage Pattern**:
```typescript
// From auth.steps.ts
generateCode: ([role]) =>
  `authHelper.setAuthToken('${role}');`,
```

**In Generated Code**:
```typescript
test.beforeEach(async ({ page }) => {
  authHelper.setAuthToken('owner');  // Set bearer token for API calls
});
```

**Scope**: Appears to be global or session-scoped (single auth token per role).

---

## 2. What is NOT Implemented (Gaps)

### 2.1 NO Runtime Data Sharing Between Tests

**Problem**: Tests cannot pass data to subsequent tests.

**Example Missing Pattern**:
```gherkin
Scenario: Create order
  When API: POST "/orders" with { "amount": 100 } returns 201
  # Extract orderId from response: response.data.id = "ORDER-123"

Scenario: Pay for order (DEPENDS ON orderId from previous scenario)
  When API: PUT "/orders/ORDER-123/payment" returns 200
  # ERROR: No way to access "ORDER-123" created by previous test
```

**Why Not Possible**:
- Each test (`test()` block) creates a fresh `ctx` object
- No mechanism to persist context between tests
- Context is not shared across `beforeEach()`
- No test hooks for inter-test communication

### 2.2 NO Test Ordering / Sequencing

**Problem**: Tests run in random order (Playwright/Vitest behavior).

**Missing**: No `@depends-on(test-name)` mechanism or sequential execution.

### 2.3 Variable Sharing Steps Defined But Unused

**Location**: `e2e/QC-GUIDE.md` (lines 155-161)

```markdown
| Step | Example |
|------|---------|
| `I save "{value}" as "{variable}"` | `When I save "test-123" as "orderId"` |
| `I save element "{selector}" text as "{variable}"` | `When I save element "#order-id" text as "orderId"` |
| `variable "{name}" should equal "{expected}"` | `Then variable "orderId" should equal "test-123"` |
```

**Status**: Documented in QC guide but **NOT registered** in `e2e/steps/catalog.ts`.

**Code**: No implementation in any `.steps.ts` file.

### 2.4 NO Cross-Scenario Data Extraction

**Problem**: API responses are stored but never extracted to variables for reuse.

**Pattern Not Supported**:
```gherkin
Scenario: Create user
  When API: POST "/users" with { "email": "new@test.com" } returns 201
  Then save response field "data.userId" as "userId"  # NOT POSSIBLE

Scenario: Get user profile
  When API: GET "/users/{userId}" returns 200      # No variable interpolation
```

### 2.5 NO Database State Sharing

**Problem**: Even if data is created, tests cannot coordinate DB cleanup or verify state.

**Missing**:
- `@transaction` or `@cleanup` tags for coordinated teardown
- No cross-test fixtures for bulk data setup

### 2.6 NO Scenario Outline-Level Context

**Problem**: Each expanded scenario outline gets fresh context.

**Example** (`login.spec.ts`):
```typescript
Scenario Outline: Login validation - <case>
  # Each example row creates NEW test() block with fresh ctx
  test('Login validation - invalid email format', async ({ page }) => {
    const ctx = { variables: new Map(), lastApiResponse: null };
    // ...
  });
  
  test('Login validation - weak password format', async ({ page }) => {
    const ctx = { variables: new Map(), lastApiResponse: null };  // NEW ctx
    // ...
  });
```

No mechanism to share data across outline rows.

---

## 3. How @needs Tags Work vs Actual Runtime Data Sharing

### 3.1 @needs Tags: Authoring-Time Mechanism

| Aspect | Details |
|--------|---------|
| **Execution Time** | Code generation time (not runtime) |
| **Purpose** | Inject setup steps into Background |
| **Data Type** | Static (predefined login flows) |
| **Cost** | Zero runtime overhead (compiled into spec files) |
| **Scope** | Single feature file |
| **Ordering** | Steps execute sequentially in `test.beforeEach()` |

**Is It "Sharing"?** NO. It's step injection, not data sharing.

### 3.2 Runtime Data Sharing: NOT Implemented

| Aspect | What's Missing |
|--------|-----------------|
| **Inter-Test Communication** | No mechanism for Test A → Test B |
| **Context Persistence** | `ctx` is isolated per test block |
| **Variable Storage** | Map exists but never populated by steps |
| **API Response Extraction** | Last response stored but never interpolated |
| **Cross-Scenario Flow** | No sequential test dependency support |

---

## 4. Code Evidence

### 4.1 Per-Test Context Isolation

**File**: `e2e/generator/code-emitter.ts:96`

```typescript
test('${escapeQuotes(scenario.name)}', async (${fixture}) => {
  const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
  // context is NEW for each test block
  for (const step of scenario.steps) {
    // ...
  }
});
```

**Problem**: `ctx` is declared inside `test()` block, scoped to that test only.

### 4.2 Variables Map Never Used

**File**: `e2e/steps/catalog.ts` - Catalog registration

Variables steps are documented but never registered:

```typescript
// NOT REGISTERED - search for "save" in catalog.ts returns no match
// "I save "{value}" as "{variable}""
// "variable "{name}" should equal "{expected}""
```

Only API response storage is implemented:

```typescript
// FROM api.steps.ts
generateCode: ([endpoint, code]) =>
  `ctx.lastApiResponse = await apiClient.get('${endpoint}');\n...`,
```

### 4.3 Generated Specs Show No Variable Usage

**Example**: `e2e/generated/vault-management.spec.ts`

```typescript
test('API vault list returns data', async () => {
  const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
  ctx.lastApiResponse = await apiClient.get('/vaults');
  expect(ctx.lastApiResponse.status).toBe(200);
  expect(ctx.lastApiResponse.data).toHaveProperty('data');
});
// ctx.variables is NEVER used
```

---

## 5. Current Test Structure Examples

### 5.1 Isolated Tests (No Dependencies)

```typescript
// e2e/generated/login.spec.ts
test('Login validation - invalid email format', async ({ page }) => {
  const ctx = { variables: new Map(), lastApiResponse: null };
  await page.getByPlaceholder('Enter email address').fill('notanemail');
  await page.getByPlaceholder('Enter password').fill('TestPassword1!');
  // No data passed in, no data passed out
});
```

### 5.2 @needs Tag Injection (Suite-Based Setup)

```typescript
// e2e/generated/dashboard-access.spec.ts
test.beforeEach(async ({ page }) => {
  // Injected from @needs(login-owner)
  const account = e2eConfig.accounts['owner'];
  await page.goto(e2eConfig.pages['login'] || '/');
  // ... login steps ...
});
```

### 5.3 Hybrid API + UI (Single Test)

```typescript
// e2e/generated/vault-management.spec.ts
test('API vault list returns data', async () => {
  const ctx = { variables: new Map(), lastApiResponse: null };
  ctx.lastApiResponse = await apiClient.get('/vaults');
  expect(ctx.lastApiResponse.status).toBe(200);
  // Context is test-local; cannot be used by next test
});
```

---

## 6. Architecture Limitations

### Why Data Sharing Was Not Implemented

1. **Test Isolation Principle**: Playwright/Vitest favor independent tests (no global state)
2. **Parallel Execution**: Tests can run in parallel; shared state would cause conflicts
3. **Reliability**: Independent tests are more predictable and easier to debug
4. **Scope Mismatch**: @needs tags are authoring-time; runtime sharing would be new layer
5. **No Test Sequencing**: No way to specify "run Test A before Test B"

### Design Trade-offs

| Aspect | Current | Advantage | Disadvantage |
|--------|---------|-----------|--------------|
| **Scope** | Per-test | Isolation, parallel-safe | No inter-test data flow |
| **Setup** | @needs injection | Zero runtime cost | Static data only |
| **Auth** | Token per role | Simple | No multi-user sessions |
| **Cleanup** | Implicit (none) | Simple | May leave test data |

---

## 7. Unresolved Questions

1. **How does `authHelper.setAuthToken()` work?** — The helper is referenced but implementation not found. Is it session-global or per-test?

2. **Are tests expected to run sequentially or in parallel?** — If parallel, inter-test data sharing would cause race conditions. If sequential, framework should enforce order.

3. **What should happen to test data created by failing tests?** — No cleanup mechanism found. Does framework expect API to handle transient data?

4. **Is the `variables` Map in ctx intended for future use?** — It's created but never populated. Is there a planned variable-sharing feature?

5. **How are API tests coordinated with DB state?** — API tests call `/vaults` but don't verify DB consistency. Is that responsibility of API layer?

6. **Should multi-step journeys (create → update → delete) be single tests or feature files?** — Currently unclear based on examples. `vault-management.feature` has separate scenarios but they're independent.

---

## Conclusion

**Current State**: E2E framework is **STATELESS** with **ISOLATED TESTS** and **AUTHORING-TIME SETUP**.

**What Works Well**:
- Independent test execution
- Static prerequisite injection via @needs
- Per-test API response capture
- Parallel-safe architecture

**What's Missing for Complex Journeys**:
- Inter-test data sharing
- Variable extraction from responses
- Test sequencing / ordering
- Cross-test fixtures

**Recommendation**: For multi-step user journeys, QA should write them as **single feature files with sequential scenarios** (not separate features), and implement data extraction via custom steps or fixtures.

