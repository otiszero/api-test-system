# API Test System - Architecture & State Machine

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Slash Commands State Machine](#2-slash-commands-state-machine)
3. [Test Layers & Dependencies](#3-test-layers--dependencies)
4. [E2E Testing Module](#4-e2e-testing-module)
5. [Evidence Collection Flow](#5-evidence-collection-flow)
6. [Anti-Hallucination System](#6-anti-hallucination-system)
7. [Command Quick Reference](#7-command-quick-reference)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              API TEST SYSTEM ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER LAYER                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                           SLASH COMMANDS (Claude Code)                            │   │
│  │  /init → /assess → /analyze → /generate-* → /run → /report → /view-report        │   │
│  │  /generate-e2e [feature] → /run-e2e [feature] (E2E Testing)                      │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CONFIGURATION LAYER                                      │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────────┐   │
│  │ api.config  │ │ auth.config  │ │ db.config   │ │ test-rules   │ │ openapi.yaml  │   │
│  │ .json       │ │ .json        │ │ .json       │ │ .md          │ │               │   │
│  │             │ │              │ │             │ │              │ │               │   │
│  │ • baseUrl   │ │ • type       │ │ • enabled   │ │ • business   │ │ • endpoints   │   │
│  │ • timeout   │ │ • roles      │ │ • host:port │ │   rules      │ │ • schemas     │   │
│  │ • headers   │ │ • accounts   │ │ • database  │ │ • permission │ │ • security    │   │
│  │ • filters   │ │ • tokens     │ │ • username  │ │   matrix     │ │ • parameters  │   │
│  └─────────────┘ └──────────────┘ └─────────────┘ │ • scenarios  │ └───────────────┘   │
│       config/         config/         config/     │ • states     │      input/         │
│                                                   └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              GENERATION LAYER (AI-generated)                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           CANONICAL ENDPOINTS                                    │    │
│  │              generated/canonical-endpoints.json (SOURCE OF TRUTH)                │    │
│  │    • Extracted from OpenAPI • Filtered by blacklist • isTestable flag           │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                               │
│  ┌──────────────────────────┐           │           ┌───────────────────────────────┐  │
│  │       HELPERS            │           │           │         TEST FILES            │  │
│  │ generated/helpers/       │           │           │    generated/tests/           │  │
│  │                          │           │           │                               │  │
│  │ • api-client.ts          │◀──────────┴──────────▶│ 01-smoke/smoke.test.ts       │  │
│  │ • auth-helper.ts         │                       │ 02-contract/contract.test.ts │  │
│  │ • db-client.ts           │    Uses canonical     │ 03-single/{resource}.test.ts │  │
│  │ • schema-validator.ts    │    endpoints to       │ 04-integration/*.test.ts     │  │
│  │ • test-data-factory.ts   │    generate tests     │ 05-rbac/rbac.test.ts         │  │
│  │ • evidence-store.ts      │                       │ 06-security/security.test.ts │  │
│  │ • cleanup.ts             │                       │ 07-db/db-*.test.ts           │  │
│  └──────────────────────────┘                       └───────────────────────────────┘  │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │  ARTIFACTS: test-plan.md, dependency-graph.json                                  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXECUTION LAYER (Vitest)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                            vitest.setup.ts                                       │    │
│  │  • beforeEach: Set test context, clear evidence                                  │    │
│  │  • afterEach: Collect evidence from api-client                                   │    │
│  │  • afterAll: Save evidence.json + Generate detailed-evidence.html               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         RUNTIME DATA FLOW                                        │    │
│  │                                                                                   │    │
│  │   Test File ──▶ api-client.get() ──▶ Record Evidence ──▶ evidence-store         │    │
│  │       │              │                    │                    │                 │    │
│  │       │              ▼                    ▼                    ▼                 │    │
│  │       │         HTTP Request         • method               Save to             │    │
│  │       │         to API Server        • url                  JSON file           │    │
│  │       │              │               • headers                                   │    │
│  │       │              ▼               • body                                      │    │
│  │       │         Response             • response                                  │    │
│  │       │              │               • duration                                  │    │
│  │       ▼              ▼               • curl command                             │    │
│  │    Assertions   Return to test                                                   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                REPORTING LAYER                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              reports/                                            │    │
│  │                                                                                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────────┐  │    │
│  │  │ latest-report.md │  │ bugs-found.md    │  │ detailed-evidence.html        │  │    │
│  │  │                  │  │                  │  │                               │  │    │
│  │  │ • Summary stats  │  │ • BUG-001...008  │  │ • Curl commands               │  │    │
│  │  │ • Layer results  │  │ • Severity       │  │ • Request/Response            │  │    │
│  │  │ • Failures       │  │ • Steps repro    │  │ • Copy button                 │  │    │
│  │  │ • Recommendations│  │ • Expected/Actual│  │ • Grouped by test             │  │    │
│  │  └──────────────────┘  └──────────────────┘  └───────────────────────────────┘  │    │
│  │                                                                                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────────┐  │    │
│  │  │ coverage-matrix  │  │ ai-summary.md    │  │ html/index.html (Vitest)      │  │    │
│  │  │ .md              │  │                  │  │                               │  │    │
│  │  │ • Endpoint ×     │  │ • AI patterns    │  │ • Interactive dashboard       │  │    │
│  │  │   Layer matrix   │  │ • Risk areas     │  │ • Filter pass/fail            │  │    │
│  │  │ • ✅❌— symbols  │  │ • Priority fixes │  │ • Stack traces                │  │    │
│  │  └──────────────────┘  └──────────────────┘  └───────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Slash Commands State Machine

```
                                    ┌─────────────┐
                                    │   START     │
                                    └──────┬──────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │       /init            │
                              │  Setup project         │
                              │  Create config         │
                              │  templates             │
                              └───────────┬────────────┘
                                          │
                           ┌──────────────┼──────────────┐
                           │              │              │
                           ▼              ▼              ▼
                    ┌───────────┐  ┌───────────┐  ┌───────────┐
                    │ QC fills  │  │ QC fills  │  │ QC fills  │
                    │ api.config│  │auth.config│  │test-rules │
                    └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                          └──────────────┼──────────────┘
                                         │
                                         ▼
                              ┌────────────────────────┐
                              │       /assess          │
                              │  Check readiness       │
                              │  Score: 0-60 points    │
                              └───────────┬────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                     Score < 40                      Score ≥ 40
                          │                               │
                          ▼                               ▼
                   ┌──────────────┐           ┌────────────────────────┐
                   │ Warning!     │           │       /analyze         │
                   │ Fill configs │           │  Parse OpenAPI         │
                   │ first        │           │  Extract endpoints     │
                   └──────┬───────┘           │  → canonical-endpoints │
                          │                   │  Build dependency      │
                          │                   │  graph                 │
                          ▼                   └───────────┬────────────┘
                   Back to config                         │
                                                          ▼
                              ┌────────────────────────────────────────────────────┐
                              │                    /generate-*                      │
                              │                                                     │
                              │  ┌─────────────────────────────────────────────┐   │
                              │  │              /generate-all                   │   │
                              │  │   Runs all generators in order:              │   │
                              │  │   smoke → contract → single → integration    │   │
                              │  │   → rbac → security → db                     │   │
                              │  └─────────────────────────────────────────────┘   │
                              │                        OR                           │
                              │  ┌─────────────────────────────────────────────┐   │
                              │  │         Individual generators                │   │
                              │  │                                              │   │
                              │  │  /generate-smoke     → 01-smoke/*.test.ts   │   │
                              │  │  /generate-contract  → 02-contract/*.ts     │   │
                              │  │  /generate-single    → 03-single/*.ts       │   │
                              │  │  /generate-integration → 04-integration/*.ts│   │
                              │  │  /generate-rbac      → 05-rbac/*.test.ts    │   │
                              │  │  /generate-security  → 06-security/*.ts     │   │
                              │  │  /generate-db        → 07-db/*.test.ts      │   │
                              │  └─────────────────────────────────────────────┘   │
                              │                                                     │
                              │  ⚠️ ALL MUST READ canonical-endpoints.json FIRST   │
                              └───────────────────────┬────────────────────────────┘
                                                      │
                                                      ▼
                              ┌────────────────────────────────────────────────────┐
                              │                      /run                           │
                              │                                                     │
                              │  /run              → All layers                     │
                              │  /run smoke        → Only 01-smoke                  │
                              │  /run single       → Only 03-single                 │
                              │  /run single users → Only 03-single/users.test.ts  │
                              │                                                     │
                              │  ┌─────────────────────────────────────────────┐   │
                              │  │              EXECUTION FLOW                  │   │
                              │  │                                              │   │
                              │  │   vitest.setup.ts                           │   │
                              │  │        │                                     │   │
                              │  │        ▼                                     │   │
                              │  │   beforeEach() → Set test context           │   │
                              │  │        │                                     │   │
                              │  │        ▼                                     │   │
                              │  │   Run test → api-client records evidence    │   │
                              │  │        │                                     │   │
                              │  │        ▼                                     │   │
                              │  │   afterEach() → Collect evidence            │   │
                              │  │        │                                     │   │
                              │  │        ▼                                     │   │
                              │  │   afterAll() → Save JSON + Generate HTML    │   │
                              │  └─────────────────────────────────────────────┘   │
                              └───────────────────────┬────────────────────────────┘
                                                      │
                          ┌───────────────────────────┴───────────────────────────┐
                          │                                                       │
                     All Pass                                              Has Failures
                          │                                                       │
                          ▼                                                       ▼
                   ┌──────────────┐                           ┌────────────────────────┐
                   │   Done!      │                           │       /report          │
                   │   Ship it    │                           │                        │
                   └──────────────┘                           │  Generate:             │
                                                              │  • latest-report.md    │
                                                              │  • bugs-found.md       │
                                                              │  • coverage-matrix.md  │
                                                              │  • ai-summary.md       │
                                                              └───────────┬────────────┘
                                                                          │
                                                                          ▼
                              ┌────────────────────────────────────────────────────┐
                              │                  /view-report                       │
                              │                                                     │
                              │  /view-report              → latest-report.md      │
                              │  /view-report assessment   → assessment-report.md  │
                              │  /view-report bugs         → bugs-found.md         │
                              │  /view-report coverage     → coverage-matrix.md    │
                              │  /view-report bugs markets → filter by resource    │
                              └───────────────────────┬────────────────────────────┘
                                                      │
                                                      ▼
                              ┌────────────────────────────────────────────────────┐
                              │                  /list-reports                      │
                              │  Show all available reports with metadata          │
                              └────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
                              ┌────────────────────────────────────────────────────┐
                              │                  /coverage                          │
                              │  Show endpoint × layer matrix (no test run needed) │
                              └────────────────────────────────────────────────────┘
```

---

## 3. Test Layers & Dependencies

| Layer | Hard Deps (BLOCKING) | Soft Deps (REDUCE COVERAGE) | Output |
|-------|---------------------|----------------------------|--------|
| 🟢 **01-SMOKE** | openapi.yaml | api-config, auth-config | smoke.test.ts |
| 🔵 **02-CONTRACT** | openapi.yaml | api-config, auth-config | contract.test.ts |
| 🟡 **03-SINGLE** | openapi.yaml, api-config | auth-config, test-rules, db-config | {resource}.test.ts |
| 🟠 **04-INTEGRATION** | openapi.yaml, api-config, **test-rules.md** | auth-config, db-config | integration*.test.ts |
| 🔐 **05-RBAC** | openapi.yaml, auth-config (2+ roles, 2+ accounts) | test-rules/permission-matrix | rbac.test.ts |
| ⚫ **06-SECURITY** | openapi.yaml, api-config | auth-config, test-rules | security.test.ts |
| 🟣 **07-DB** | **db-config** (enabled: true) | openapi, db-schema, test-rules | db-*.test.ts |

### Layer Descriptions

| Layer | Purpose | What It Tests |
|-------|---------|--------------|
| **Smoke** | Quick health check | "Is API alive?" - Basic connectivity |
| **Contract** | Schema validation | "Response matches OpenAPI spec?" |
| **Single** | Individual endpoints | CRUD operations, validation, error handling |
| **Integration** | Multi-endpoint flows | Business scenarios, workflows |
| **RBAC** | Permission tests | Role-based access, IDOR protection |
| **Security** | Security tests | Auth bypass, token validation, injection |
| **DB** | Data integrity | FK constraints, orphan records, data consistency |

---

## 4. E2E Testing Module

E2E testing uses Playwright for browser automation + Gherkin for human-readable test scenarios.

### Workflow Overview

```
   e2e/features/my-flow.feature       e2e/generated/my-flow.spec.ts
   ┌────────────────────────┐         ┌────────────────────────┐
   │ Feature: Login Flow    │  Step 1 │ Auto-generated from    │  Step 2
   │   Background:          │────────▶ catalog + AI patterns  ├──────┐
   │     Given I am on...   │         └────────────────────────┘      │
   │   Scenario: Successful │                                         │
   │     When I fill...     │         Playwright Engine               │
   │     Then I should...   │         ┌────────────────────────┐      │
   └────────────────────────┘         │ Page Object Models     │◀─────┘
                                      │ Browser Automation     │
                                      │ API Interceptors       │
                                      │ Evidence Collection    │
                                      └─────────┬──────────────┘
                                                 │
                                                 ▼
                                      Test Results + Artifacts
```

### Architecture Components

#### 1. Feature Files (`e2e/features/*.feature`)
QC writes human-readable test scenarios in Gherkin format (Given/When/Then). Examples:
- `login.feature` — Login workflows
- `vault-management.feature` — Vault UI operations
- `kyc-submission.feature` — KYC form submission
- `health-check.feature` — Health + status checks

#### 2. Step Catalog (`e2e/steps/catalog.ts`)
Pre-built step definitions. Using them costs ZERO AI tokens during generation:

```
Navigation:    "I am on the {page} page", "the URL should contain {text}"
Form:          "I fill {field} with {value}", "I select {option} from {field}"
Actions:       "I click {element}", "I wait {N} seconds"
Assertions:    "I should see {text}", "{element} should be visible"
API:           "API: user {role} is authenticated", "API: GET {endpoint} returns {code}"
Data:          "I save {value} as {variable}"
```

#### 3. Generator (`e2e/generator/`)
- **feature-parser.ts** — Parses .feature files (Gherkin parser)
- **code-emitter.ts** — Converts parsed steps → Playwright test code
- **generator.ts** — Orchestrates parsing + emission + file writing

Generation Flow:
```
1. /generate-e2e feature-name
   ├─ Read e2e/features/feature-name.feature
   ├─ Parse Gherkin syntax
   ├─ Match steps to catalog
   ├─ For unmatched steps → AI interprets + generates Playwright code
   ├─ Emit e2e/generated/feature-name.spec.ts
   └─ Output: ready-to-run Playwright test

2. After generation, NO AI needed for test execution
   └─ Run via /run-e2e or npm run e2e
```

#### 4. Generated Tests (`e2e/generated/*.spec.ts`)
Pure Playwright code. Generated once, runs many times:

```typescript
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
  });

  test('should login successfully', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'owner@test.com');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
```

#### 5. Hybrid UI + API Testing
E2E tests can mix browser steps and API steps:

```gherkin
Scenario: Submit order and verify via API
  Given I am on the "dashboard" page
  When I click "place-order-btn"
  And I wait for "#order-modal" to be visible
  Then I should see "Order Created"
  And API: GET "/orders" returns 200
  And API: response should contain "status"
```

This allows:
- UI flow validation (user journey)
- API verification (data correctness)
- Combined regression testing in one scenario

#### 6. Configuration (`config/e2e.config.json`)
Maps page names to URLs:

```json
{
  "baseUrl": "http://localhost:3000",
  "pages": {
    "login": "/auth/login",
    "dashboard": "/dashboard",
    "kyc": "/kyb",
    "vault": "/vaults"
  },
  "selectors": {
    "email": "[data-testid='email']",
    "password": "[data-testid='password']"
  }
}
```

### Command Reference

| Command | Purpose |
|---------|---------|
| `/generate-e2e` | Generate tests from all .feature files |
| `/generate-e2e login` | Generate from specific feature (e2e/features/login.feature) |
| `/run-e2e` | Run all E2E tests headless |
| `/run-e2e login` | Run specific feature |
| `/run-e2e login --headed` | Run with visible browser |
| `/run-e2e login --debug` | Run with Playwright Inspector |
| `/run-e2e login --trace` | Record trace for debugging failed tests |

### Files & Structure

```
e2e/
├── features/                # QC writes here (.feature files)
│   ├── login.feature
│   ├── kyc-submission.feature
│   ├── vault-management.feature
│   └── health-check.feature
│
├── steps/                   # Step definitions + catalog
│   ├── catalog.ts           # Pre-built step patterns
│   ├── assertion.steps.ts   # Assertion step implementations
│   ├── form.steps.ts        # Form interaction steps
│   ├── navigation.steps.ts  # Navigation steps
│   ├── api.steps.ts         # API integration steps
│   └── types.ts             # TypeScript types
│
├── generator/               # Code generation
│   ├── feature-parser.ts    # Gherkin parser
│   ├── code-emitter.ts      # Playwright code generation
│   └── generator.ts         # Orchestrator
│
├── generated/               # AI-generated test files
│   ├── login.spec.ts
│   ├── kyc-submission.spec.ts
│   ├── vault-management.spec.ts
│   └── health-check.spec.ts
│
├── playwright.config.ts     # Playwright configuration
├── QC-GUIDE.md              # Quick-start guide for QC
└── test-results/            # Test execution artifacts
    └── traces, videos, etc.
```

### Step Matching Logic

Generation uses a smart matching algorithm:

```
1. Exact Match → Use catalog step directly (zero cost)
2. Fuzzy Match → Find similar catalog step, adapt parameters
3. No Match → AI interprets and generates Playwright code (token cost)
```

Example:
- `I fill "email" with "test@test.com"` → Exact match (catalog) → Zero cost
- `I click the login button` → Fuzzy match to `I click button "{text}"` → Zero cost
- `I drag item-1 to trash-bin` → No match → AI generates drag logic → Token cost

### Integration with API Tests

E2E tests and API tests complement each other:

```
API Tests (Vitest)           E2E Tests (Playwright)
├─ Fast                      ├─ Slow
├─ No UI                     ├─ Full UI + browser
├─ Endpoint coverage         ├─ User journey coverage
├─ Schema validation         ├─ Visual regression
└─ Works offline             └─ Real browser rendering
```

Use both:
- API tests: Quick regression, CI/CD pipeline
- E2E tests: Critical user flows, before major releases

---

## 5. Evidence Collection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         EVIDENCE COLLECTION ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

   Test File (*.test.ts)
         │
         │  it('should return markets', async () => {
         │    const response = await apiClient.get('/markets');
         │    expect(response.status).toBe(200);
         │  });
         │
         ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                              api-client.ts                                       │
   │                                                                                  │
   │   async get(url: string) {                                                      │
   │     const startTime = Date.now();                                               │
   │     const response = await this.client.get(url);                                │
   │                                                                                  │
   │     // ⭐ Record evidence for EVERY request                                     │
   │     this.recordEvidence({                                                        │
   │       method: 'GET',                                                            │
   │       url: '/markets',                                                          │
   │       fullUrl: 'https://api.foreon.network/markets',                           │
   │       headers: { Authorization: 'Bearer ...' },                                 │
   │       response: { status: 200, body: {...} },                                   │
   │       duration: Date.now() - startTime,                                         │
   │       curl: 'curl -X GET "https://..." -H "..."',  ◀── Auto-generated          │
   │     });                                                                          │
   │                                                                                  │
   │     this.allEvidence.push(evidence);  ◀── Stored in memory                     │
   │     return response;                                                             │
   │   }                                                                              │
   └─────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                                             ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                            vitest.setup.ts                                       │
   │                                                                                  │
   │   beforeEach((context) => {                                                     │
   │     currentTestName = context.task.name;        // "should return markets"      │
   │     currentSuiteName = context.task.suite.name; // "Markets API Tests"          │
   │     evidenceStore.setCurrentTest(currentTestName, currentSuiteName);            │
   │     apiClient.clearEvidence();                  // Reset for new test           │
   │   });                                                                            │
   │                                                                                  │
   │   afterEach(() => {                                                             │
   │     const requests = apiClient.getAllEvidence();                                │
   │     for (const req of requests) {                                               │
   │       evidenceStore.addEvidence({               // ⭐ Link to test context      │
   │         ...req,                                                                  │
   │         testName: currentTestName,                                              │
   │         testSuite: currentSuiteName,                                            │
   │       });                                                                        │
   │     }                                                                            │
   │   });                                                                            │
   │                                                                                  │
   │   afterAll(() => {                                                              │
   │     evidenceStore.save();           // → reports/evidence.json                  │
   │     generateDetailedReport();       // → reports/detailed-evidence.html         │
   │   });                                                                            │
   └─────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                                             ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                                OUTPUT FILES                                      │
   │                                                                                  │
   │   reports/evidence.json              reports/detailed-evidence.html             │
   │   [                                  ┌─────────────────────────────────┐        │
   │     {                                │ Test: should return markets     │        │
   │       "testName": "...",             │ Suite: Markets API Tests        │        │
   │       "testSuite": "...",            ├─────────────────────────────────┤        │
   │       "method": "GET",               │ GET /markets          200  212ms│        │
   │       "url": "...",                  ├─────────────────────────────────┤        │
   │       "responseStatus": 200,         │ Response: { "code": 200, ... }  │        │
   │       "curl": "curl -X ...",         ├─────────────────────────────────┤        │
   │       ...                            │ curl -X GET "https://..."       │        │
   │     }                                │ [Copy Curl]                     │        │
   │   ]                                  └─────────────────────────────────┘        │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Anti-Hallucination System

### Problem
AI có thể "hallucinate" endpoints không tồn tại dựa trên patterns phổ biến:
- ❌ `/markets/new-markets` (không tồn tại, thực tế là `/markets/proposed`)
- ❌ `/markets/popular-markets` (không tồn tại, thực tế là `/markets/favorites`)

### Solution

```
   input/openapi.yaml                    generated/canonical-endpoints.json
   ┌──────────────────────┐              ┌──────────────────────────────────┐
   │ paths:               │              │ {                                │
   │   /markets:          │   Extract    │   "metadata": {                  │
   │     get: ...         │ ──────────▶  │     "totalEndpoints": 68,        │
   │   /markets/proposed: │              │     "testableEndpoints": 42      │
   │     get: ...         │              │   },                             │
   │   /markets/favorites:│              │   "endpoints": [                 │
   │     get: ...         │              │     {                            │
   └──────────────────────┘              │       "path": "/markets/proposed"│
                                         │       "isTestable": true         │
                                         │     }                            │
                                         │   ]                              │
                                         │ }                                │
                                         └──────────────────────────────────┘
                                                        │
                                                        │ /generate-* MUST read
                                                        │ this file FIRST
                                                        ▼
                                         ┌──────────────────────────────────┐
                                         │ GENERATE COMMAND FLOW            │
                                         │                                  │
                                         │ 1. Check canonical file exists   │
                                         │ 2. Read canonical-endpoints.json │
                                         │ 3. Filter: isTestable === true   │
                                         │ 4. Generate tests ONLY for       │
                                         │    filtered endpoints            │
                                         │                                  │
                                         │ ⚠️ NEVER add endpoints not in    │
                                         │    this list                     │
                                         └──────────────────────────────────┘
```

### Workflow
1. **`/analyze`** → Runs `npm run extract-endpoints` → Creates `canonical-endpoints.json`
2. **`/generate-*`** → Reads canonical file → Only generates for listed endpoints
3. **No assumptions** → If endpoint not in list, it doesn't exist

---

## 7. Command Quick Reference

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/init` | Setup project | - | config templates, package.json |
| `/assess` | Check readiness | config/* | score 0-60, action items |
| `/analyze` | Parse OpenAPI | openapi.yaml | canonical-endpoints.json, test-plan.md |
| `/generate-all` | Generate all tests | canonical-endpoints | generated/tests/*/*.ts |
| `/generate-smoke` | Quick health tests | canonical-endpoints | 01-smoke/smoke.test.ts |
| `/generate-contract` | Schema tests | canonical-endpoints | 02-contract/*.ts |
| `/generate-single` | CRUD tests | canonical-endpoints | 03-single/*.ts |
| `/generate-integration` | Flow tests | canonical-endpoints + test-rules | 04-integration/*.ts |
| `/generate-rbac` | Permission tests | canonical-endpoints + auth-config | 05-rbac/*.ts |
| `/generate-security` | Security tests | canonical-endpoints | 06-security/*.ts |
| `/generate-db` | DB integrity tests | db-config | 07-db/*.ts |
| `/generate-e2e` | Generate E2E tests | e2e/features/*.feature | e2e/generated/*.spec.ts |
| `/generate-e2e [feature]` | Generate specific E2E | e2e/features/[feature].feature | e2e/generated/[feature].spec.ts |
| `/run [layer]` | Execute API tests | generated/tests | vitest results + evidence |
| `/run-e2e` | Execute all E2E tests | e2e/generated/ | Playwright results + traces |
| `/run-e2e [feature]` | Execute specific E2E | e2e/generated/[feature].spec.ts | test results |
| `/run-e2e [feature] --headed` | Run E2E with visible browser | e2e/generated/ | interactive test session |
| `/report` | Generate reports | test results | reports/*.md |
| `/view-report [type]` | Display report | reports/ | formatted output |
| `/list-reports` | List all reports | reports/ | metadata table |
| `/coverage` | Coverage matrix | generated/tests | endpoint × layer matrix |

---

## File Structure

```
api-test-system/
├── config/                          # QC fills these
│   ├── api.config.json              # baseUrl, timeout, headers, filters
│   ├── auth.config.json             # type, roles, accounts
│   ├── db.config.json               # enabled, connection settings
│   ├── e2e.config.json              # E2E page URLs and selectors
│   └── test-rules.md                # business rules, permission matrix
│
├── input/                           # Source of truth
│   └── openapi.yaml                 # API specification
│
├── generated/                       # AI-generated (don't edit manually)
│   ├── canonical-endpoints.json     # SOURCE OF TRUTH for endpoints
│   ├── test-plan.md                 # Generated test plan
│   ├── dependency-graph.json        # Resource dependencies
│   ├── helpers/                     # Shared utilities
│   │   ├── api-client.ts            # HTTP client + evidence recording
│   │   ├── auth-helper.ts           # Authentication helpers
│   │   ├── db-client.ts             # Database client
│   │   ├── evidence-store.ts        # Evidence collection
│   │   ├── schema-validator.ts      # OpenAPI schema validation
│   │   ├── test-data-factory.ts     # Faker-based test data
│   │   └── cleanup.ts               # Test data cleanup
│   └── tests/                       # Test files by layer
│       ├── 01-smoke/
│       ├── 02-contract/
│       ├── 03-single/
│       ├── 04-integration/
│       ├── 05-rbac/
│       ├── 06-security/
│       └── 07-db/
│
├── e2e/                             # E2E Testing Module (Playwright + Gherkin)
│   ├── features/                    # QC writes Gherkin feature files here
│   │   ├── login.feature
│   │   ├── kyc-submission.feature
│   │   ├── vault-management.feature
│   │   └── health-check.feature
│   ├── steps/                       # Step definitions + catalog
│   │   ├── catalog.ts               # Pre-built step patterns (zero-cost)
│   │   ├── assertion.steps.ts       # Assertion steps
│   │   ├── form.steps.ts            # Form interaction steps
│   │   ├── navigation.steps.ts      # Navigation steps
│   │   ├── api.steps.ts             # API integration steps
│   │   └── types.ts                 # TypeScript types
│   ├── generator/                   # Code generation
│   │   ├── feature-parser.ts        # Gherkin parser
│   │   ├── code-emitter.ts          # Playwright code generation
│   │   └── generator.ts             # Orchestrator
│   ├── generated/                   # AI-generated Playwright specs
│   │   ├── login.spec.ts
│   │   ├── kyc-submission.spec.ts
│   │   ├── vault-management.spec.ts
│   │   └── health-check.spec.ts
│   ├── playwright.config.ts         # Playwright configuration
│   ├── QC-GUIDE.md                  # E2E quick-start guide
│   └── test-results/                # Test artifacts (traces, videos)
│
├── reports/                         # Generated reports
│   ├── latest-report.md             # Summary
│   ├── bugs-found.md                # Bug reports
│   ├── coverage-matrix.md           # Coverage
│   ├── detailed-evidence.html       # Request/response evidence
│   ├── evidence.json                # Raw evidence data
│   └── html/                        # Vitest HTML report
│
├── scripts/
│   └── extract-endpoints.ts         # Canonical endpoint extraction
│
├── vitest.config.ts                 # Vitest configuration
├── vitest.setup.ts                  # Evidence collection hooks
├── CLAUDE.md                        # Project instructions
└── package.json                     # Dependencies
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | API test runner |
| **TypeScript** | Type safety |
| **Axios** | HTTP client |
| **AJV** | JSON Schema validation |
| **Faker.js** | Realistic test data |
| **pg/mysql2/mongodb** | Database clients |
| **Playwright** | Browser automation for E2E tests |
| **@cucumber/gherkin** | Gherkin feature file parsing |

---

*Generated: 2026-03-02*
