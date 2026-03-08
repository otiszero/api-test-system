# Phase 2: Step Definition Catalog

**Priority**: High
**Status**: completed
**Effort**: Medium
**Completed**: 2026-03-08
**Depends on**: Phase 1

## Context Links
- Brainstorm step catalog: `plans/reports/brainstorm-260308-1919-e2e-testing-framework.md` (lines 105-140)
- Existing api-client: `generated/helpers/api-client.ts`
- Existing auth-helper: `generated/helpers/auth-helper.ts`
- Existing test-data-factory: `generated/helpers/test-data-factory.ts`

## Overview

Build the pre-built step definition library — the core token cost optimization. Each catalog step maps a Gherkin pattern to a Playwright code snippet via regex. Generator (Phase 3) uses this to emit code WITHOUT AI for matched steps.

## Key Insight

This is NOT runtime step execution. Steps are **code templates** that the generator uses to emit static TypeScript. The catalog is consumed at generation time, not test runtime.

## Requirements

### Functional
- Central catalog registry mapping Gherkin patterns → code template functions
- Navigation steps: page routing, URL assertions
- Form steps: fill, clear, select, check, upload
- Action steps: click, press, wait
- Assertion steps: text visibility, element state, content
- API hybrid steps: authenticate, HTTP calls, response assertions
- Data steps: variable storage, cross-step data passing

### Non-functional
- Each step pattern uses `{param}` placeholders converted to regex capture groups
- Step matcher returns: matched (boolean), function name, extracted args
- Catalog is the SINGLE SOURCE of step-to-code mappings
- Steps reuse existing helpers (api-client, auth-helper, test-data-factory)

## Architecture

```
e2e/steps/
├── catalog.ts               ← Central registry + pattern matcher
├── navigation.steps.ts      ← Page navigation code templates
├── form.steps.ts             ← Form interaction code templates
├── assertion.steps.ts        ← UI assertion code templates
├── api.steps.ts              ← API hybrid code templates (reuses existing helpers)
└── types.ts                  ← Shared types (StepMatch, StepTemplate, etc.)
```

## Related Code Files

### Create
- `e2e/steps/types.ts`
- `e2e/steps/catalog.ts`
- `e2e/steps/navigation.steps.ts`
- `e2e/steps/form.steps.ts`
- `e2e/steps/assertion.steps.ts`
- `e2e/steps/api.steps.ts`

### Reference (read-only, reuse patterns)
- `generated/helpers/api-client.ts` — HTTP methods, evidence recording
- `generated/helpers/auth-helper.ts` — token management, role switching
- `generated/helpers/test-data-factory.ts` — faker data factories

## Implementation Steps

### 1. Create types.ts

```typescript
// Core types for step catalog system

export interface StepTemplate {
  pattern: string;        // Gherkin pattern: 'I am on the "{page}" page'
  regex: RegExp;          // Compiled regex with capture groups
  params: string[];       // Parameter names: ['page']
  category: string;       // 'navigation' | 'form' | 'assertion' | 'action' | 'api' | 'data'
  generateCode: (args: string[]) => string;  // Emits Playwright TS code
}

export interface StepMatch {
  matched: boolean;
  template?: StepTemplate;
  args?: string[];        // Extracted values from regex groups
  code?: string;          // Generated code line
}
```

### 2. Create catalog.ts

Central registry. Key methods:
- `registerStep(pattern, category, generateCode)` — add step to catalog
- `matchStep(stepText)` → `StepMatch` — find matching template + extract args
- `getAllSteps()` → list all registered patterns (for QC reference)
- `getUnmatchedSteps(steps[])` → steps needing AI interpretation

Pattern-to-regex conversion: `{param}` → `"([^"]*)"` for quoted, `(\d+)` for numbers.

### 3. Create navigation.steps.ts

| Gherkin Pattern | Generated Playwright Code |
|----------------|--------------------------|
| `I am on the "{page}" page` | `await page.goto(e2eConfig.pages['{page}']);` |
| `I navigate to "{url}"` | `await page.goto('{url}');` |
| `the URL should contain "{path}"` | `await expect(page).toHaveURL(new RegExp('{path}'));` |
| `the URL should be "{url}"` | `await expect(page).toHaveURL('{url}');` |
| `I go back` | `await page.goBack();` |
| `I refresh the page` | `await page.reload();` |

### 4. Create form.steps.ts

| Gherkin Pattern | Generated Playwright Code |
|----------------|--------------------------|
| `I fill "{field}" with "{value}"` | `await page.locator('[data-testid="{field}"]').fill('{value}');` |
| `I clear "{field}"` | `await page.locator('[data-testid="{field}"]').clear();` |
| `I select "{option}" from "{dropdown}"` | `await page.locator('[data-testid="{dropdown}"]').selectOption('{option}');` |
| `I check "{checkbox}"` | `await page.locator('[data-testid="{checkbox}"]').check();` |
| `I uncheck "{checkbox}"` | `await page.locator('[data-testid="{checkbox}"]').uncheck();` |
| `I upload "{file}" to "{input}"` | `await page.locator('[data-testid="{input}"]').setInputFiles('{file}');` |

Note: Selector strategy configurable via `e2e.config.json` → `selectorStrategy`. Default: `data-testid`. Generator replaces `[data-testid="X"]` with configured strategy.

### 5. Create assertion.steps.ts

| Gherkin Pattern | Generated Playwright Code |
|----------------|--------------------------|
| `I should see "{text}"` | `await expect(page.getByText('{text}')).toBeVisible();` |
| `I should not see "{text}"` | `await expect(page.getByText('{text}')).not.toBeVisible();` |
| `element "{selector}" should be visible` | `await expect(page.locator('{selector}')).toBeVisible();` |
| `element "{selector}" should be disabled` | `await expect(page.locator('{selector}')).toBeDisabled();` |
| `element "{selector}" should be enabled` | `await expect(page.locator('{selector}')).toBeEnabled();` |
| `element "{selector}" should contain "{text}"` | `await expect(page.locator('{selector}')).toContainText('{text}');` |
| `element "{selector}" should have value "{value}"` | `await expect(page.locator('{selector}')).toHaveValue('{value}');` |
| `the page title should be "{title}"` | `await expect(page).toHaveTitle('{title}');` |
| `I should see {count} "{selector}" elements` | `await expect(page.locator('{selector}')).toHaveCount({count});` |

### 6. Create api.steps.ts

These steps generate code that uses existing `api-client.ts` and `auth-helper.ts`. No browser needed.

| Gherkin Pattern | Generated Code |
|----------------|----------------|
| `API: user "{role}" is authenticated` | `authHelper.setAuthToken('{role}');` |
| `API: {method} "{endpoint}" returns {code}` | `const resp = await apiClient.{method}('{endpoint}'); expect(resp.status).toBe({code});` |
| `API: {method} "{endpoint}" with data returns {code}` | `const resp = await apiClient.{method}('{endpoint}', testData); expect(resp.status).toBe({code});` |
| `API: response should contain "{field}"` | `expect(lastApiResponse.data).toHaveProperty('{field}');` |
| `API: response "{field}" should equal "{value}"` | `expect(lastApiResponse.data.{field}).toBe('{value}');` |
| `API: create "{resource}" with factory data` | `const testData = testDataFactory.create{Resource}Payload(); const resp = await apiClient.post('{endpoint}', testData);` |

### 7. Action steps (inside catalog.ts directly, small set)

| Gherkin Pattern | Generated Playwright Code |
|----------------|--------------------------|
| `I click "{element}"` | `await page.locator('[data-testid="{element}"]').click();` |
| `I click button "{text}"` | `await page.getByRole('button', { name: '{text}' }).click();` |
| `I click link "{text}"` | `await page.getByRole('link', { name: '{text}' }).click();` |
| `I press "{key}"` | `await page.keyboard.press('{key}');` |
| `I wait {seconds} seconds` | `await page.waitForTimeout({seconds} * 1000);` |
| `I wait for "{selector}" to be visible` | `await page.locator('{selector}').waitFor({ state: 'visible' });` |

### 8. Data steps (inside catalog.ts directly, small set)

| Gherkin Pattern | Generated Code |
|----------------|----------------|
| `I save "{value}" as "{variable}"` | `ctx.variables.set('{variable}', '{value}');` |
| `I save element "{selector}" text as "{variable}"` | `ctx.variables.set('{variable}', await page.locator('{selector}').textContent());` |
| `variable "{name}" should equal "{expected}"` | `expect(ctx.variables.get('{name}')).toBe('{expected}');` |

## Todo List
- [x] Create types.ts with StepTemplate and StepMatch interfaces
- [x] Create catalog.ts with registry, matcher, pattern-to-regex converter
- [x] Create navigation.steps.ts (6 step patterns)
- [x] Create form.steps.ts (6 step patterns)
- [x] Create assertion.steps.ts (9 step patterns)
- [x] Create api.steps.ts (6 step patterns)
- [x] Add action steps to catalog (6 patterns)
- [x] Add data steps to catalog (3 patterns)
- [x] Unit test: each pattern matches expected text + extracts correct args
- [x] Unit test: generateCode produces valid TypeScript for each step
- [x] Export convenience function: `printCatalog()` for QC reference

## Success Criteria
- ~36 pre-built step patterns covering navigation, forms, assertions, API, actions, data
- `matchStep("I am on the \"login\" page")` returns matched=true with args=["login"]
- `matchStep("some random text")` returns matched=false
- `getUnmatchedSteps([...])` correctly identifies steps needing AI
- Generated code from each step is valid Playwright TypeScript
- TypeScript compilation passes

## Risk Assessment
- **Selector strategy mismatch**: QC may use CSS selectors instead of data-testid.
  - Mitigation: Support both `[data-testid="X"]` and raw CSS via pattern detection.
- **Step pattern ambiguity**: "I click X" could match multiple patterns.
  - Mitigation: Longer/more specific patterns have priority. First match wins.
- **API steps coupled to existing helpers**: If api-client.ts changes, API steps break.
  - Mitigation: API steps import from `@helpers/api-client`, same as existing tests.
