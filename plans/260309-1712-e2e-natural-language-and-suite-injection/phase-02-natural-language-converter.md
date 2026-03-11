# Phase 2: Natural Language → .feature Converter

## Priority: HIGH
## Status: pending

## Overview

New slash command `/describe-e2e` that converts QC's plain language (Vietnamese or English) into valid Gherkin `.feature` files. AI uses the step catalog to maximize match rate — outputting catalog-optimized steps whenever possible.

## Key Insights

- QCs know WHAT to test but struggle with Gherkin syntax and catalog patterns
- The step catalog has 37+ patterns — AI should map natural language to these patterns first
- Vietnamese QCs write things like "đăng nhập với tài khoản hợp lệ" → needs to map to `I login as "owner" with 2FA`
- Suite injection (`@needs`) should be suggested when login/navigation prerequisites are detected
- Output is a `.feature` file that goes through the normal `/generate-e2e` pipeline

## Architecture

```
QC input (natural language)
       ↓
/describe-e2e slash command (AI-powered)
       ↓
AI reads: catalog patterns + suites config + e2e config (accounts, pages)
       ↓
Outputs: e2e/features/{name}.feature (valid Gherkin)
       ↓
Normal pipeline: /generate-e2e → /run-e2e
```

This is an AI-at-authoring-time feature — the slash command IS the implementation. No TypeScript code needed. The slash command prompt instructs AI how to convert.

## Slash Command Design

### `/describe-e2e {feature-name}`

**Input**: QC describes test scenarios in natural language via the argument or interactive prompt.

**AI workflow**:
1. Read `e2e/steps/catalog.ts` — get all available patterns
2. Read `config/suites.config.json` — get available suites
3. Read `config/e2e.config.json` — get pages, accounts, selectors
4. Parse QC's natural language description
5. Map each described action to the closest catalog step pattern
6. Detect prerequisites (login, navigation) → suggest `@needs` tags
7. Structure into proper Gherkin: Feature, Background, Scenario, Scenario Outline
8. Write to `e2e/features/{feature-name}.feature`

### Conversion Rules (embedded in slash command prompt)

**Mapping natural language → catalog steps:**

| QC says (vi/en) | Maps to |
|---|---|
| "đăng nhập", "login", "logged in" | `@needs(login-owner)` or `I login as "owner"` |
| "vào trang dashboard", "go to dashboard" | `I am on the "dashboard" page` |
| "nhập email", "type email" | `I fill input "Enter email address" with "..."` |
| "click nút Submit", "click Submit button" | `I click button "Submit"` |
| "thấy text Welcome", "should see Welcome" | `I should see "Welcome"` |
| "kiểm tra URL có /dashboard" | `the URL should contain "/dashboard"` |

**Smart behaviors:**
- Detect data-driven patterns → use Scenario Outline + Examples table
- Detect shared setup → use Background
- Detect login prerequisite → suggest `@needs(login-owner)` tag
- Use account names from `e2e.config.json` (owner, admin, etc.)
- Use page names from `e2e.config.json` (login, dashboard, etc.)

### Example Conversion

**Input:**
```
/describe-e2e dashboard-access

Kiểm tra trang dashboard sau khi đăng nhập:
- Đăng nhập bằng tài khoản owner có 2FA
- Sau khi login, kiểm tra thấy text "Dashboard"
- URL phải chứa /dashboard
- Thử trường hợp chưa login, vào dashboard phải redirect về login
```

**Output:** `e2e/features/dashboard-access.feature`
```gherkin
@smoke @needs(login-owner)
Feature: Dashboard Access
  Verify dashboard page after login.

  Scenario: Dashboard visible after login
    Then I should see "Dashboard"
    And the URL should contain "/dashboard"

  Scenario: Unauthenticated user redirected to login
    Given I navigate to "/dashboard"
    Then the URL should contain "/"
    And I should see "Welcome back,"
```

## Related Code Files

### Create
- `.claude/commands/describe-e2e.md` — slash command definition

### Modify
- `e2e/QC-GUIDE.md` — add section about `/describe-e2e`
- `CLAUDE.md` — add `/describe-e2e` to workflow commands list

## Implementation Steps

1. Create `.claude/commands/describe-e2e.md` with:
   - Pre-check: verify e2e structure + configs exist
   - Step 1: read catalog, suites config, e2e config
   - Step 2: parse natural language input (argument = feature name, prompt QC for description if not inline)
   - Step 3: conversion rules — map to catalog steps, detect prerequisites
   - Step 4: structure into Gherkin with proper tags
   - Step 5: write `.feature` file
   - Step 6: show conversion summary + suggest next steps
2. Update `e2e/QC-GUIDE.md` — add "Writing Tests in Plain Language" section
3. Update `CLAUDE.md` — add `/describe-e2e` to command list

## Todo

- [ ] Create `.claude/commands/describe-e2e.md`
- [ ] Update `e2e/QC-GUIDE.md` with describe-e2e section
- [ ] Update `CLAUDE.md` with new command
- [ ] Test: Vietnamese input → valid .feature
- [ ] Test: English input → valid .feature
- [ ] Test: Login prerequisite auto-detected → @needs tag added
- [ ] Test: Data-driven pattern → Scenario Outline generated
- [ ] Test: Generated .feature passes through /generate-e2e without errors

## Success Criteria

- QC can write plain language → get valid `.feature` file
- Generated features use catalog steps (high match rate when run through /generate-e2e)
- Prerequisites auto-detected and mapped to `@needs` tags
- Both Vietnamese and English input work
- Output file is valid Gherkin (parseable by @cucumber/gherkin)

## Risk Assessment

- **Medium risk**: AI interpretation quality — mitigated by providing catalog as explicit reference
- **Low risk**: Vietnamese NLP — not doing NLP, just AI prompt with bilingual examples
- **Edge case**: Ambiguous descriptions → AI asks clarifying questions via output comments
