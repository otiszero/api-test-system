# Phase 3: Feature Parser & Code Generator

**Priority**: High
**Status**: completed
**Effort**: Large
**Completed**: 2026-03-08
**Depends on**: Phase 2

## Context Links
- Step catalog: `phase-02-step-catalog.md`
- Existing extract-endpoints script pattern: `scripts/extract-endpoints.ts`
- Gherkin package: `@cucumber/gherkin` + `@cucumber/messages`

## Overview

Build the script that parses `.feature` files and generates static Playwright `.spec.ts` files. This is the core engine: catalog-matched steps become code directly (zero AI), unmatched steps are flagged for AI interpretation during `/generate-e2e`.

The generator script itself is NOT the slash command — it's a TypeScript module that the slash command (Phase 4) invokes. The generator handles parsing + catalog matching + code emission. The slash command handles AI fallback for unmatched steps.

## Requirements

### Functional
- Parse `.feature` files using `@cucumber/gherkin`
- Extract Feature name, Scenario names, Given/When/Then steps
- Support `Scenario Outline` with `Examples` table expansion
- Support data tables within steps
- Match each step against catalog (Phase 2)
- Emit complete `.spec.ts` file with imports, test.describe, test blocks
- Report unmatched steps (for AI fallback in slash command)
- Support `Background` blocks (shared setup across scenarios)
- Support `@tags` for filtering (e.g., `@smoke`, `@api-only`)

### Non-functional
- Generator is a pure function: input = feature AST + catalog → output = TypeScript code string
- No side effects during generation (file writing is caller's responsibility)
- Deterministic output: same feature always produces same code
- Generated code uses Playwright best practices (auto-wait, locator assertions)

## Architecture

```
scripts/
└── generate-e2e.ts              ← Generator script (run via tsx)

e2e/
├── generator/
│   ├── feature-parser.ts        ← Parse .feature → structured AST
│   ├── code-emitter.ts          ← AST + step matches → .spec.ts code
│   └── generator.ts             ← Orchestrator: parse → match → emit
```

## Related Code Files

### Create
- `e2e/generator/feature-parser.ts` — Gherkin parsing + AST extraction
- `e2e/generator/code-emitter.ts` — TypeScript code generation
- `e2e/generator/generator.ts` — Orchestrator module

### Modify
- `package.json` — add `generate-e2e` script

### Reference
- `e2e/steps/catalog.ts` — step matching (Phase 2)
- `scripts/extract-endpoints.ts` — pattern for tsx scripts

## Implementation Steps

### 1. Create feature-parser.ts

Parse a `.feature` file into a simplified AST:

```typescript
export interface ParsedFeature {
  name: string;
  description: string;
  tags: string[];
  background?: ParsedBackground;
  scenarios: ParsedScenario[];
}

export interface ParsedBackground {
  steps: ParsedStep[];
}

export interface ParsedScenario {
  name: string;
  tags: string[];
  steps: ParsedStep[];
  examples?: ParsedExamples[];  // For Scenario Outline
}

export interface ParsedStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;                 // Raw step text
  dataTable?: string[][];       // Optional data table
}

export interface ParsedExamples {
  name: string;
  headers: string[];
  rows: string[][];
}
```

Use `@cucumber/gherkin` GherkinDocument parser:
```typescript
import { GherkinStreams } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
```

Handle `Scenario Outline` by expanding each `Examples` row into a concrete scenario with `<placeholder>` replaced by values.

### 2. Create code-emitter.ts

Takes parsed feature + step catalog matches → emits TypeScript code.

**Generated file structure:**
```typescript
// Auto-generated from: features/login.feature
// Generated at: 2026-03-08T12:00:00Z
// DO NOT EDIT — regenerate with /generate-e2e login

import { test, expect } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json';
import { apiClient } from '../../generated/helpers/api-client';
import { authHelper } from '../../generated/helpers/auth-helper';
import { testDataFactory } from '../../generated/helpers/test-data-factory';

// Context for cross-step data sharing
const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };

test.describe('Feature: Login Flow', () => {

  // Background (runs before each test)
  test.beforeEach(async ({ page }) => {
    await page.goto(e2eConfig.pages['login']);
  });

  test('Scenario: Successful login with valid credentials', async ({ page }) => {
    await page.locator('[data-testid="email"]').fill('user@example.com');
    await page.locator('[data-testid="password"]').fill('SecurePass123');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page).toHaveURL(new RegExp('/dashboard'));
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  // ... more scenarios
});
```

**Key emitter responsibilities:**
- Import block: always include Playwright + config. Conditionally include api-client/auth-helper if API steps present
- `test.describe` wrapping from Feature name
- `test.beforeEach` from Background block
- Individual `test()` blocks from each Scenario
- Step code from catalog `generateCode()` output
- Unmatched steps: emit `// TODO: [AI] {step text}` placeholder comment
- `@api-only` tag → skip `{ page }` fixture, use `test()` without page

### 3. Create generator.ts

Orchestrator:

```typescript
export interface GeneratorResult {
  featureName: string;
  outputPath: string;
  totalSteps: number;
  matchedSteps: number;
  unmatchedSteps: UnmatchedStep[];
  generatedCode: string;
}

export interface UnmatchedStep {
  scenarioName: string;
  stepText: string;
  keyword: string;
  lineNumber: number;
}
```

Flow:
1. Read `.feature` file
2. Parse with feature-parser → `ParsedFeature`
3. For each step, call `catalog.matchStep(stepText)` → `StepMatch`
4. Pass matched results to code-emitter → TypeScript string
5. Return `GeneratorResult` with stats + unmatched list
6. Caller (slash command) decides: write file or send unmatched to AI

### 4. Handle Scenario Outline expansion

```gherkin
Scenario Outline: Login with <case>
  When I fill "email" with "<email>"
  And I fill "password" with "<password>"
  And I click button "Login"
  Then I should see "<message>"

  Examples:
    | case          | email              | password    | message     |
    | valid creds   | user@example.com   | Pass123!    | Welcome     |
    | wrong password| user@example.com   | wrong       | Invalid     |
    | empty email   |                    | Pass123!    | Required    |
```

Generator expands into 3 separate `test()` blocks with concrete values substituted.

### 5. Handle data tables

```gherkin
When I fill the form with:
  | field    | value            |
  | email    | user@example.com |
  | password | Pass123!         |
```

Emitter generates:
```typescript
await page.locator('[data-testid="email"]').fill('user@example.com');
await page.locator('[data-testid="password"]').fill('Pass123!');
```

### 6. Add npm script

```json
{
  "scripts": {
    "generate-e2e": "tsx e2e/generator/generator.ts"
  }
}
```

This script is for direct CLI use. The slash command (Phase 4) invokes the generator module programmatically.

## Todo List
- [x] Create feature-parser.ts with Gherkin parsing
- [x] Handle Scenario Outline expansion with Examples
- [x] Handle Background blocks
- [x] Handle data tables in steps
- [x] Handle @tags extraction
- [x] Create code-emitter.ts with TypeScript generation
- [x] Emit proper imports (conditional on step types used)
- [x] Emit test.describe + test blocks
- [x] Emit `// TODO: [AI]` for unmatched steps
- [x] Create generator.ts orchestrator
- [x] Return GeneratorResult with matched/unmatched stats
- [x] Add npm script
- [x] Test: parse a sample .feature → verify AST structure
- [x] Test: emit code from fully-matched feature → verify valid TypeScript
- [x] Test: partially-matched feature → verify TODO comments for unmatched

## Success Criteria
- Parse any valid `.feature` file without errors
- Scenario Outline correctly expands with Examples data
- Background steps appear in `test.beforeEach`
- 100% catalog-matched feature → valid `.spec.ts` that passes `tsc --noEmit`
- Partially-matched feature → valid `.spec.ts` with clear `// TODO: [AI]` markers
- GeneratorResult accurately reports matched vs unmatched counts
- Deterministic: same input always produces same output

## Risk Assessment
- **Gherkin parser API changes**: `@cucumber/gherkin` may have breaking changes.
  - Mitigation: Pin exact version. Parser is isolated in feature-parser.ts.
- **Complex step text**: Steps with special characters or nested quotes may break regex.
  - Mitigation: Catalog uses non-greedy capture groups. Test with edge cases.
- **Large feature files**: Feature with 50+ scenarios could generate huge spec files.
  - Mitigation: One spec file per feature file. Playwright handles large files fine.
