# Phase 4: Slash Commands

**Priority**: Medium
**Status**: completed
**Effort**: Small
**Completed**: 2026-03-08
**Depends on**: Phase 3

## Context Links
- Existing commands: `.claude/commands/` (16 files)
- Run command pattern: `.claude/commands/run.md`
- Generate command pattern: `.claude/commands/generate-single.md`
- Generator module: `e2e/generator/generator.ts` (Phase 3)

## Overview

Create two slash commands: `/generate-e2e` and `/run-e2e`. These follow the existing command patterns in `.claude/commands/`. The generate command is the key integration point where the catalog handles matched steps and AI handles unmatched steps.

## Requirements

### Functional
- `/generate-e2e [feature]` — parse feature, match catalog, AI interprets unmatched, write .spec.ts
- `/run-e2e [feature]` — run Playwright tests, display results, suggest reports

### Non-functional
- Commands follow existing patterns (read config first, display progress, suggest next actions)
- Generate command clearly reports catalog match rate (token cost transparency)
- Run command supports flags: `--headed`, `--trace`, `--debug`

## Related Code Files

### Create
- `.claude/commands/generate-e2e.md`
- `.claude/commands/run-e2e.md`

### Modify
- `CLAUDE.md` — add E2E commands to workflow section

## Implementation Steps

### 1. Create generate-e2e.md

```markdown
Sinh E2E test từ feature file. Argument optional: feature name (vd: /generate-e2e login).

Pre-check:
1. Verify e2e/ directory exists (if not → tell user: run /init or create e2e/ structure)
2. Verify config/e2e.config.json exists
3. Read config/e2e.config.json, config/api.config.json, config/auth.config.json

If argument provided:
  → Parse e2e/features/{argument}.feature only
If no argument:
  → Parse ALL .feature files in e2e/features/

For EACH .feature file:
1. Read the feature file
2. Parse Gherkin: extract Feature name, Scenarios, Given/When/Then steps
3. Read e2e/steps/catalog.ts to understand available step patterns
4. Match each step against the catalog:
   - MATCHED → use catalog's code template (NO AI needed)
   - UNMATCHED → AI interprets step text and generates Playwright code

5. Generate complete .spec.ts file:
   - Import block (playwright, config, helpers as needed)
   - test.describe from Feature name
   - test.beforeEach from Background (if any)
   - Individual test() blocks from Scenarios
   - Scenario Outline expanded with Examples data

6. Write to e2e/generated/{feature-name}.spec.ts

7. Display generation summary:
   - Total steps processed
   - Catalog-matched steps (no AI cost)
   - AI-interpreted steps (token cost)
   - Match rate percentage
   - Suggest adding frequent custom steps to catalog

After generation:
- Suggest: "🎭 Run tests: /run-e2e {feature}"
- Suggest: "📋 View catalog: cat e2e/steps/catalog.ts"
- If match rate < 50%: "💡 Consider adding common steps to catalog to reduce AI cost"

IMPORTANT RULES:
- Read the step catalog FIRST before interpreting any steps
- For matched steps, use EXACTLY the catalog's code template
- For unmatched steps, generate Playwright code following project patterns
- Use e2e.config.json selectorStrategy for element selectors
- Use e2e.config.json pages map for page navigation
- API steps must use existing api-client.ts and auth-helper.ts
- Generated code must pass TypeScript compilation
```

### 2. Create run-e2e.md

```markdown
Chạy E2E tests. Argument optional: feature name hoặc flags.

Ví dụ:
- /run-e2e → chạy tất cả E2E tests
- /run-e2e login → chỉ chạy login feature
- /run-e2e --headed → chạy với browser visible
- /run-e2e --trace → chạy với trace recording
- /run-e2e --debug → chạy với Playwright Inspector

Execution:
1. Read config/e2e.config.json for browser/viewport settings
2. Build playwright command:
   - Base: npx playwright test --config=e2e/playwright.config.ts
   - If feature specified: --grep "{feature}"
   - If --headed: add --headed
   - If --trace: add --trace on
   - If --debug: add --debug
3. Run command and capture output
4. Display realtime progress
5. After completion: summary table (passed/failed/skipped/duration)

After test execution:
- Display quick summary (passed/failed/skipped counts)
- If failures: "💡 View trace: npx playwright show-trace e2e/test-results/{test}/trace.zip"
- If failures: "💡 View report: npx playwright show-report"
- Suggest: "📊 Generate reports: /report"
```

### 3. Update CLAUDE.md workflow section

Add to the workflow commands list:
```
/generate-e2e [feature]  → parse .feature, match catalog, AI for unmatched, output .spec.ts
/run-e2e [feature|flags] → chạy E2E tests qua Playwright
```

Add to project structure:
```
e2e/              ← E2E testing module (Playwright + Gherkin)
  features/           QC writes .feature files here
  steps/              step definition catalog
  generated/          AI-generated Playwright specs
  pages/              Page Object Models (optional)
  playwright.config.ts
```

## Todo List
- [x] Create `.claude/commands/generate-e2e.md`
- [x] Create `.claude/commands/run-e2e.md`
- [x] Update `CLAUDE.md` workflow section with E2E commands
- [x] Update `CLAUDE.md` project structure with e2e/ directory
- [x] Test: `/generate-e2e` with no features → appropriate message
- [x] Test: `/run-e2e` with no generated specs → appropriate message

## Success Criteria
- `/generate-e2e login` parses `e2e/features/login.feature` and generates `e2e/generated/login.spec.ts`
- Generation summary shows catalog match rate
- `/run-e2e` executes Playwright tests and displays results
- `/run-e2e --headed` opens visible browser
- Commands follow existing project patterns (Vietnamese output when QC uses Vietnamese)

## Risk Assessment
- **No feature files**: QC runs `/generate-e2e` before writing any `.feature` files.
  - Mitigation: Clear error message with instructions to create feature files.
- **AI generates invalid Playwright code for unmatched steps**: Complex steps may produce broken code.
  - Mitigation: Always run `tsc --noEmit` check after generation. Flag compilation errors.
