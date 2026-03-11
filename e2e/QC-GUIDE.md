# E2E Testing — QC Quick-Start Guide

## Overview

Write human-readable `.feature` files using Gherkin syntax (Given/When/Then). AI generates Playwright test code ONE TIME from your features. After generation, tests run directly — no AI needed.

## Quick Start

```bash
# Option A: Write .feature file directly (if familiar with Gherkin)
#    e2e/features/my-flow.feature

# Option B: Describe in natural language (Vietnamese/English)
/describe-e2e my-flow
# → AI generates e2e/features/my-flow.feature for you

# 2. Generate Playwright test code
/generate-e2e my-flow

# 3. Run tests
/run-e2e my-flow

# 4. Run with visible browser
/run-e2e my-flow --headed

# 5. Run all E2E tests
/run-e2e
```

## Writing Feature Files

Save `.feature` files in `e2e/features/`. Use Gherkin syntax:

```gherkin
@smoke
Feature: Login Flow
  Users can log in with valid credentials.

  Background:
    Given I am on the "login" page

  Scenario: Successful login
    When I fill "email" with "owner@test.com"
    And I fill "password" with "TestPassword123!"
    And I click button "Sign In"
    Then the URL should contain "/dashboard"
    And I should see "Dashboard"
```

### Key Elements

| Element | Purpose | Example |
|---------|---------|---------|
| `Feature:` | Test suite name | `Feature: Login Flow` |
| `Scenario:` | Individual test case | `Scenario: Successful login` |
| `Background:` | Steps run before each scenario | `Given I am on the "login" page` |
| `Scenario Outline:` | Parameterized test with Examples table | See below |
| `@tag` | Test tags for filtering | `@smoke`, `@integration` |

### Scenario Outline (Data-Driven Tests)

```gherkin
Scenario Outline: Login validation - <case>
  When I fill "email" with "<email>"
  And I fill "password" with "<password>"
  And I click button "Sign In"
  Then I should see "<message>"

  Examples:
    | case           | email          | password  | message             |
    | empty email    |                | Pass123!  | Required            |
    | wrong password | owner@test.com | wrongpass | Invalid credentials |
```

Each row in Examples becomes a separate test.

### Hybrid UI + API Tests

Mix browser steps and API steps in the same scenario:

```gherkin
Scenario: Submit form and verify via API
  Given API: user "owner" is authenticated
  Given I am on the "dashboard" page
  Then I should see "Dashboard"
  When API: GET "/profile" returns 200
  Then API: response should contain "email"
```

API steps are prefixed with `API:`.

## Step Catalog Reference

Steps below are pre-built. Using them costs ZERO AI tokens during generation.

### Navigation

| Step | Example |
|------|---------|
| `I am on the "{page}" page` | `Given I am on the "login" page` |
| `I navigate to "{url}"` | `Given I navigate to "/dashboard"` |
| `the URL should contain "{text}"` | `Then the URL should contain "/dashboard"` |
| `the URL should be "{url}"` | `Then the URL should be "/auth/login"` |
| `I go back` | `When I go back` |
| `I refresh the page` | `When I refresh the page` |

### Form Interaction

| Step | Example |
|------|---------|
| `I fill "{field}" with "{value}"` | `When I fill "email" with "test@test.com"` |
| `I clear "{field}"` | `When I clear "email"` |
| `I select "{option}" from "{field}"` | `When I select "USD" from "currency"` |
| `I check "{field}"` | `When I check "terms"` |
| `I uncheck "{field}"` | `When I uncheck "newsletter"` |
| `I upload "{filePath}" to "{field}"` | `When I upload "./doc.pdf" to "kyc-document"` |

### Actions

| Step | Example |
|------|---------|
| `I click "{element}"` | `When I click "submit-btn"` |
| `I click button "{text}"` | `When I click button "Sign In"` |
| `I click link "{text}"` | `When I click link "Forgot Password"` |
| `I press "{key}"` | `When I press "Enter"` |
| `I wait {N} seconds` | `When I wait 3 seconds` |
| `I wait for "{selector}" to be visible` | `When I wait for "#modal" to be visible` |

### Assertions

| Step | Example |
|------|---------|
| `I should see "{text}"` | `Then I should see "Welcome"` |
| `I should not see "{text}"` | `Then I should not see "Error"` |
| `element "{selector}" should be visible` | `Then element "#sidebar" should be visible` |
| `element "{selector}" should not be visible` | `Then element "#loading" should not be visible` |
| `element "{selector}" should be disabled` | `Then element "#submit-btn" should be disabled` |
| `element "{selector}" should be enabled` | `Then element "#submit-btn" should be enabled` |
| `element "{selector}" should contain "{text}"` | `Then element "#status" should contain "Active"` |
| `element "{selector}" should have value "{value}"` | `Then element "#email" should have value "test@test.com"` |
| `element "{selector}" should have text "{text}"` | `Then element "#title" should have text "Dashboard"` |
| `the page title should be "{title}"` | `Then the page title should be "Dashboard"` |
| `I should see {count} "{selector}" elements` | `Then I should see 3 ".item" elements` |
| `I should see error "{message}"` | `Then I should see error "Invalid credentials"` |
| `I should see toast "{message}"` | `Then I should see toast "Saved successfully"` |
| `I should be redirected to "{path}"` | `Then I should be redirected to "/dashboard"` |
| `the submit button should be disabled` | `Then the submit button should be disabled` |

### API Steps

| Step | Example |
|------|---------|
| `API: user "{role}" is authenticated` | `Given API: user "owner" is authenticated` |
| `API: GET "{endpoint}" returns {code}` | `When API: GET "/health" returns 200` |
| `API: POST "{endpoint}" returns {code}` | `When API: POST "/orders" returns 201` |
| `API: PUT "{endpoint}" returns {code}` | `When API: PUT "/profile" returns 200` |
| `API: PATCH "{endpoint}" returns {code}` | `When API: PATCH "/profile" returns 200` |
| `API: DELETE "{endpoint}" returns {code}` | `When API: DELETE "/orders/1" returns 204` |
| `API: response should contain "{field}"` | `Then API: response should contain "status"` |
| `API: response "{field}" should equal "{value}"` | `Then API: response "status" should equal "ok"` |
| `API: response "{field}" should not be empty` | `Then API: response "email" should not be empty` |
| `API: response should have {count} items in "{field}"` | `Then API: response should have 5 items in "orders"` |
| `API: response "{field}" should contain "{substring}"` | `Then API: response "name" should contain "John"` |
| `API: response status should be {code}` | `Then API: response status should be 200` |

### Auth Steps

| Step | Example |
|------|---------|
| `I login as "{user}" with 2FA` | `Given I login as "owner" with 2FA` |
| `I login as "{user}"` | `Given I login as "owner"` |
| `I fill login form for "{user}"` | `When I fill login form for "owner"` |
| `I enter invalid OTP "{code}"` | `When I enter invalid OTP "000000"` |

### Cleanup Steps

| Step | Example |
|------|---------|
| `cleanup: DELETE "{endpoint}"` | `Then cleanup: DELETE "/orders/123"` |
| `cleanup: clear localStorage` | `Then cleanup: clear localStorage` |
| `cleanup: clear cookies` | `Then cleanup: clear cookies` |
| `cleanup: reset user "{user}" state` | `Then cleanup: reset user "owner" state` |

**Cleanup usage**: Tag a scenario with `@cleanup` or name it "Cleanup". It becomes a `test.afterAll()` block.

```gherkin
@cleanup
Scenario: Cleanup
  Then cleanup: DELETE "/orders/123"
  And cleanup: clear cookies
```

### Data/Variables

| Step | Example |
|------|---------|
| `I save "{value}" as "{variable}"` | `When I save "test-123" as "orderId"` |
| `I save element "{selector}" text as "{variable}"` | `When I save element "#order-id" text as "orderId"` |
| `variable "{name}" should equal "{expected}"` | `Then variable "orderId" should equal "test-123"` |

## Custom Steps (AI-Interpreted)

Any step not in the catalog above gets interpreted by AI during generation. Use natural language:

```gherkin
When I drag "item-1" to "trash-bin"
Then the chart should display 5 data points
When I scroll down to "footer"
```

These steps cost AI tokens. To minimize cost, prefer catalog steps when possible.

## Page Names

Page names map to URLs via `config/e2e.config.json`:

```json
{
  "pages": {
    "login": "/auth/login",
    "dashboard": "/dashboard",
    "kyc/status": "/kyb",
    "vault/accounts": "/vaults"
  }
}
```

Use the key name in your steps: `Given I am on the "login" page`

## Debugging Failed Tests

```bash
# Run with visible browser
/run-e2e my-flow --headed

# Run with Playwright Inspector (step-by-step)
/run-e2e my-flow --debug

# Run with trace recording
/run-e2e my-flow --trace

# View trace after failure
npx playwright show-trace e2e/test-results/{test}/trace.zip

# View HTML report
npx playwright show-report
```

## Tips for High Match Rate

1. **Use exact catalog patterns** — copy from the table above
2. **Prefer `data-testid` selectors** — `I fill "email"` uses `[data-testid="email"]`
3. **API steps always start with `API:`** — this tells the generator to use HTTP helpers
4. **Use Scenario Outline** for data-driven tests — avoids duplicate scenarios
5. **Use Background** for shared setup — avoids repeating Given steps

## Writing Tests in Plain Language

If you're not familiar with Gherkin syntax, use `/describe-e2e` to write tests in natural language:

```bash
/describe-e2e dashboard-access
```

Then describe what you want to test in Vietnamese or English:

```
Kiểm tra trang dashboard sau khi đăng nhập:
- Đăng nhập bằng tài khoản owner có 2FA
- Sau khi login, kiểm tra thấy text "Dashboard"
- URL phải chứa /dashboard
```

AI will generate a valid `.feature` file optimized for the step catalog. Then run `/generate-e2e` as normal.

### Tips for Good Descriptions

- Be specific about what you're testing
- Mention which account to use (owner, admin, etc.)
- Describe expected results clearly
- If testing multiple similar cases with different data, mention "test with different values"

## Reusable Suites (@needs tags)

Instead of repeating login/navigation steps in every feature, use `@needs` tags to inject prerequisite steps automatically.

### Available Suites

| Suite name | What it does |
|---|---|
| `login-owner` | Login as owner with 2FA |
| `login-owner-no2fa` | Login as owner without 2FA |
| `navigate-dashboard` | Navigate to dashboard page |
| `navigate-login` | Navigate to login page |
| `logged-in-dashboard` | Login + navigate to dashboard (combined) |

### Usage

Add `@needs(suite-name)` tag to your feature:

```gherkin
@smoke @needs(login-owner)
Feature: Dashboard Access
  Verify dashboard after login.

  Scenario: Dashboard visible
    Then I should see "Dashboard"
    And the URL should contain "/dashboard"
```

When generated, the login steps are automatically injected into `test.beforeEach()`.

### Multiple Suites

Chain multiple suites:

```gherkin
@needs(login-owner, navigate-dashboard)
Feature: Dashboard Widgets
```

### Composite Suites

Use a composite suite that combines others:

```gherkin
@needs(logged-in-dashboard)
Feature: Dashboard Widgets
```

`logged-in-dashboard` = `login-owner` + `navigate-dashboard` combined.

### Adding Custom Suites

Edit `config/suites.config.json` to add your own:

```json
{
  "suites": {
    "my-suite": {
      "description": "What this suite does",
      "steps": [
        { "keyword": "Given", "text": "I am on the \"login\" page" }
      ]
    },
    "composite-suite": {
      "description": "Combines other suites",
      "needs": ["login-owner", "navigate-dashboard"]
    }
  }
}
```

## Credentials Best Practice

### Happy Path: Always Use Config References

For login scenarios that should succeed, use config-based steps. Credentials are read from `config/e2e.config.json` at generation time — never hardcoded in `.feature` files.

```gherkin
# GOOD — reads credentials from config
Given I login as "owner" with 2FA
Given I login as "owner"
When I fill login form for "owner"

# BAD — hardcoded credentials in happy path
When I fill "email" with "owner@company.com"
And I fill "password" with "RealPassword123!"
```

### Negative Tests: Use Literal Values

For error scenarios (wrong password, invalid OTP), use literal values directly. These are intentionally invalid, so there's nothing sensitive to protect.

```gherkin
# GOOD — intentionally invalid data for negative test
When I fill "email" with "wrong@email.com"
And I fill "password" with "WrongPassword!"
And I enter invalid OTP "000000"
Then I should see error "Invalid credentials"
```

### Summary

| Scenario Type | Step to Use | Why |
|---|---|---|
| Happy login | `I login as "{user}"` | Reads config, no secrets exposed |
| Happy login + 2FA | `I login as "{user}" with 2FA` | Reads config + TOTP secret |
| Fill form only (no submit) | `I fill login form for "{user}"` | Reads config, useful for form validation tests |
| Wrong password | `I fill "password" with "wrong"` | Literal value, intentionally invalid |
| Invalid OTP | `I enter invalid OTP "000000"` | Literal value, intentionally invalid |

## Adding New Steps to Catalog

If you frequently use custom steps, ask the developer to add them to the catalog:

1. Create a new file in `e2e/steps/` (e.g., `table.steps.ts`)
2. Define pattern + code template
3. Import and register in `e2e/steps/catalog.ts`

This converts AI-cost steps to zero-cost catalog steps for all future features.
