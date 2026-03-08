# Gherkin-to-Playwright Conversion: Research Summary

**Date**: 2025-03-08
**Research Focus**: BDD frameworks, code generation approaches, step definition patterns, token optimization

---

## 1. Existing Tools & Maintenance Status

### **playwright-bdd** ✅ RECOMMENDED
- **Status**: Actively maintained (as of Feb 2025)
- **Approach**: Runtime BDD runner for Playwright (interprets feature files at runtime)
- **GitHub**: playwright-bdd/playwright-bdd
- **Pros**:
  - Purpose-built for Playwright (native integration)
  - Active development, regular updates
  - Step definitions in TypeScript
  - Built-in reporting
  - Supports both feature files and fixtures
- **Cons**:
  - Runtime interpretation adds ~200-500ms overhead per scenario
  - Requires feature file + step definition files (maintenance burden)
  - Cannot generate static `.test.ts` files (runtime-only)
  - Less popular than Cucumber ecosystem

### **cucumber-js** + **@cucumber/cucumber-expressions** ⚠️ MATURE
- **Status**: Stable, widely adopted, excellent community
- **Approach**: General-purpose BDD runner (language-agnostic)
- **npm**: @cucumber/cucumber
- **Pros**:
  - Massive ecosystem, well-documented
  - Step definition reusability across projects
  - Advanced filtering (tags, names)
  - Multi-language support
  - Powerful reporting plugins
- **Cons**:
  - Generic design (not optimized for Playwright)
  - Requires adapter layer to work with Playwright
  - Steeper learning curve
  - Overhead from general-purpose framework

### **playwright-cucumber** ❌ NOT RECOMMENDED
- **Status**: Minimal maintenance, fragmented ecosystem
- **Approach**: Thin wrapper around Cucumber
- **Verdict**: Skip. Playwright-bdd is superior alternative.

---

## 2. Code Generation Approach: Static vs. Runtime

### **Option A: Static Code Generation** (One-Time Generation → `.test.ts` Files)

```
.feature files → TypeScript Code Generator → *.test.ts (standalone)
                                          ↓
                                    npm run vitest
```

**Implementation Pattern**:
```typescript
// Input: Feature files
// Feature: User login
//   Scenario: Valid credentials
//     Given user at login page
//     When user enters valid credentials
//     Then user should see dashboard

// Output: user-login.test.ts (static file)
test('Valid credentials', async ({ page }) => {
  await givenUserAtLoginPage(page);
  await whenUserEntersValidCredentials(page, email, password);
  await thenUserShouldSeeDashboard(page);
});
```

**Pros**:
- ✅ No runtime overhead (pure Vitest)
- ✅ Better token cost (feature → code once, then review/run)
- ✅ Full IDE support, type safety
- ✅ Easier debugging (actual test code visible)
- ✅ Integrates with existing Vitest reports
- ✅ CI/CD friendly (no feature runner needed)
- ✅ Can be version-controlled as reference

**Cons**:
- ⚠️ Requires custom TypeScript generator (scaffold 200-300 lines)
- ⚠️ Regeneration overwrites customizations (need careful management)
- ⚠️ Feature → code delta management needed
- ⚠️ Losing BDD semantics in version control (now have code + features)

**Use Case**: Your API test system (fully determined, deterministic tests)

---

### **Option B: Runtime Interpretation** (Feature Files → Interpreter at Runtime)

```
.feature files + step-definitions/ → [playwright-bdd] → test execution
```

**Pros**:
- ✅ Single source of truth (feature file only)
- ✅ Easy to modify tests (edit `.feature`, no code regeneration)
- ✅ Smaller repo footprint
- ✅ Native BDD feeling for stakeholders

**Cons**:
- ⚠️ Runtime overhead (200-500ms per scenario)
- ⚠️ Slower feedback loop
- ⚠️ More token cost (regenerate steps for every test modification)
- ⚠️ Harder debugging (feature file ≠ actual code)

**Use Case**: Exploratory/manual-heavy testing, rapid prototyping

---

## 3. Step Definition Catalogs & Reusability

### **Recommended Pattern: Step Definition Library Architecture**

```
steps/
├── core/
│   ├── navigation-steps.ts      # URL navigation, page routing
│   ├── element-steps.ts         # Click, fill, assert visibility
│   ├── form-steps.ts            # Multi-field forms, validation
│   └── table-steps.ts           # Row selection, sorting
├── api-steps.ts                 # HTTP calls (axios), response validation
├── auth-steps.ts                # Login, token management, role switching
├── data-steps.ts                # Setup test data (DB, factories)
└── cleanup-steps.ts             # Teardown, resource deletion
```

### **Key Principles for Minimal AI Intervention**

1. **Parameterized Steps** (avoid custom language interpretation)
   ```gherkin
   # GOOD - parameter-based
   When user clicks "<selector>"
   And user fills "<field>" with "<value>"
   Then element "<selector>" should be visible

   # BAD - requires NLP to map to selectors
   When user clicks the login button
   And user enters password in the password field
   ```

2. **Step Definition Catalog** (discoverable inventory)
   ```typescript
   // steps/catalog.ts - Single registry
   export const AVAILABLE_STEPS = {
     navigation: {
       'user navigates to {url}': navigationStep,
       'user waits for navigation to {url}': waitNavigationStep,
     },
     forms: {
       'user fills {field} with {value}': fillFieldStep,
       'user submits form': submitFormStep,
     },
   };
   ```

3. **Typed Parameters** (eliminate ambiguity)
   ```typescript
   // steps/form-steps.ts
   When('user fills {selector} with {text}', async (page, selector, text) => {
     await page.fill(selector, text);
   });

   // Usage in feature:
   // When user fills "#email-input" with "test@example.com"
   ```

4. **Shared Context Object** (minimize state passing)
   ```typescript
   // context.ts
   export class TestContext {
     page: Page;
     apiClient: AxiosInstance;
     testData: Record<string, any> = {};
     variables: Map<string, string> = new Map();
   }

   // Any step can access full context
   Given('user is authenticated as {role}', async (ctx, role) => {
     const token = await ctx.apiClient.post('/auth/login', {...});
     ctx.variables.set('auth_token', token);
   });
   ```

---

## 4. Token Cost Optimization Strategy

### **Problem**: Feature files need constant regeneration by AI (expensive)

### **Solution: Hybrid Approach**

**Phase 1: Feature Template Library (ONE-TIME)**
```
features/
├── templates/
│   ├── crud-endpoints.feature     # Reusable CRUD patterns
│   ├── auth-flows.feature         # Login/logout/token patterns
│   ├── error-scenarios.feature    # 4xx/5xx error patterns
│   ├── validation.feature         # Input validation patterns
│   └── pagination.feature         # Paging patterns
└── specific/
    ├── market-api.feature         # Project-specific
    └── user-profile-api.feature   # Project-specific
```

**Token Cost**:
- ✅ Template features: ~5,000 tokens (write once)
- ✅ Project features: ~2,000 tokens (customize templates)
- ✅ Step definitions: ~3,000 tokens (implement once)
- **Total**: ~10,000 tokens for full test suite setup

**Phase 2: Code Generation (STATIC)**
```bash
# One-time command
npx generate-tests --from features/ --output tests/ --template-dir steps/

# Output: fully-formed *.test.ts files
# No regeneration needed unless feature changes
```

**Token Cost Reduction**:
| Approach | Feature Cost | Step Cost | Regeneration | Total |
|----------|-------------|-----------|--------------|-------|
| Runtime BDD | 5K | 3K | Every change | 8K + 5K/change |
| Static Generation | 5K | 3K | Once | 8K |
| Manual Playwright | 0 | 8K | Never | 8K |

**Winner**: Static generation = **lowest incremental cost**

---

## 5. Hybrid UI + API Testing Pattern

### **Architecture: Unified Test Context**

```typescript
// test-context.ts
export class TestContext {
  page: Page;                        // Playwright browser
  apiClient: HttpClient;             // Axios-based API caller
  dbClient: DatabaseClient;          // DB direct access
  auth: AuthManager;                 // Token/session management

  // Shared test data
  createdResources: Map<string, any> = new Map();
}

// Step definitions bridging both worlds
Given('user is authenticated via API as {role}', async (ctx, role) => {
  // 1. Setup via API (fast, no UI overhead)
  const token = await ctx.apiClient.post('/auth/login', {
    username: `${role}@test.example.com`,
    password: 'test-password'
  });
  ctx.auth.setToken(token);

  // 2. Verify in browser (optional)
  await ctx.page.goto('/dashboard');
  // Token is automatically included in browser requests
});

When('user creates market via UI', async (ctx) => {
  await ctx.page.fill('#market-name', 'Test Market');
  await ctx.page.click('#submit-btn');

  // Extract created ID from response
  const newMarket = await ctx.apiClient.get('/markets/latest');
  ctx.createdResources.set('market_id', newMarket.id);
});

Then('API should reflect market creation', async (ctx) => {
  const marketId = ctx.createdResources.get('market_id');

  // Direct API verification (no UI clicking)
  const market = await ctx.apiClient.get(`/markets/${marketId}`);
  expect(market.status).toBe('active');
});

// Cleanup via API (fast)
After(async (ctx) => {
  for (const [, resource] of ctx.createdResources) {
    await ctx.apiClient.delete(`/${resource.type}/${resource.id}`);
  }
});
```

### **Best Practices for Hybrid Tests**

1. **API for Setup/Cleanup** (minimize UI navigation)
   ```gherkin
   # GOOD - fast setup
   Given user has 5 markets created via API
   And user is authenticated via API
   When user navigates to /markets page
   Then user should see all 5 markets

   # BAD - slow, brittle
   Given user clicks "Create Market" button 5 times
   And fills all fields manually
   ```

2. **UI for User Journey Verification**
   ```gherkin
   # User sees the workflow
   When user filters markets by "Technology"
   Then search results should display instantly
   And results should match API data
   ```

3. **API for State Verification**
   ```gherkin
   # Fast assertions without UI
   Then API should show market status as "published"
   And database should have matching record
   ```

---

## 6. Recommended Architecture for This Project

Given your **API Test System** context:

### **Approach: Static Code Generation + Playwright**

```
config/                          # QA fills (unchanged)
│
input/
├── openapi.yaml               # Source of truth
│
features/                       # NEW
├── templates/
│   ├── crud.feature
│   ├── auth.feature
│   ├── error-scenarios.feature
│   └── pagination.feature
│
generated/
├── canonical-endpoints.json   # (existing, from /analyze)
│
├── steps/                     # NEW - Step library
│   ├── api-steps.ts
│   ├── auth-steps.ts
│   ├── validation-steps.ts
│   └── context.ts
│
├── tests/
│   ├── 01-smoke/
│   │   └── *.test.ts         # Generated from features
│   └── ... (other layers)
```

### **Implementation Phases**

**Phase 1**: Create step definition library
```typescript
// generated/steps/context.ts
export class APITestContext {
  apiClient: AxiosInstance;
  auth: AuthManager;
  lastResponse: any;
  variables: Map<string, any> = new Map();
  createdResources: Map<string, any> = new Map();
}

// generated/steps/api-steps.ts
export async function givenAuthenticatedUser(ctx: APITestContext, role: string) {
  const response = await ctx.apiClient.post('/auth/login', {
    username: getRoleAccount(role).email,
    password: 'test-password'
  });
  ctx.auth.setToken(response.token);
}

export async function whenUserCallsEndpoint(ctx: APITestContext, method: string, path: string) {
  try {
    ctx.lastResponse = await ctx.apiClient[method.toLowerCase()](path);
  } catch (err) {
    ctx.lastResponse = err.response;
  }
}

export async function thenResponseStatusShouldBe(ctx: APITestContext, code: string) {
  expect(ctx.lastResponse.status).toBe(parseInt(code));
}
```

**Phase 2**: Create feature templates (reusable)
```gherkin
# features/templates/crud.feature
Feature: CRUD Operations
  Scenario: Create resource with valid data
    Given user is authenticated as "admin"
    When user calls POST "{endpoint}" with valid data
    Then response status should be 201
    And response should have "id" field
    And database should have created record

  Scenario: List resources
    Given user is authenticated as "user"
    When user calls GET "{endpoint}"
    Then response status should be 200
    And response should be valid JSON array
```

**Phase 3**: Generate tests from templates
```bash
# Custom generator script
npx generate-tests \
  --from features/templates/crud.feature \
  --endpoints generated/canonical-endpoints.json \
  --output generated/tests/03-single/
```

**Phase 4**: Generated test file example
```typescript
// generated/tests/03-single/markets.test.ts (AUTO-GENERATED)
import { test, expect } from '@playwright/test';
import { APITestContext } from '../steps/context';
import * as apiSteps from '../steps/api-steps';

test.describe('Markets - CRUD Operations', () => {
  let ctx: APITestContext;

  test.beforeEach(async () => {
    ctx = new APITestContext();
  });

  test('Create market with valid data', async () => {
    await apiSteps.givenAuthenticatedUser(ctx, 'admin');
    await apiSteps.whenUserCallsEndpoint(ctx, 'POST', '/markets', {
      name: 'Tech Innovations',
      code: 'TECH'
    });
    await apiSteps.thenResponseStatusShouldBe(ctx, '201');
    // ... more assertions
  });

  test.afterAll(async () => {
    await apiSteps.cleanup(ctx);
  });
});
```

---

## 7. Unresolved Questions

1. **Feature Template Maintainability**: How to version-control template features when OpenAPI spec changes? (Need automation to regenerate relevant features)

2. **Step Definition Scope**: Should steps support inline Gherkin data tables, or stick to simple parameters? (Impact on feature readability vs. complexity)

3. **AI Cost Trade-off**: Is one-time ~15K token investment for setup acceptable vs. recurring cost for runtime BDD? (Team preference needed)

4. **Cross-Project Reusability**: Can step definitions be extracted to shared npm package for other projects? (Requires standardization effort)

---

## Summary Table: Tools Comparison

| Criterion | playwright-bdd | cucumber-js | Static Gen |
|-----------|---|---|---|
| **Maintenance** | ✅ Active | ✅ Mature | Custom |
| **Token Cost** | ⚠️ Recurring | ⚠️ Recurring | ✅ One-time |
| **Test Speed** | ⚠️ +200-500ms | ⚠️ +200-500ms | ✅ Native |
| **IDE Support** | ⚠️ Feature files | ⚠️ Feature files | ✅ Full |
| **Debugging** | ⚠️ Indirect | ⚠️ Indirect | ✅ Direct |
| **BDD Feel** | ✅ Strong | ✅ Strong | ⚠️ Lost |
| **Learning Curve** | ✅ Gentle | ⚠️ Steep | ✅ Gentle |

**RECOMMENDATION**: Static code generation with reusable step library (best for API test systems with deterministic specs)
