# Phase 5: Sample Features & Validation

**Priority**: Medium
**Status**: completed
**Effort**: Medium
**Completed**: 2026-03-08
**Depends on**: Phase 4

## Context Links
- E2E config: `config/e2e.config.json`
- Upmount API spec: `input/openapi.yaml`
- Step catalog: `e2e/steps/catalog.ts` (Phase 2)
- Generator: `e2e/generator/generator.ts` (Phase 3)

## Overview

Write sample `.feature` files for Upmount, run them through the full pipeline (generate → run), validate everything works end-to-end. Fix issues found. Document the QC workflow.

## Requirements

### Functional
- 3-4 sample feature files covering different patterns
- At least one hybrid UI+API scenario
- At least one Scenario Outline with Examples
- At least one Background block
- Full pipeline validation: feature → generate → compile → run
- QC quick-start guide

### Non-functional
- Features use a mix of catalog steps (majority) and custom steps (minority)
- Demonstrates catalog match rate > 70% target
- Generated specs pass TypeScript compilation
- Tests run successfully against live Upmount environment (or skip gracefully)

## Related Code Files

### Create
- `e2e/features/login.feature` — auth flow (UI)
- `e2e/features/kyc-submission.feature` — multi-step form (UI + API hybrid)
- `e2e/features/vault-management.feature` — CRUD with Scenario Outline (API-heavy)
- `e2e/features/health-check.feature` — simple smoke (API-only, validates setup)
- `e2e/QC-GUIDE.md` — quick-start guide for QC team

## Implementation Steps

### 1. Create health-check.feature (API-only smoke)

```gherkin
@smoke @api-only
Feature: Health Check
  Verify the application is up and API is responding.

  Scenario: API health endpoint responds
    Given API: user "owner" is authenticated
    When API: GET "/health" returns 200
    Then API: response should contain "status"

  Scenario: Web app is accessible
    Given I navigate to "/"
    Then I should see "Login"
```

Purpose: Simplest possible feature. 100% catalog-matched. Validates entire pipeline works.

### 2. Create login.feature (UI flow)

```gherkin
@smoke
Feature: Login Flow
  Users can log in with valid credentials and see the dashboard.

  Background:
    Given I am on the "login" page

  Scenario: Successful login
    When I fill "email" with "owner@test.com"
    And I fill "password" with "TestPassword123!"
    And I click button "Sign In"
    Then the URL should contain "/dashboard"
    And I should see "Dashboard"

  Scenario Outline: Login validation - <case>
    When I fill "email" with "<email>"
    And I fill "password" with "<password>"
    And I click button "Sign In"
    Then I should see "<message>"

    Examples:
      | case            | email              | password       | message              |
      | empty email     |                    | TestPassword1! | Required             |
      | empty password  | owner@test.com     |                | Required             |
      | invalid email   | notanemail         | TestPassword1! | Invalid email        |
      | wrong password  | owner@test.com     | wrongpass      | Invalid credentials  |
```

Purpose: Background block, Scenario Outline, form steps, assertion steps. High catalog match rate.

### 3. Create kyc-submission.feature (hybrid UI + API)

```gherkin
@integration
Feature: KYC Submission
  Organization owner submits KYC documents and checks status.

  Scenario: Submit KYC and verify via API
    # API setup
    Given API: user "owner" is authenticated

    # UI journey
    Given I am on the "kyc/status" page
    Then I should see "KYC"

    # API verification
    When API: GET "/kyb" returns 200
```

Purpose: Demonstrates hybrid UI+API pattern. Tests the API step integration with browser steps.

### 4. Create vault-management.feature (Scenario Outline + data)

```gherkin
@crud
Feature: Vault Management
  Authenticated users can view vault accounts.

  Background:
    Given API: user "owner" is authenticated

  Scenario: View vault list page
    Given I am on the "vault/accounts" page
    Then I should see "Vault"

  Scenario: API vault list returns data
    When API: GET "/vaults" returns 200
    Then API: response should contain "data"
```

Purpose: CRUD patterns, mix of UI and API assertions.

### 5. Generate and validate

For each feature file:
1. Run `/generate-e2e {feature}`
2. Check generated `.spec.ts` — valid TypeScript?
3. Check catalog match rate — meets >70% target?
4. Run `/run-e2e {feature}` — tests pass?
5. If failures: analyze and fix (catalog gaps, selector mismatches, etc.)

### 6. Create QC-GUIDE.md

Quick-start guide covering:
- How to write a `.feature` file
- Available catalog steps (full list with examples)
- How to use custom steps (free-form text)
- How to run `/generate-e2e` and `/run-e2e`
- How to debug failures (traces, headed mode, screenshots)
- How to add new steps to the catalog
- Tips for high catalog match rate

### 7. Update e2e.config.json with Upmount values

Fill in actual Upmount app URL and page paths for validation:
```json
{
  "appUrl": "https://app.upmount.sotatek.works",
  "pages": {
    "login": "/auth/login",
    "dashboard": "/dashboard",
    "kyc/status": "/kyb",
    "vault/accounts": "/vaults"
  }
}
```

## Todo List
- [x] Create health-check.feature (simplest smoke)
- [x] Generate + validate health-check.spec.ts
- [x] Create login.feature (Background + Scenario Outline)
- [x] Generate + validate login.spec.ts
- [x] Create kyc-submission.feature (hybrid UI+API)
- [x] Generate + validate kyc-submission.spec.ts
- [x] Create vault-management.feature (CRUD patterns)
- [x] Generate + validate vault-management.spec.ts
- [x] Run all generated tests, fix issues
- [x] Measure catalog match rate across all features
- [x] Create QC-GUIDE.md
- [x] Update e2e.config.json with Upmount values

## Success Criteria
- All 4 feature files parse without errors
- Generated specs compile without TypeScript errors
- Catalog match rate > 70% across all features combined
- Health-check tests pass against live environment
- Login tests demonstrate Scenario Outline expansion works
- KYC test demonstrates hybrid UI+API pattern
- QC-GUIDE.md is clear enough for QC to write features independently

## Risk Assessment
- **Live environment unavailable**: Tests may fail if Upmount staging is down.
  - Mitigation: health-check.feature validates connectivity first. Other tests can be reviewed for code quality even if they can't run.
- **Selectors don't match actual app**: data-testid attributes may not exist in Upmount frontend.
  - Mitigation: Run headed mode, inspect actual selectors, update e2e.config.json selectorStrategy if needed.
- **Auth flow differs from config**: Upmount may use OAuth or different login mechanism.
  - Mitigation: login.feature is a best-guess. Adjust based on actual app behavior during validation.
