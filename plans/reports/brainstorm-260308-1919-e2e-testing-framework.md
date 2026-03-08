# Brainstorm: E2E Testing Framework

**Date**: 2026-03-08
**Status**: Agreed
**Branch**: project/upmount

---

## Problem Statement

Current system covers 7 API test layers (smoke → db-integrity) but lacks browser-based E2E testing. Need a generic framework where QC writes human-readable Gherkin scenarios, AI generates Playwright test code ONE TIME, then QC runs tests directly without AI (zero runtime token cost).

## Requirements

- QC writes `.feature` files (Gherkin Given/When/Then)
- AI reads features once → generates `.spec.ts` Playwright code
- Both UI (browser) + API steps in same scenario
- Step definition catalog for common actions (reduces AI tokens)
- Free-form custom steps for complex assertions (AI interprets)
- Generic: works with any web app, not just Upmount
- Reports merge into existing `reports/` infrastructure

---

## Evaluated Approaches

### Approach 1: Runtime BDD (playwright-bdd)
**Verdict: Rejected**

- Pros: Lower initial setup (9K tokens), active ecosystem, standard BDD runtime
- Cons: 200-500ms overhead per scenario, recurring token cost on every feature change (~500-1K tokens), poor debugging (indirect stack traces), no full TypeScript intellisense

### Approach 2: Layer 08 inside Vitest
**Verdict: Rejected**

- Pros: Single `npx vitest run`, consistent slash commands
- Cons: Loses Playwright's native trace viewer/video/screenshots, browser tests slow down API suite, Vitest+Playwright integration not native

### Approach 3: Separate Module + Static Code Generation
**Verdict: Chosen**

- Pros: Playwright native runner (best debugging), clean separation from API tests, one-time AI cost, native speed, full TS intellisense, generic framework
- Cons: Two test runners (vitest + playwright), slightly more setup
- Token cost: ~12-15K initial, then ~200 tokens per new endpoint (approaches zero as catalog grows)

---

## Final Solution: Gherkin → Static Playwright Code Generation

### Architecture

```
api-test-system/
├── config/                         ← SHARED
│   ├── api.config.json             ← baseUrl, auth tokens
│   ├── auth.config.json            ← roles, accounts
│   └── e2e.config.json             ← NEW: app URL, browser, selectors
├── generated/                      ← API tests (layers 01-07)
├── e2e/                            ← NEW: E2E module
│   ├── features/                   ← QC writes here
│   │   └── login.feature
│   ├── steps/                      ← Step definition catalog
│   │   ├── catalog.ts              ← Central registry
│   │   ├── navigation.steps.ts     ← "I navigate to {page}"
│   │   ├── form.steps.ts           ← "I fill {field} with {value}"
│   │   ├── assertion.steps.ts      ← "I should see {text}"
│   │   └── api.steps.ts            ← "API: POST {endpoint} returns {status}"
│   ├── generated/                  ← AI-generated specs
│   │   └── login.spec.ts
│   ├── pages/                      ← Page Object Models (optional)
│   │   └── login.page.ts
│   ├── playwright.config.ts
│   └── tsconfig.json
├── reports/                        ← SHARED: E2E results merge here
└── package.json                    ← Add @playwright/test
```

### Generation Flow

```
QC writes feature → /generate-e2e → AI reads → generates .spec.ts → QC runs npx playwright test

Detail:
1. Parse .feature (gherkin npm package)
2. Match steps vs catalog (regex)
3. Matched → direct code gen (NO AI, $0)
4. Unmatched → send to AI with page context (~200-500 tokens per step)
5. Output: e2e/generated/*.spec.ts
6. Run: npx playwright test (FREE forever)
```

### Token Cost Model

| Phase | Tokens | Frequency |
|-------|--------|-----------|
| Step catalog creation | 3,000 | One-time |
| Feature templates | 5,000 | One-time |
| Generator script | 2,000 | One-time |
| Per-endpoint custom steps | 200 | Per feature |
| Catalog-matched steps | 0 | Always free |
| Re-runs | 0 | Always free |

**Catalog growth flywheel**: Session 1 → 60% catalog match. Session 5 → 90% match. Session 10+ → ~100% match. AI cost approaches zero over time.

### Step Definition Catalog (Pre-built)

**Navigation**:
- `Given I am on the "{page}" page`
- `When I navigate to "{url}"`
- `Then the URL should contain "{path}"`

**Forms**:
- `When I fill "{field}" with "{value}"`
- `When I clear "{field}"`
- `When I select "{option}" from "{dropdown}"`
- `When I check "{checkbox}"`
- `When I upload "{file}" to "{input}"`

**Actions**:
- `When I click "{element}"`
- `When I click button "{text}"`
- `When I press "{key}"`
- `When I wait {seconds} seconds`

**Assertions**:
- `Then I should see "{text}"`
- `Then I should not see "{text}"`
- `Then element "{selector}" should be visible`
- `Then element "{selector}" should be disabled`
- `Then element "{selector}" should contain "{text}"`

**API (hybrid)**:
- `Given API: user "{role}" is authenticated`
- `When API: {method} "{endpoint}" with data`
- `Then API: response status should be {code}`
- `Given API: create "{resource}" with factory data`

**Data**:
- `Given I save "{value}" as "{variable}"`
- `Then variable "{name}" should equal "{expected}"`

### Hybrid UI+API Pattern

```gherkin
Feature: KYC Verification
  Scenario: User submits KYC and admin reviews
    # API setup (fast, no browser)
    Given API: user "owner" is authenticated
    And API: create "kyc-document" with factory data

    # UI journey (browser)
    Given I am on the "kyc/status" page
    Then I should see "Pending Review"
    And element "#submit-btn" should be disabled

    # API verification (fast, deterministic)
    Then API: GET "/api/kyc/status" returns 200
    And API: response should contain "status" with value "pending"
```

**Performance**: API setup/verify = 0.1-0.2s vs UI-only = 2-6s per step. 7x faster.

### Config: e2e.config.json

```json
{
  "appUrl": "https://app.upmount.sotatek.works",
  "browser": "chromium",
  "headless": true,
  "viewport": { "width": 1280, "height": 720 },
  "timeout": 30000,
  "selectorStrategy": "data-testid",
  "screenshots": "on-failure",
  "video": "retain-on-failure",
  "tracing": "retain-on-failure",
  "pages": {
    "login": "/auth/login",
    "dashboard": "/dashboard",
    "kyc/status": "/kyc/status",
    "vault/accounts": "/vault/accounts"
  }
}
```

### Slash Command: /generate-e2e

```
/generate-e2e [feature]  → Parse feature, match catalog, AI for unmatched, output .spec.ts
/run-e2e [feature]       → npx playwright test [feature]
/run-e2e --headed        → Visual mode for debugging
/run-e2e --trace         → Generate trace for debugging
```

---

## Implementation Considerations

### Dependencies to Add
- `@playwright/test` — test runner + browser automation
- `@cucumber/gherkin` — .feature file parser
- `@cucumber/messages` — Gherkin AST types

### What We Reuse
- `config/api.config.json` → baseUrl for API steps
- `config/auth.config.json` → tokens/roles for auth steps
- `generated/helpers/api-client.ts` → HTTP client for API steps
- `generated/helpers/test-data-factory.ts` → faker data for API setup
- `reports/` → merge E2E results

### What's New
- `e2e/` directory structure
- Step definition catalog (TypeScript)
- Feature-to-code generator script
- Playwright config
- E2E-specific slash commands
- `e2e.config.json`

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Catalog doesn't cover QC's steps | Medium | Free-form fallback to AI + grow catalog |
| Playwright version breaking changes | Low | Pin version, update quarterly |
| Complex UI flows hard to express in Gherkin | Medium | Page Objects + custom step composites |
| Generated code needs manual tweaks | Low | Allow `// @manual` marker to skip regen |
| Selector strategy varies per app | Medium | Configurable via e2e.config.json |

## Success Metrics

1. **Token efficiency**: >70% steps resolved by catalog (no AI) after 5 sessions
2. **Execution speed**: Hybrid tests 5x faster than UI-only equivalent
3. **QC adoption**: QC can write + run features without AI assistance after onboarding
4. **Re-run cost**: $0 token cost for running existing tests
5. **Generic**: Framework works on 2+ different web apps without code changes

## Next Steps

1. Create implementation plan with `/plan`
2. Phase 1: Step catalog + generator script
3. Phase 2: Playwright config + e2e.config.json
4. Phase 3: Slash commands (/generate-e2e, /run-e2e)
5. Phase 4: Sample features for Upmount + validation

---

## Unresolved Questions

1. Should generated `.spec.ts` files be git-tracked or gitignored? (Tracking = easier review, Ignoring = cleaner diffs)
2. Page Object Models: generate from app or manual? If app has consistent `data-testid`, auto-discovery possible
3. Should the catalog be project-specific or shared across all projects using this framework?
4. How to handle authentication flows that require browser (OAuth redirects, CAPTCHA)?
