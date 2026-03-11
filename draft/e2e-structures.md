# Architecture Overview

```
e2e-upmount/
├── playwright.config.ts          # Playwright config (projects, timeouts, reporters)
├── .env.staging                  # Environment variables
├── package.json
│
├── config/
│   └── env.ts                    # Type-safe env config
│
├── src/
│   ├── pages/                    # 🔵 Page Object Model (POM)
│   │   ├── base.page.ts          #   └── Base class: navigate, toast, fill, click
│   │   ├── login.page.ts
│   │   ├── register.page.ts
│   │   ├── two-factor.page.ts    #   └── TOTP generation with otplib
│   │   ├── kyc.page.ts
│   │   ├── kyb.page.ts
│   │   ├── vault.page.ts
│   │   ├── deposit.page.ts
│   │   ├── withdraw.page.ts
│   │   ├── transaction-history.page.ts
│   │   └── index.ts              #   └── Barrel export
│   │
│   ├── api/                      # 🟢 API Client (precondition setup)
│   │   └── api-client.ts         #   └── Register, login, KYC, KYB, admin actions via API
│   │
│   ├── fixtures/                 # 🟡 Playwright Fixtures (DI)
│   │   ├── test.fixture.ts       #   └── Inject page objects + API client
│   │   └── authenticated.fixture.ts  # └── Pre-authenticated browser state
│   │
│   ├── helpers/                  # 🔴 Utilities
│   │   └── utils.ts              #   └── waitForTransaction, retry, randomId
│   │
│   └── data/                     # 📦 Test Data
│       └── test-data.ts          #   └── Centralized constants (KYC, KYB, vault, etc.)
│
└── tests/                        # 🧪 Test Suites (by business flow)
    ├── global.setup.ts           # Pre-authenticate shared account
    ├── onboarding/
    │   └── onboarding.spec.ts    # Register → Login → 2FA
    ├── verification/
    │   └── verification.spec.ts  # KYC → KYB → Admin Approve
    ├── vault/
    │   └── vault.spec.ts         # Create vault with assets
    ├── deposit/
    │   └── deposit.spec.ts       # Deposit → Verify tx history
    ├── withdraw/
    │   └── withdraw.spec.ts      # Withdraw → Verify tx history
    └── smoke/
        └── full-happy-path.spec.ts  # Full E2E (pre-release only)
```