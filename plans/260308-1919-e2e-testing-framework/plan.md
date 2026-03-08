# E2E Testing Framework — Implementation Plan

**Created**: 2026-03-08
**Status**: completed
**Branch**: project/upmount
**Completed**: 2026-03-08
**Brainstorm**: `plans/reports/brainstorm-260308-1919-e2e-testing-framework.md`

---

## Overview

Add Gherkin-based E2E testing to api-test-system. QC writes `.feature` files, AI generates static Playwright `.spec.ts` code once, QC runs tests without AI. Separate module linked to existing config/reports infra.

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 1 | Project Setup & Config | High | completed | `phase-01-project-setup.md` |
| 2 | Step Definition Catalog | High | completed | `phase-02-step-catalog.md` |
| 3 | Feature Parser & Code Generator | High | completed | `phase-03-feature-parser-generator.md` |
| 4 | Slash Commands | Medium | completed | `phase-04-slash-commands.md` |
| 5 | Sample Features & Validation | Medium | completed | `phase-05-sample-features-validation.md` |

## Key Dependencies

- Phase 2 depends on Phase 1 (needs Playwright + tsconfig)
- Phase 3 depends on Phase 2 (generator maps steps to catalog)
- Phase 4 depends on Phase 3 (commands invoke generator + runner)
- Phase 5 depends on Phase 4 (uses commands to generate + run)

## Architecture

```
e2e/
├── features/               ← QC writes .feature files
├── steps/                  ← Step definition catalog (pre-built)
│   ├── catalog.ts          ← Central step registry + matcher
│   ├── navigation.steps.ts
│   ├── form.steps.ts
│   ├── assertion.steps.ts
│   └── api.steps.ts
├── generated/              ← AI-generated Playwright specs
├── pages/                  ← Page Object Models (optional)
├── playwright.config.ts
└── tsconfig.json
```

## Token Cost Strategy

- Catalog steps → $0 (regex match, direct code gen)
- Custom steps → ~200-500 tokens per step (AI interprets once)
- Re-runs → $0 (static generated code)
- Catalog grows over time → AI cost approaches zero
