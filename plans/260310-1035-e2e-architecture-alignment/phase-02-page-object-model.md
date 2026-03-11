# Phase 2: Page Object Model (POM)

## Priority: MEDIUM

## Problem
Step catalog sinh inline selectors trực tiếp vào `.spec.ts`:
```typescript
await page.getByPlaceholder('Enter email address').fill(account.email);
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('textbox', { name: 'Please enter OTP character 1' }).click();
```

Khi UI thay đổi selector (vd: placeholder text đổi, button rename):
- Phải regenerate **tất cả** specs
- Hoặc sửa tay nhiều files → dễ sót
- Không có single source of truth cho selectors

## Solution: Thin POM Layer

**Không** build full POM như draft (quá heavy cho Gherkin-first approach). Thay vào đó:
- Page classes gom selectors + common actions
- Step catalog delegate sang POM thay vì inline selectors
- Code-emitter import POM classes

### Key Design Decisions
1. **Thin POM** — chỉ gom selectors + 1-2 convenience methods, không duplicate Playwright API
2. **Composition over inheritance** — mỗi page class standalone, không cần base class phức tạp
3. **Config-driven selectors** — đọc placeholders/button names từ `e2e.config.json` khi có thể
4. **Compatible với step catalog** — steps vẫn sinh code, nhưng code gọi POM thay vì inline

## Architecture

```
e2e/
├── pages/                       ← POM classes
│   ├── base.page.ts             ← Common helpers (navigate, waitForLoad, toast)
│   ├── login.page.ts            ← Login form selectors + actions
│   ├── dashboard.page.ts        ← Dashboard selectors
│   ├── vault.page.ts            ← Vault list/detail selectors
│   └── index.ts                 ← Barrel export
├── fixtures/
│   ├── test.fixture.ts          ← NEW: inject POM instances via fixtures
│   └── wallet-fixtures.ts       ← EXISTING
├── steps/
│   ├── auth.steps.ts            ← MODIFY: delegate to LoginPage
│   ├── navigation.steps.ts      ← MODIFY: delegate to BasePage
│   └── ...
└── generator/
    └── code-emitter.ts          ← MODIFY: import POM, use fixture
```

## Implementation Steps

### 1. Create `e2e/pages/base.page.ts` (~40 lines)
```typescript
import { Page } from '@playwright/test';
import e2eConfig from '../../config/e2e.config.json';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(pageName: string) {
    const path = e2eConfig.pages[pageName] || `/${pageName}`;
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /** Get toast/notification text */
  async getToastText(): Promise<string | null> {
    const toast = this.page.locator('[role="alert"], .toast, .notification').first();
    if (await toast.isVisible()) return toast.textContent();
    return null;
  }
}
```

### 2. Create `e2e/pages/login.page.ts` (~50 lines)
```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import e2eConfig from '../../config/e2e.config.json';
import { generateTOTP } from '../helpers/totp-helper';

export class LoginPage extends BasePage {
  private account(user: string) {
    return (e2eConfig.accounts as any)[user];
  }

  get emailInput() {
    return this.page.getByPlaceholder(
      this.account('owner').emailPlaceholder || 'Enter email address'
    );
  }
  get passwordInput() {
    return this.page.getByPlaceholder(
      this.account('owner').passwordPlaceholder || 'Enter password'
    );
  }
  get submitButton() {
    return this.page.getByRole('button', {
      name: this.account('owner').submitButton || 'Continue'
    });
  }
  get otpInput() {
    return this.page.getByRole('textbox', { name: 'Please enter OTP character 1' });
  }
  get verifyButton() {
    return this.page.getByRole('button', {
      name: this.account('owner').totpSubmitButton || 'Verify'
    });
  }

  async fillCredentials(user: string) {
    const acct = this.account(user);
    await this.emailInput.fill(acct.email);
    await this.passwordInput.fill(acct.password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillOtp(user: string) {
    const acct = this.account(user);
    await this.otpInput.waitFor({ state: 'visible', timeout: 15000 });
    const otp = generateTOTP(acct.totpSecret);
    await this.otpInput.click();
    await this.page.keyboard.type(otp, { delay: 50 });
  }

  async loginWithOtp(user: string) {
    await this.navigate('login');
    await this.fillCredentials(user);
    await this.submit();
    await this.fillOtp(user);
    await this.verifyButton.click();
    await this.waitForLoad();
  }
}
```

### 3. Create more page objects as needed
Start với 3-4 pages hay dùng nhất:
- `login.page.ts` (đã có ở trên)
- `dashboard.page.ts` — sidebar, stats, recent activity
- `vault.page.ts` — vault list, vault detail, create form
- Thêm page khác khi cần (YAGNI)

### 4. Create `e2e/pages/index.ts` (barrel export)
```typescript
export { BasePage } from './base.page';
export { LoginPage } from './login.page';
export { DashboardPage } from './dashboard.page';
export { VaultPage } from './vault.page';
```

### 5. Create `e2e/fixtures/test.fixture.ts` (~30 lines)
```typescript
import { test as base } from '@playwright/test';
import { LoginPage, DashboardPage, VaultPage } from '../pages';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  vaultPage: VaultPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  dashboardPage: async ({ page }, use) => { await use(new DashboardPage(page)); },
  vaultPage: async ({ page }, use) => { await use(new VaultPage(page)); },
});

export { expect } from '@playwright/test';
```

### 6. Update step catalog (`auth.steps.ts`)
```diff
  {
    pattern: 'I login as "{user}" with 2FA',
    generateCode: ([user]) =>
-     [
-       `const account = e2eConfig.accounts['${user}'];`,
-       `await page.goto(e2eConfig.pages['login'] || '/');`,
-       `await page.waitForLoadState('networkidle');`,
-       ...14 more lines...
-     ].join('\n'),
+     `await loginPage.loginWithOtp('${user}');`,
  },
```

### 7. Update code-emitter imports
Khi POM is used, emit:
```typescript
import { test, expect } from '../fixtures/test.fixture';
// instead of:
import { test, expect } from '@playwright/test';
```

Fixture tự inject `loginPage`, `dashboardPage`, etc.

### 8. Regenerate specs
```bash
npx tsx e2e/generator/generator.ts
```

## Impact trên generated code

**Before:**
```typescript
test('Login validation', async ({ page }) => {
  await page.getByPlaceholder('Enter email address').fill('notanemail');
  await page.getByPlaceholder('Enter password').fill('TestPassword1!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Email address is invalid')).toBeVisible();
});
```

**After:**
```typescript
test('Login validation', async ({ loginPage, page }) => {
  await loginPage.emailInput.fill('notanemail');
  await loginPage.passwordInput.fill('TestPassword1!');
  await loginPage.submit();
  await expect(page.getByText('Email address is invalid')).toBeVisible();
});
```

UI thay đổi placeholder → sửa `login.page.ts` 1 chỗ → done.

## Risks
- **Over-engineering**: Chỉ tạo POM cho pages thực sự dùng nhiều. YAGNI — thêm khi cần.
- **Step catalog coupling**: Steps phải biết POM fixtures tồn tại. Code-emitter cần emit đúng fixture destructure.
- **Breaking change**: Regenerate tất cả specs. Nhưng specs là "DO NOT EDIT" → regenerate là expected workflow.

## TODO
- [ ] Create `e2e/pages/base.page.ts`
- [ ] Create `e2e/pages/login.page.ts`
- [ ] Create `e2e/pages/dashboard.page.ts` (basic)
- [ ] Create `e2e/pages/vault.page.ts` (basic)
- [ ] Create `e2e/pages/index.ts`
- [ ] Create `e2e/fixtures/test.fixture.ts`
- [ ] Update `e2e/steps/auth.steps.ts` → delegate to LoginPage
- [ ] Update `e2e/steps/navigation.steps.ts` → delegate to BasePage
- [ ] Update `e2e/generator/code-emitter.ts` → import fixture, destructure POM
- [ ] Regenerate all specs
- [ ] Verify tests still pass
