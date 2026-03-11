# Phase 1: Authenticated State (storageState)

## Priority: HIGH

## Problem
9/12 features dùng `@needs(login-owner)` → mỗi test chạy login + 2FA trong `beforeEach`.
- Login + 2FA = ~5-10s/test (navigate → fill email → fill password → click → wait OTP page → type OTP → click verify → wait)
- 9 features × avg 3 scenarios = ~27 lần login lại = **~2-4 phút wasted**
- TOTP codes có window 30s → race condition khi chạy parallel
- Flaky: network delay, OTP timeout, page load timing

## Solution: Playwright `global.setup.ts` + `storageState`

Login 1 lần trước toàn bộ test suite → save cookies/localStorage vào file → mỗi test reuse session.

### Key Insights
- Playwright native support: `globalSetup` + `storageState` option
- Không cần thay đổi feature files hay step catalog
- Code-emitter cần update: features có `@needs(login-*)` → dùng `storageState` thay vì emit login code vào `beforeEach`

## Architecture

```
e2e/
├── global-setup.ts              ← NEW: login + save storageState
├── auth-state/                  ← NEW: saved browser state
│   └── owner-state.json         ← cookies + localStorage after login
├── playwright.config.ts         ← MODIFY: add globalSetup + storageState project
├── generator/
│   └── code-emitter.ts          ← MODIFY: skip login emission for @needs(login-*) features
└── steps/
    └── auth.steps.ts            ← NO CHANGE (keep for non-storageState scenarios)
```

## Implementation Steps

### 1. Create `e2e/global-setup.ts` (~50 lines)
```typescript
import { chromium, FullConfig } from '@playwright/test';
import e2eConfig from '../config/e2e.config.json';
import { generateTOTP } from './helpers/totp-helper';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    ...(e2eConfig.basicAuth && {
      httpCredentials: {
        username: e2eConfig.basicAuth.username,
        password: e2eConfig.basicAuth.password,
      },
    }),
  });
  const page = await context.newPage();

  // Login as owner with 2FA
  const account = e2eConfig.accounts.owner;
  await page.goto(e2eConfig.appUrl + (e2eConfig.pages.login || '/'));
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(account.emailPlaceholder).fill(account.email);
  await page.getByPlaceholder(account.passwordPlaceholder).fill(account.password);
  await page.getByRole('button', { name: account.submitButton }).click();

  // 2FA
  const otpInput = page.getByRole('textbox', { name: 'Please enter OTP character 1' });
  await otpInput.waitFor({ state: 'visible', timeout: 15000 });
  const otp = generateTOTP(account.totpSecret);
  await otpInput.click();
  await page.keyboard.type(otp, { delay: 50 });
  await page.getByRole('button', { name: account.totpSubmitButton }).click();
  await page.waitForLoadState('networkidle');

  // Save state
  await context.storageState({ path: 'e2e/auth-state/owner-state.json' });
  await browser.close();
}

export default globalSetup;
```

### 2. Create `e2e/auth-state/` directory
```bash
mkdir -p e2e/auth-state
echo '*.json' > e2e/auth-state/.gitignore   # Don't commit session tokens
```

### 3. Modify `e2e/playwright.config.ts`
```diff
+ import path from 'path';
+
  export default defineConfig({
+   globalSetup: './global-setup.ts',
    testDir: './generated',
    ...
    projects: [
+     // Setup project — runs globalSetup first
+     { name: 'setup', testMatch: /global-setup\.ts/ },
+     // Authenticated tests — use saved state
      {
-       name: e2eConfig.browser,
-       use: { ...devices[browserDeviceMap[e2eConfig.browser]] },
+       name: 'authenticated',
+       use: {
+         ...devices[browserDeviceMap[e2eConfig.browser]],
+         storageState: 'e2e/auth-state/owner-state.json',
+       },
+       dependencies: ['setup'],
+       testMatch: /^(?!.*login\.).*\.spec\.ts$/,  // All except login tests
+     },
+     // Unauthenticated tests — login flow tests themselves
+     {
+       name: 'unauthenticated',
+       use: { ...devices[browserDeviceMap[e2eConfig.browser]] },
+       testMatch: /login.*\.spec\.ts$/,
      },
    ],
  });
```

### 4. Modify `e2e/generator/code-emitter.ts`
Khi feature có `@needs(login-owner)` hoặc `@needs(login-owner-no2fa)`:
- **KHÔNG** emit login steps vào `beforeEach` nữa
- Thay bằng comment: `// Auth: using storageState (login-owner)`
- Vẫn emit navigation steps (nếu có `@needs(navigate-*)`)

```diff
  // In emitSpecFile(), after building background steps:
+ const hasLoginNeeds = feature.tags.some(t =>
+   t.startsWith('@needs(login-'));
+
  if (feature.background) {
    lines.push(`  test.beforeEach(async (${fixture}) => {`);
-   for (const step of feature.background.steps) {
+   for (const step of feature.background.steps) {
+     // Skip login steps if storageState handles auth
+     if (hasLoginNeeds && isLoginStep(step.text)) {
+       lines.push(`    // Auth: handled by storageState`);
+       totalSteps++; matchedCount++;
+       continue;
+     }
      // ... existing step matching
    }
  }
```

### 5. Update `e2e/generator/suite-injector.ts`
Khi resolving `@needs(login-owner)` → mark as `storageState: true` in metadata, don't inject login steps into background anymore.

### 6. Regenerate all specs
```bash
npx tsx e2e/generator/generator.ts
```

## Verification
```bash
# Verify global setup runs
npx playwright test --project=setup

# Verify auth state file created
cat e2e/auth-state/owner-state.json | head -5

# Run authenticated tests
npx playwright test --project=authenticated --reporter=list

# Run login tests separately (no storageState)
npx playwright test --project=unauthenticated --reporter=list

# Compare timing: before vs after
time npx playwright test e2e/generated/dashboard-access.spec.ts
```

## Risks
- **storageState expiry**: Token/session có thể expire giữa test run dài. Mitigation: globalSetup chạy fresh mỗi lần.
- **Parallel TOTP**: globalSetup chạy 1 lần sequential → không có TOTP race condition.
- **Multi-account**: Hiện tại chỉ cần owner. Nếu cần thêm account → tạo thêm `member-state.json` + thêm project.

## TODO
- [ ] Create `e2e/global-setup.ts`
- [ ] Create `e2e/auth-state/.gitignore`
- [ ] Update `e2e/playwright.config.ts` (globalSetup + projects)
- [ ] Update `e2e/generator/code-emitter.ts` (skip login steps for @needs(login-*))
- [ ] Update `e2e/generator/suite-injector.ts` (storageState awareness)
- [ ] Regenerate all specs
- [ ] Test: verify storageState works, login tests still pass
