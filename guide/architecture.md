# API Test System - Architecture & State Machine

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Slash Commands State Machine](#2-slash-commands-state-machine)
3. [Test Layers & Dependencies](#3-test-layers--dependencies)
4. [Evidence Collection Flow](#4-evidence-collection-flow)
5. [Anti-Hallucination System](#5-anti-hallucination-system)
6. [Command Quick Reference](#6-command-quick-reference)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              API TEST SYSTEM ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER LAYER                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           SLASH COMMANDS (Claude Code)                           │    │
│  │  /init → /assess → /analyze → /generate-* → /run → /report → /view-report       │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
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

## 4. Evidence Collection Flow

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

## 5. Anti-Hallucination System

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

## 6. Command Quick Reference

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
| `/run [layer]` | Execute tests | generated/tests | vitest results + evidence |
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
└── package.json                     # Dependencies
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner |
| **TypeScript** | Type safety |
| **Axios** | HTTP client |
| **AJV** | JSON Schema validation |
| **Faker.js** | Realistic test data |
| **pg/mysql2/mongodb** | Database clients |

---

*Generated: 2026-03-02*
