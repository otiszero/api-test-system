# E2E Testing — QC Quick-Start Guide

## Overview

Write human-readable `.feature` files using Gherkin syntax (Given/When/Then). AI generates Playwright test code ONE TIME from your features. After generation, tests run directly — no AI needed.

## Quick Start

```bash
# 1. Write your feature file
#    e2e/features/my-flow.feature

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
| `"{element}" should be visible` | `Then "sidebar" should be visible` |
| `"{element}" should not be visible` | `Then "loading" should not be visible` |
| `"{element}" should be disabled` | `Then "submit-btn" should be disabled` |
| `"{element}" should be enabled` | `Then "submit-btn" should be enabled` |
| `"{element}" should contain "{text}"` | `Then "status" should contain "Active"` |
| `"{element}" should have value "{value}"` | `Then "email" should have value "test@test.com"` |
| `the page title should be "{title}"` | `Then the page title should be "Dashboard"` |

### API Steps

| Step | Example |
|------|---------|
| `API: user "{role}" is authenticated` | `Given API: user "owner" is authenticated` |
| `API: GET "{endpoint}" returns {code}` | `When API: GET "/health" returns 200` |
| `API: POST "{endpoint}" returns {code}` | `When API: POST "/orders" returns 201` |
| `API: PUT "{endpoint}" returns {code}` | `When API: PUT "/profile" returns 200` |
| `API: DELETE "{endpoint}" returns {code}` | `When API: DELETE "/orders/1" returns 204` |
| `API: response should contain "{field}"` | `Then API: response should contain "status"` |
| `API: response "{field}" should equal "{value}"` | `Then API: response "status" should equal "ok"` |

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

## Adding New Steps to Catalog

If you frequently use custom steps, ask the developer to add them to the catalog:

1. Create a new file in `e2e/steps/` (e.g., `table.steps.ts`)
2. Define pattern + code template
3. Import and register in `e2e/steps/catalog.ts`

This converts AI-cost steps to zero-cost catalog steps for all future features.
