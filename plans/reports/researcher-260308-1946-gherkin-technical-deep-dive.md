# Gherkin-to-Playwright Technical Reference

**Date**: 2026-03-08
**Audience**: Technical architects, implementation team

---

## Table of Contents

1. [Tool Landscape](#tool-landscape)
2. [Code Generation Patterns](#code-generation-patterns)
3. [Step Definition Architecture](#step-definition-architecture)
4. [Token Optimization](#token-optimization)
5. [Hybrid Testing Pattern](#hybrid-testing-pattern)
6. [Implementation Checklist](#implementation-checklist)

---

## Tool Landscape

### playwright-bdd (Runtime BDD)

**NPM Package**: `@playwright/bdd` or `playwright-bdd`
**Latest Status**: Actively maintained Q1 2026
**GitHub**: playwright-bdd/playwright-bdd

#### Architecture
```
Feature Files (.feature) + Step Definitions (.ts)
         ↓
   [playwright-bdd runner]
         ↓
   Vitest-compatible output
         ↓
   Test execution & reporting
```

#### Mechanics
- Parses `.feature` files at runtime using Gherkin parser
- Matches steps with TypeScript step definitions using regex patterns
- Executes steps within Playwright browser context
- Generates test report from execution results

#### Overhead Analysis
- **Parsing**: ~50ms per feature file
- **Step matching**: ~5-10ms per step
- **Per-scenario overhead**: 200-500ms total
- **Implication**: 100 scenarios = +50 seconds added to test run

#### When to Use
- Stakeholder-facing tests (non-technical audience)
- Rapid test iteration (modify features, not code)
- Multi-layer testing (UI + API in same feature)

#### When NOT to Use
- Performance-critical test suites (CI/CD time-sensitive)
- Deterministic API tests (don't benefit from BDD semantics)
- Large test suites (100+ scenarios)

---

### cucumber-js (General-Purpose BDD)

**NPM Package**: `@cucumber/cucumber`
**Latest Status**: Mature ecosystem, stable since 2023
**GitHub**: cucumber/cucumber-js
**Community**: Very large, many integrations available

#### Architecture
```
Feature Files (.feature)
       ↓
[Cucumber Parser] → Step Registry (JS/TS functions)
       ↓
[Step Executor] → World object (shared state)
       ↓
[Formatters] → Reports (HTML, JSON, Allure)
```

#### Key Differences from playwright-bdd
- Language-agnostic (not Playwright-specific)
- Requires adapter/glue code to integrate with Playwright
- More mature reporting ecosystem (Allure, HTML reporters)
- Steeper learning curve (more configuration needed)
- Better for cross-project step reusability

#### Overhead
- Similar to playwright-bdd (~200-500ms per scenario)
- Additional overhead from adapter layer (~100ms per scenario)
- **Total**: 300-600ms per scenario

#### When to Use
- Cross-project BDD framework (shared step definitions)
- Enterprise CI/CD integration (mature reporting)
- Multi-language teams (feature files in different languages)

#### When NOT to Use
- Playwright-first projects (unnecessary adapter layer)
- Token-cost-sensitive development (complex integration)
- Small teams (overkill infrastructure)

---

### Static Code Generation (Recommended for This Project)

**Approach**: Feature files → TypeScript compiler → Vitest-compatible test files

#### Architecture
```
Feature Files (.feature) + Step Catalog
       ↓
[Custom Generator] (200-300 lines TypeScript)
       ↓
Static Test Files (*.test.ts)
       ↓
[Native Vitest] → Execution & reporting
```

#### Mechanics
1. Parse feature files programmatically (use `gherkin` npm package)
2. Extract scenario names, steps, parameters
3. Map steps to step catalog (fail if step not found)
4. Generate TypeScript test code
5. Output as standard Vitest test file

#### Example Generator (Pseudocode)

```typescript
// scripts/generate-tests-from-features.ts
import { GherkinParser } from 'gherkin';

async function generateTest(featurePath: string): Promise<string> {
  const content = fs.readFileSync(featurePath, 'utf8');
  const doc = GherkinParser.parse(content);

  let testCode = `
import { test, expect } from '@playwright/test';
import { TestContext } from '../steps/context';
import * as steps from '../steps/index';

test.describe('${doc.feature.name}', () => {
  let ctx: TestContext;

  test.beforeEach(async () => {
    ctx = new TestContext();
  });
`;

  for (const scenario of doc.feature.children) {
    testCode += generateScenarioTest(scenario);
  }

  testCode += `
  test.afterAll(async () => {
    await steps.cleanup(ctx);
  });
});
`;

  return testCode;
}

function generateScenarioTest(scenario: Scenario): string {
  let testCode = `
  test('${scenario.name}', async () => {
`;

  for (const step of scenario.steps) {
    const [keyword, text] = step.text.split(' ', 1);
    const stepCall = mapStepToFunction(text);
    testCode += `    await ${stepCall};\n`;
  }

  testCode += `  });\n`;
  return testCode;
}
```

#### Advantages
- **Performance**: Native Vitest speed (no interpreter)
- **IDE Support**: Full TypeScript intellisense
- **Debugging**: Actual test code visible in stack traces
- **Token Cost**: One-time generation, then native execution
- **Version Control**: Generated code becomes reference documentation

#### Disadvantages
- **Regeneration**: Overwrites generated files (need careful management)
- **Customization**: Hard to add test-specific logic after generation
- **Maintenance**: Need script to track feature → code mapping
- **Learning Curve**: Team must understand both features AND generated code

#### When to Use
- ✅ API test systems (deterministic, fully specified)
- ✅ Token-cost-sensitive projects
- ✅ High-performance test suites (need fast feedback)
- ✅ Teams with strong TypeScript background

---

## Code Generation Patterns

### Pattern 1: Simple Feature → Test Mapping

```gherkin
# features/templates/auth.feature
Feature: Authentication
  Scenario: Login with valid credentials
    Given user is authenticated as "admin"
    When user calls GET "/auth/status"
    Then response status should be 200
    And response should contain "user_id"
```

**Generated Code**:
```typescript
test('Login with valid credentials', async () => {
  const ctx = new TestContext();
  await givenUserIsAuthenticated(ctx, 'admin');
  const result = await whenUserCalls(ctx, 'GET', '/auth/status');
  await thenResponseStatusShouldBe(ctx, 200);
  await thenResponseShouldContain(ctx, 'user_id');
});
```

### Pattern 2: Data-Driven Scenarios

```gherkin
# features/templates/validation.feature
Feature: Input Validation
  Scenario Outline: Create market with <field> validation
    Given user is authenticated as "admin"
    When user calls POST "/markets" with:
      | <field> | <value> |
    Then response status should be <status>

    Examples:
      | field | value | status |
      | name  | "Tech" | 201    |
      | name  | ""     | 400    |
      | code  | "ABC"  | 201    |
```

**Generated Code**:
```typescript
const testCases = [
  { field: 'name', value: 'Tech', status: 201 },
  { field: 'name', value: '', status: 400 },
  { field: 'code', value: 'ABC', status: 201 },
];

for (const tc of testCases) {
  test(`Create market with ${tc.field} validation`, async () => {
    const ctx = new TestContext();
    await givenUserIsAuthenticated(ctx, 'admin');
    const result = await whenUserCallsPOST(ctx, '/markets', {
      [tc.field]: tc.value
    });
    await thenResponseStatusShouldBe(ctx, tc.status);
  });
}
```

### Pattern 3: Step Definition Lookup

```typescript
// steps/catalog.ts - Single source of truth
const STEP_CATALOG = {
  'Given user is authenticated as {role}': givenUserIsAuthenticated,
  'When user calls {method} {path}': whenUserCalls,
  'Then response status should be {status}': thenResponseStatusShouldBe,
  'And response should contain {field}': thenResponseShouldContain,
};

export function lookupStep(stepText: string): StepFunction | null {
  for (const [pattern, impl] of Object.entries(STEP_CATALOG)) {
    const regex = convertPatternToRegex(pattern);
    const match = stepText.match(regex);
    if (match) {
      return { impl, args: match.slice(1) };
    }
  }
  return null;
}

// Generator uses this
function generateScenarioTest(scenario: Scenario): string {
  let code = '';
  for (const step of scenario.steps) {
    const lookup = lookupStep(step.text);
    if (!lookup) {
      throw new Error(`Step not found: "${step.text}"`);
    }
    code += generateStepCall(lookup.impl, lookup.args);
  }
  return code;
}
```

---

## Step Definition Architecture

### Recommended Structure

```
generated/steps/
├── index.ts                    # Main export
├── context.ts                  # Shared test context
├── catalog.ts                  # Step registry
├── api/
│   ├── api-client-steps.ts    # HTTP operations
│   ├── auth-steps.ts          # Authentication
│   └── validation-steps.ts    # Response validation
├── ui/
│   ├── navigation-steps.ts    # Page navigation (if needed)
│   ├── form-steps.ts          # Form interactions (if needed)
│   └── element-steps.ts       # Element assertions (if needed)
└── data/
    ├── test-data-factory.ts   # Data creation
    └── cleanup-steps.ts       # Teardown
```

### Context Design

```typescript
// steps/context.ts
export class TestContext {
  // HTTP client with automatic auth token injection
  apiClient: AxiosInstance;

  // Auth state management
  auth: {
    token?: string;
    role?: string;
    user?: { id: string; email: string };
  } = {};

  // Last HTTP response (for assertions)
  lastResponse?: {
    status: number;
    data: any;
    headers: any;
  };

  // Variable store (for cross-step data passing)
  variables: Map<string, any> = new Map();

  // Created resources (for cleanup)
  createdResources: Array<{
    type: string;
    id: string;
    endpoint: string;
  }> = [];

  // Test data factories
  factories = {
    market: () => ({ name: faker.commerce.department() }),
    user: () => ({ email: faker.internet.email() }),
  };

  constructor(baseURL: string, timeout: number = 5000) {
    this.apiClient = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Inject token automatically
    this.apiClient.interceptors.request.use((config) => {
      if (this.auth.token) {
        config.headers.Authorization = `Bearer ${this.auth.token}`;
      }
      return config;
    });
  }

  // Utility method for cleanup
  async deleteCreatedResources() {
    for (const resource of this.createdResources) {
      try {
        await this.apiClient.delete(`${resource.endpoint}/${resource.id}`);
      } catch (err) {
        console.warn(`Failed to delete ${resource.type} ${resource.id}`);
      }
    }
  }
}
```

### Step Definition Examples

```typescript
// steps/api/api-client-steps.ts

export async function givenUserIsAuthenticated(
  ctx: TestContext,
  role: string
) {
  const accountConfig = getAccountForRole(role);
  try {
    const response = await ctx.apiClient.post('/auth/login', {
      email: accountConfig.email,
      password: accountConfig.password,
    });
    ctx.auth.token = response.data.token;
    ctx.auth.role = role;
  } catch (err) {
    throw new Error(`Failed to authenticate as ${role}: ${err.message}`);
  }
}

export async function whenUserCalls(
  ctx: TestContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: any
) {
  try {
    ctx.lastResponse = await ctx.apiClient[method.toLowerCase()](path, data);
  } catch (err) {
    ctx.lastResponse = err.response || {
      status: 0,
      data: null,
      headers: {},
    };
  }
}

export function thenResponseStatusShouldBe(ctx: TestContext, code: number) {
  if (!ctx.lastResponse) {
    throw new Error('No response available');
  }
  expect(ctx.lastResponse.status).toBe(code);
}

export function thenResponseShouldContain(ctx: TestContext, field: string) {
  if (!ctx.lastResponse?.data) {
    throw new Error('No response data');
  }
  expect(ctx.lastResponse.data).toHaveProperty(field);
}
```

---

## Token Optimization

### Cost Breakdown (Full Suite Setup)

```
STATIC CODE GENERATION APPROACH
│
├─ Research & planning              500 tokens
├─ Step library design            1,000 tokens
├─ Feature templates              5,000 tokens ← Reusable
├─ Step implementations           3,000 tokens ← Reusable
├─ Generator script               2,000 tokens
└─ Integration & docs             1,000 tokens
                                 ─────────────
Total Initial Investment:        12,500 tokens

Per-Endpoint Addition:             200 tokens (customize template)
Regeneration Cost:                 500 tokens (if feature changes)
```

### Comparison to Runtime BDD

```
RUNTIME BDD APPROACH (playwright-bdd)
│
├─ Feature template setup         5,000 tokens
├─ Step library setup             3,000 tokens
└─ Integration                    1,000 tokens
                                 ─────────────
Initial Investment:               9,000 tokens ← Lower!

BUT: Every modification costs
├─ Feature change                  500 tokens (re-parse, re-match)
├─ Step logic change             1,000 tokens (debug, re-run)
├─ Step addition                   300 tokens

After ~10 modifications:          9,000 + 18,000 = 27,000 tokens ❌
```

### Token Optimization Checklist

- [ ] **Pre-write step catalog** before generating any tests
- [ ] **Use templates** instead of one-off feature files
- [ ] **Batch feature creation** (write 10 features at once, not 1 by 1)
- [ ] **Standardize step patterns** (no custom step logic per feature)
- [ ] **Generate once** then review/modify code, not regenerate
- [ ] **Reuse steps across layers** (smoke, contract, single use same steps)
- [ ] **Version-control generated code** (avoid regenerating same tests)

---

## Hybrid Testing Pattern

### Architecture Overview

```
┌─────────────────────────────────────┐
│  Single Test Context                │
│  ├─ apiClient (axios)              │
│  ├─ page (Playwright)              │
│  ├─ db (optional direct DB)        │
│  ├─ auth (token + role)            │
│  └─ variables (cross-step data)    │
└─────────────────────────────────────┘
         ↓              ↓              ↓
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │   API   │  │   UI    │  │   DB    │
    │  Setup  │  │ Journey │  │ Verify  │
    └─────────┘  └─────────┘  └─────────┘
```

### Use Case: Market Creation Flow

```typescript
// Test: User creates market via UI, verify via API

test('Create market and verify in listings', async () => {
  const ctx = new TestContext();

  // Step 1: API setup (fast, no UI)
  await givenUserIsAuthenticated(ctx, 'admin');

  // Step 2: UI journey (user-visible)
  await ctx.page.goto('/markets/create');
  await ctx.page.fill('#name', 'Tech Market');
  await ctx.page.fill('#code', 'TECH');
  await ctx.page.click('#submit');

  // Step 3: Capture created resource ID
  const url = ctx.page.url();
  const marketId = extractIdFromUrl(url);
  ctx.variables.set('market_id', marketId);

  // Step 4: API verification (fast, deterministic)
  const market = await ctx.apiClient.get(`/markets/${marketId}`);
  expect(market.data.status).toBe('active');
  expect(market.data.name).toBe('Tech Market');

  // Step 5: Cleanup
  await ctx.apiClient.delete(`/markets/${marketId}`);
});
```

### Performance Impact

```
UI-Only Approach:
├─ Navigate: 2s
├─ Fill forms: 1s
├─ Submit: 0.5s
├─ Wait for list load: 2s
├─ Search list: 1s
└─ Total: 6.5s per test × 100 tests = 650 seconds ❌

Hybrid Approach (API setup + UI verify + API cleanup):
├─ API setup: 0.2s
├─ UI navigation: 0.5s
├─ API verify: 0.1s
├─ Cleanup: 0.1s
└─ Total: 0.9s per test × 100 tests = 90 seconds ✅

Speedup: 7.2x faster!
```

---

## Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

- [ ] **Step Definition Library**
  - [ ] Create `context.ts` with shared state
  - [ ] Implement API client wrapper
  - [ ] Implement auth manager
  - [ ] Implement cleanup utilities

- [ ] **API Steps**
  - [ ] `Given user is authenticated as {role}`
  - [ ] `When user calls {method} {path}`
  - [ ] `When user calls {method} {path} with data`
  - [ ] `Then response status should be {code}`
  - [ ] `Then response should contain {field}`
  - [ ] `And variable {name} should equal {value}`

- [ ] **Auth Steps**
  - [ ] `Given user account exists for {role}`
  - [ ] `And user token is valid`
  - [ ] `And user can access {resource}`

### Phase 2: Generator (Week 3)

- [ ] **Feature Parser**
  - [ ] Parse .feature files using `gherkin` package
  - [ ] Extract scenarios with parameters
  - [ ] Handle Scenario Outline expansion

- [ ] **Code Generator**
  - [ ] Generate import statements
  - [ ] Generate test.describe block
  - [ ] Generate test cases
  - [ ] Generate step calls
  - [ ] Generate cleanup logic

- [ ] **Step Validation**
  - [ ] Check all steps exist in catalog
  - [ ] Report missing steps with context
  - [ ] Validate parameter types

- [ ] **Integration**
  - [ ] Add `npm run generate-tests` script
  - [ ] Output to `generated/tests/`
  - [ ] Skip existing tests (ask user)

### Phase 3: Feature Templates (Week 4)

- [ ] **CRUD Template** (`features/templates/crud.feature`)
  - [ ] Create resource
  - [ ] Read resource
  - [ ] Update resource
  - [ ] Delete resource
  - [ ] List resources

- [ ] **Error Scenarios Template** (`features/templates/error-scenarios.feature`)
  - [ ] 400 Bad Request
  - [ ] 401 Unauthorized
  - [ ] 403 Forbidden
  - [ ] 404 Not Found
  - [ ] 500 Server Error

- [ ] **Validation Template** (`features/templates/validation.feature`)
  - [ ] Required field missing
  - [ ] Invalid type
  - [ ] Constraint violation

- [ ] **Auth Template** (`features/templates/auth.feature`)
  - [ ] Login with valid credentials
  - [ ] Logout
  - [ ] Token refresh
  - [ ] Role-based access

### Phase 4: Scale & Optimize (Weeks 5+)

- [ ] **Generate Full Suite**
  - [ ] Apply templates to all 68 endpoints
  - [ ] Run generated tests
  - [ ] Fix failures

- [ ] **Performance Testing**
  - [ ] Measure test execution time
  - [ ] Optimize slow tests (use API where possible)
  - [ ] Parallel execution analysis

- [ ] **Documentation**
  - [ ] Document step library
  - [ ] Create feature writing guide
  - [ ] Train team on generator

---

## Summary

| Dimension | playwright-bdd | cucumber-js | **Static Gen** |
|-----------|---|---|---|
| **Maintenance** | Active | Mature | Custom |
| **Token Cost** | High (recurring) | High (recurring) | Low (one-time) |
| **Test Speed** | 200-500ms overhead | 300-600ms overhead | **Native** |
| **IDE Support** | Feature files | Feature files | **Full TS** |
| **Debugging** | Indirect | Indirect | **Direct** |
| **Setup Time** | 2-3 days | 3-5 days | **1-2 weeks** |
| **Maintenance Burden** | Low | Medium | **High** |

**Recommendation**: Static code generation for your API test system (deterministic, performance-critical, token-sensitive).
