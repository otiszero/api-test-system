# Phase 1: Suite Injection Engine

## Priority: HIGH
## Status: pending

## Overview

Define reusable prerequisite suites (login, navigate, setup) in config. Features declare `@needs(suite-name)` tags. Generator reads tags, injects suite steps into Background before emitting `.spec.ts`.

## Key Insights

- Current `Background:` in features duplicates login/navigation steps across many features
- Auth steps (`I login as "owner" with 2FA`) are 7+ lines of generated code — perfect reuse candidate
- `@needs` tag is valid Gherkin (custom tags are allowed) — no parser changes needed
- Injection happens in generator pipeline between parse and emit — clean insertion point

## Architecture

```
config/suites.config.json     ← Define reusable suites
       ↓
e2e/generator/suite-injector.ts  ← Read @needs tags, resolve suites, inject steps
       ↓
generator.ts (orchestrator)   ← Call injector after parse, before emit
```

### Suite Config Format

```json
{
  "suites": {
    "login-owner": {
      "description": "Login as owner with 2FA",
      "steps": [
        { "keyword": "Given", "text": "I login as \"owner\" with 2FA" }
      ]
    },
    "login-owner-no2fa": {
      "description": "Login as owner without 2FA",
      "steps": [
        { "keyword": "Given", "text": "I login as \"owner\"" }
      ]
    },
    "navigate-dashboard": {
      "description": "Navigate to dashboard page",
      "steps": [
        { "keyword": "Given", "text": "I am on the \"dashboard\" page" }
      ]
    },
    "logged-in-dashboard": {
      "description": "Login + navigate to dashboard",
      "needs": ["login-owner", "navigate-dashboard"]
    }
  }
}
```

Key properties:
- `steps[]` — array of `{ keyword, text }` matching catalog patterns
- `needs[]` — compose suites from other suites (recursive resolution with cycle detection)
- `description` — human-readable for QC reference

### @needs Tag Parsing

Feature files use `@needs(suite-name)` or `@needs(suite1, suite2)`:

```gherkin
@needs(login-owner)
Feature: Dashboard
  Scenario: See dashboard
    Then I should see "Dashboard"
```

Multi-suite:
```gherkin
@needs(login-owner, navigate-dashboard)
Feature: ...
```

### Injection Logic

`suite-injector.ts` does:
1. Parse `@needs(...)` from feature tags
2. Resolve suite names from `suites.config.json`
3. Recursively resolve nested `needs` (with cycle detection via visited set)
4. Collect all steps in dependency order
5. Prepend to existing Background steps (or create Background if none)
6. Return modified `ParsedFeature`

### Merge Rules

- If feature has no Background → create one with suite steps
- If feature has Background → prepend suite steps before existing Background steps
- Duplicate step detection: skip if exact same `text` already in Background
- Order: suites first (in declared order), then original Background steps

## Related Code Files

### Modify
- `e2e/generator/generator.ts` — call `injectSuites()` after parse, before emit
- `e2e/steps/types.ts` — add `SuiteDefinition` type (optional, can inline)

### Create
- `config/suites.config.json` — suite definitions
- `e2e/generator/suite-injector.ts` — injection engine

## Implementation Steps

1. Create `config/suites.config.json` with initial suites: `login-owner`, `login-owner-no2fa`, `navigate-dashboard`, `logged-in-dashboard`
2. Create `e2e/generator/suite-injector.ts`:
   - `loadSuites()` — read and validate config
   - `parseNeedsTags(tags: string[])` — extract suite names from `@needs(...)` tags
   - `resolveSuite(name, config, visited)` — recursive resolution with cycle detection
   - `injectSuites(feature: ParsedFeature, config)` — main function, returns modified feature
3. Update `e2e/generator/generator.ts`:
   - Import and call `injectSuites()` in `generateFromFeature()` between `parseFeature()` and `emitSpecFile()`
   - Load suites config once at startup

## Todo

- [ ] Create `config/suites.config.json`
- [ ] Create `e2e/generator/suite-injector.ts`
- [ ] Update `generator.ts` to call injector
- [ ] Test: feature with `@needs(login-owner)` generates correct Background
- [ ] Test: nested suites resolve correctly
- [ ] Test: cycle detection throws clear error
- [ ] Test: duplicate steps are deduplicated

## Success Criteria

- `@needs(login-owner)` injects login steps into Background
- Nested suites (`logged-in-dashboard` → `login-owner` + `navigate-dashboard`) resolve correctly
- Circular dependency detected and reported with clear error
- Existing features without `@needs` work unchanged
- Generated `.spec.ts` is identical quality to manual Background

## Risk Assessment

- **Low risk**: Injection is additive — existing features unaffected if no `@needs` tag
- **Edge case**: Suite references non-existent suite → clear error message
- **Edge case**: Feature already has Background with same steps → dedup prevents doubles
