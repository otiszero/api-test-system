# Phase 1: Project Setup & Config

**Priority**: High
**Status**: completed
**Effort**: Small
**Completed**: 2026-03-08

## Context Links
- Brainstorm: `plans/reports/brainstorm-260308-1919-e2e-testing-framework.md`
- Existing tsconfig: `tsconfig.json`
- Existing package.json: `package.json`

## Overview

Set up Playwright, e2e directory structure, config files, and TypeScript configuration. Foundation for all subsequent phases.

## Requirements

### Functional
- Install `@playwright/test`, `@cucumber/gherkin`, `@cucumber/messages`
- Create `e2e/` directory structure
- Create `config/e2e.config.json` template
- Create `e2e/playwright.config.ts` that reads from e2e.config.json
- Create `e2e/tsconfig.json` extending root tsconfig

### Non-functional
- Playwright config reads shared config (api.config.json, auth.config.json)
- Reports output to `reports/e2e/` (merged location)
- Browser binaries installed via `npx playwright install chromium`

## Related Code Files

### Modify
- `package.json` — add dependencies + e2e scripts
- `tsconfig.json` — add `e2e/**/*.ts` to include
- `.gitignore` — add e2e artifacts (test-results/, playwright-report/)

### Create
- `config/e2e.config.json` — E2E-specific config template
- `e2e/playwright.config.ts` — Playwright runner config
- `e2e/tsconfig.json` — E2E TypeScript config
- `e2e/features/.gitkeep` — QC feature directory placeholder
- `e2e/steps/.gitkeep` — step catalog directory placeholder
- `e2e/generated/.gitkeep` — generated specs directory placeholder
- `e2e/pages/.gitkeep` — page objects directory placeholder

## Implementation Steps

### 1. Install dependencies
```bash
npm install --save-dev @playwright/test @cucumber/gherkin @cucumber/messages
npx playwright install chromium
```

### 2. Create e2e.config.json
```json
{
  "_comment": "E2E config. appUrl = web app frontend URL (NOT API URL).",
  "appUrl": "https://app.example.com",
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
    "dashboard": "/dashboard"
  }
}
```

### 3. Create playwright.config.ts
Read `config/e2e.config.json` for baseURL, browser, viewport, timeout.
Read `config/api.config.json` for API baseUrl (used by API steps).
Output reports to `reports/e2e/`.
Set trace/screenshot/video per e2e config.

### 4. Create e2e/tsconfig.json
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": [],
    "paths": {
      "@helpers/*": ["../generated/helpers/*"],
      "@config/*": ["../config/*"],
      "@steps/*": ["./steps/*"],
      "@pages/*": ["./pages/*"]
    }
  },
  "include": ["./**/*.ts", "../generated/helpers/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. Add npm scripts to package.json
```json
{
  "scripts": {
    "e2e": "npx playwright test --config=e2e/playwright.config.ts",
    "e2e:headed": "npx playwright test --config=e2e/playwright.config.ts --headed",
    "e2e:debug": "npx playwright test --config=e2e/playwright.config.ts --debug",
    "e2e:trace": "npx playwright show-trace"
  }
}
```

### 6. Update .gitignore
```
# E2E artifacts
e2e/test-results/
e2e/playwright-report/
reports/e2e/
```

### 7. Create directory structure with .gitkeep files
```
e2e/features/.gitkeep
e2e/steps/.gitkeep
e2e/generated/.gitkeep
e2e/pages/.gitkeep
```

## Todo List
- [x] Install npm dependencies
- [x] Install Playwright browsers
- [x] Create e2e.config.json template
- [x] Create playwright.config.ts
- [x] Create e2e/tsconfig.json
- [x] Add npm scripts
- [x] Create directory structure
- [x] Update .gitignore
- [x] Verify `npx playwright test` runs (even with 0 tests)

## Success Criteria
- `npx playwright test --config=e2e/playwright.config.ts` runs without error
- `e2e.config.json` is readable and well-documented
- Directory structure matches architecture spec
- TypeScript compilation succeeds with `npx tsc --noEmit -p e2e/tsconfig.json`

## Risk Assessment
- **Playwright browser download**: Large (~150MB). May take time on slow connections.
  - Mitigation: Only install chromium, not all browsers.
- **TypeScript path resolution**: e2e/tsconfig.json must correctly resolve @helpers from parent.
  - Mitigation: Test imports manually before proceeding.
