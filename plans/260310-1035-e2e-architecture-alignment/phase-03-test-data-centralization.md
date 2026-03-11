# Phase 3: Test Data Centralization

## Priority: LOW

## Problem
Test data nằm rải rác:
1. **Credentials** — hardcode trong `e2e.config.json` → `accounts.owner.email`, `accounts.owner.password`
2. **Form values** — hardcode trong `.feature` files → `"notanemail"`, `"TestPassword1!"`, `"wrongpass"`
3. **Placeholder/button text** — hardcode trong `e2e.config.json` → `emailPlaceholder`, `submitButton`
4. **Expected messages** — hardcode trong `.feature` → `"Email address is invalid"`, `"Your email or password is incorrect"`

Hiện tại chấp nhận được vì chỉ có 1 account + 1 environment. Nhưng khi scale:
- Thêm staging/prod environments → credentials khác nhau
- Thêm member/admin accounts → duplicate config
- Expected messages thay đổi theo locale → sửa nhiều features

## Solution: Centralized Test Data Module

Tạo `e2e/data/test-data.ts` gom tất cả test data vào 1 file type-safe.

### Scope — CHỈ làm 3 việc:
1. Tách invalid form data ra file riêng (dùng chung across features)
2. Tách expected messages ra constants
3. Environment-aware accounts (đọc từ env vars, fallback config)

**KHÔNG làm:** fixture factories, faker integration, data builders (YAGNI cho E2E).

## Architecture

```
e2e/
├── data/                        ← NEW
│   └── test-data.ts             ← Centralized constants + env-aware accounts
├── features/
│   └── *.feature                ← Dùng Scenario Outline <placeholder> thay hardcode
├── steps/
│   └── auth.steps.ts            ← Import accounts từ test-data thay vì e2eConfig
└── generator/
    └── code-emitter.ts          ← Emit import test-data khi cần
```

## Implementation Steps

### 1. Create `e2e/data/test-data.ts` (~60 lines)
```typescript
import e2eConfig from '../../config/e2e.config.json';

/** Accounts — env vars override config values */
export const accounts = {
  owner: {
    email: process.env.E2E_OWNER_EMAIL || e2eConfig.accounts.owner.email,
    password: process.env.E2E_OWNER_PASSWORD || e2eConfig.accounts.owner.password,
    totpSecret: process.env.E2E_OWNER_TOTP || e2eConfig.accounts.owner.totpSecret,
  },
  // Add more accounts as needed:
  // member: { ... },
  // admin: { ... },
} as const;

/** Invalid form data — reuse across features */
export const invalidData = {
  email: {
    malformed: 'notanemail',
    empty: '',
    tooLong: 'a'.repeat(256) + '@test.com',
  },
  password: {
    weak: 'wrongpass',
    empty: '',
    noUppercase: 'alllowercase1!',
    noDigit: 'NoDigitHere!',
  },
  otp: {
    invalid: '000000',
    short: '123',
    letters: 'abcdef',
  },
} as const;

/** Expected UI messages — single source of truth */
export const messages = {
  login: {
    invalidEmail: 'Email address is invalid',
    weakPassword: 'At least 1 uppercase, 1 lowercase, and 1 digit',
    wrongCredentials: 'Your email or password is incorrect, try again.',
    success: 'Dashboard',
  },
  otp: {
    invalid: 'Invalid OTP',
    expired: 'OTP expired',
  },
  vault: {
    created: 'Vault created successfully',
    otpRequired: 'OTP is required',
  },
} as const;

/** Page selectors — override per-environment if needed */
export const selectors = {
  loginForm: {
    email: e2eConfig.accounts.owner.emailPlaceholder || 'Enter email address',
    password: e2eConfig.accounts.owner.passwordPlaceholder || 'Enter password',
    submit: e2eConfig.accounts.owner.submitButton || 'Continue',
    otpInput: 'Please enter OTP character 1',
    otpSubmit: e2eConfig.accounts.owner.totpSubmitButton || 'Verify',
  },
} as const;
```

### 2. Update POM classes to use test-data (after Phase 2)
```diff
// e2e/pages/login.page.ts
+ import { selectors, accounts } from '../data/test-data';

  get emailInput() {
-   return this.page.getByPlaceholder(
-     this.account('owner').emailPlaceholder || 'Enter email address'
-   );
+   return this.page.getByPlaceholder(selectors.loginForm.email);
  }
```

### 3. Update features to use Scenario Outline (optional)
Thay vì hardcode invalid values:
```gherkin
# Before:
Scenario: Login validation - invalid email format
  When I fill "email" with "notanemail"

# After (optional — chỉ khi cần parameterize):
Scenario Outline: Login validation
  When I fill "email" with "<email>"
  Then I should see "<error>"
  Examples:
    | email       | error                    |
    | notanemail  | Email address is invalid |
    | @bad.com    | Email address is invalid |
```

Nhưng **KHÔNG bắt buộc** — hiện tại features vẫn readable với hardcoded values. Chỉ refactor khi có nhu cầu.

### 4. Update global-setup.ts to use test-data (after Phase 1)
```diff
// e2e/global-setup.ts
+ import { accounts } from './data/test-data';

- const account = e2eConfig.accounts.owner;
+ const account = accounts.owner;
```

## What NOT to do
- **NO faker.js** — E2E tests cần deterministic data, không random
- **NO data builders/factories** — overkill cho UI tests
- **NO DB seeding** — E2E tests dùng real app state
- **NO environment matrix** — chỉ 1 env (staging), thêm khi cần

## Risks
- **Low risk**: Phase này chỉ extract constants, không thay đổi behavior
- **Coupling**: `messages` constants phải match actual UI text. Nếu UI text thay đổi → update 1 file thay vì nhiều features
- **Over-extraction**: Chỉ extract values dùng 2+ lần. Single-use values giữ inline

## TODO
- [ ] Create `e2e/data/test-data.ts`
- [ ] Update POM classes (after Phase 2) → import từ test-data
- [ ] Update `e2e/global-setup.ts` (after Phase 1) → import accounts
- [ ] Verify: all tests pass unchanged
- [ ] Optional: refactor features dùng Scenario Outline cho validation cases
