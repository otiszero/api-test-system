# E2E Natural Language → Feature + Suite Injection

## Status: DRAFT

## Problem

1. **QCs unfamiliar with Gherkin** can't write `.feature` files — they know what to test but not the template syntax
2. **Repetitive prerequisite steps** (login, navigate, setup data) are duplicated across features — no reuse mechanism

## Solution

Two features added to the E2E module:

### Feature 1: `/describe-e2e` — Natural Language → .feature file

QC writes plain Vietnamese/English describing test scenarios. AI converts to valid Gherkin `.feature` file with maximum catalog step matching.

```
Input:  "Đăng nhập với tài khoản hợp lệ, kiểm tra dashboard hiện đúng"
Output: e2e/features/login-valid.feature (valid Gherkin, catalog-optimized)
```

### Feature 2: Suite Injection via `@needs` tag + `suites.config.json`

Reusable prerequisite suites defined in config. Features declare dependencies via `@needs(suite-name)` tags. Generator auto-injects prerequisite steps.

```gherkin
@needs(login-owner)
Feature: Dashboard
  Scenario: View dashboard
    Then I should see "Dashboard"
```

The generator sees `@needs(login-owner)`, looks up the suite, and injects login steps into Background automatically.

## Phases

| # | Phase | Status | Files |
|---|-------|--------|-------|
| 1 | Suite config + injection engine | pending | [phase-01](phase-01-suite-injection.md) |
| 2 | Natural language → .feature converter | pending | [phase-02](phase-02-natural-language-converter.md) |
| 3 | Slash command + QC guide update | pending | [phase-03](phase-03-commands-and-docs.md) |

## Key Decisions

- **Suite injection at generation time** (not runtime) — zero cost after first generate
- **`@needs` tag** over Background import — stays valid Gherkin syntax
- **AI conversion uses catalog** to maximize match rate — outputs catalog-optimized steps
- **Suites are composable** — `@needs(login-owner, navigate-dashboard)` chains multiple
- **Vietnamese + English** supported in natural language input

## Dependencies

- Existing: `e2e/steps/catalog.ts`, `e2e/generator/`, `config/e2e.config.json`
- New: `config/suites.config.json`, `e2e/generator/suite-injector.ts`
