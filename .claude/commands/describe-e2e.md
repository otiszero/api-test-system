Chuyển đổi mô tả test bằng ngôn ngữ tự nhiên (Tiếng Việt/English) thành file .feature Gherkin chuẩn. Argument: tên feature (vd: /describe-e2e dashboard-access).

QC mô tả test scenarios bằng ngôn ngữ tự nhiên → AI sinh ra file `.feature` tối ưu cho step catalog.

## Pre-check

1. Verify `e2e/` directory exists
2. Verify `config/e2e.config.json` exists
3. Read `config/suites.config.json` (nếu có)

## Workflow

### Step 1: Load context

Read these files to understand available patterns:
- `e2e/steps/catalog.ts` — all registered step patterns
- `e2e/steps/auth.steps.ts`, `e2e/steps/navigation.steps.ts`, `e2e/steps/form.steps.ts`, `e2e/steps/assertion.steps.ts`, `e2e/steps/action.steps.ts`, `e2e/steps/api.steps.ts`
- `config/e2e.config.json` — pages map, accounts, selectors
- `config/suites.config.json` — available reusable suites (nếu có)
- `e2e/features/_template.feature` — template structure reference

### Step 2: Collect QC input

If argument provided → use as feature file name.
Ask QC to describe what they want to test in natural language. QC can write in Vietnamese or English.

Example inputs:
- "Kiểm tra trang dashboard sau khi đăng nhập, đảm bảo hiện đúng text Welcome và URL là /dashboard"
- "Test login flow: try invalid email, wrong password, and correct credentials"
- "Đăng nhập bằng owner, vào vault, tạo vault mới, kiểm tra vault xuất hiện trong danh sách"

### Step 3: Convert to Gherkin

Map each described action to the CLOSEST catalog step pattern. Prioritize catalog steps for maximum match rate.

**Mapping rules (Vietnamese → catalog):**

| QC nói | Maps to |
|---|---|
| đăng nhập / login / logged in (with account name) | `@needs(login-{account})` tag hoặc `I login as "{user}" with 2FA` |
| đăng nhập / login (generic, no account specified) | `@needs(login-owner)` tag (default account) |
| vào trang X / go to X page | `I am on the "{page}" page` (use pages map from e2e.config) |
| nhập / điền / type / enter + field + value | `I fill input "{placeholder}" with "{value}"` |
| click nút / bấm nút / click button | `I click button "{text}"` |
| click link / bấm link | `I click link "{text}"` |
| click element / bấm vào | `I click "{testid}"` |
| thấy / hiện / should see / visible | `I should see "{text}"` |
| không thấy / không hiện / should not see | `I should not see "{text}"` |
| kiểm tra URL / URL should / URL phải | `the URL should contain "{path}"` |
| chờ / wait | `I wait {N} seconds` |
| chọn / select | `I select "{option}" from "{dropdown}"` |
| check / tick / đánh dấu | `I check "{field}"` |
| upload / tải lên | `I upload "{file}" to "{field}"` |
| API: gọi GET/POST/PUT/DELETE | `API: GET "{endpoint}" returns {code}` |

**Smart behaviors:**
- Detect REPEATED scenarios with different data → use `Scenario Outline` + `Examples` table
- Detect SHARED setup across scenarios → use `Background`
- Detect LOGIN/AUTH prerequisite → use `@needs(login-owner)` tag (reference suites.config.json)
- Detect PAGE NAVIGATION prerequisite → use `@needs(navigate-{page})` if suite exists, else `Background` with navigation step
- Use account names from `e2e.config.json` → `accounts` keys (owner, admin, etc.)
- Use page names from `e2e.config.json` → `pages` keys (login, dashboard, etc.)

### Step 4: Structure into Gherkin

Build valid Gherkin file:

```gherkin
@{tags} @needs({suites-if-detected})
Feature: {Feature Name}
  {Brief description}

  Background:
    {shared steps, if any NOT covered by @needs}

  Scenario: {Happy path}
    When {steps}
    Then {assertions}

  Scenario Outline: {Pattern name} - <case>
    When {parameterized steps}
    Then {parameterized assertions}

    Examples:
      | case | param1 | param2 | expected |
      | ... | ... | ... | ... |
```

### Step 5: Write file

Write to `e2e/features/{feature-name}.feature`

### Step 6: Display summary

Show:
- Generated file path
- Number of scenarios
- Catalog step match prediction (based on patterns used)
- Available suites injected (if any)
- Next steps: `/generate-e2e {feature-name}` → `/run-e2e {feature-name}`

If any steps couldn't be mapped to catalog patterns, warn:
- "⚠ {N} steps use natural language (sẽ cần AI interpret khi generate)"
- "Tip: dùng catalog patterns để giảm AI cost"

## Important Rules

- Output file MUST be valid Gherkin (parseable by @cucumber/gherkin)
- MAXIMIZE catalog step usage — don't invent new patterns when a catalog step fits
- ALWAYS use `@needs` tags when login/auth is a prerequisite (don't duplicate login steps in Background)
- Use `e2e.config.json` page names for navigation (not hardcoded URLs)
- Use `e2e.config.json` account names for authentication
- Keep scenarios focused — one behavior per scenario
- Use Scenario Outline when QC describes 3+ similar cases with different data
- Add `@smoke` tag by default unless QC specifies otherwise
