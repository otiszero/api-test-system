Chạy E2E tests. Argument optional: feature name hoặc flags.

Ví dụ:
- /run-e2e → chạy tất cả E2E tests
- /run-e2e login → chỉ chạy login feature
- /run-e2e --headed → chạy với browser visible
- /run-e2e --trace → chạy với trace recording
- /run-e2e --debug → chạy với Playwright Inspector

Pre-check:
1. Verify `e2e/generated/` directory has `.spec.ts` files
   - If empty → tell user: "No generated specs found. Run /generate-e2e first."
2. Read `config/e2e.config.json` for browser/viewport settings

Parse arguments:
- Extract feature name (word without --): maps to `--grep "{feature}"`
- Extract flags: `--headed`, `--trace`, `--debug`

Build and run Playwright command:
```bash
npx playwright test --config=e2e/playwright.config.ts [options]
```

Options mapping:
- Feature name → `--grep "{feature}"`
- `--headed` → `--headed`
- `--trace` → append `--trace on`
- `--debug` → `--debug`

Run command and display realtime output.

After test execution:
- Display summary: passed/failed/skipped counts, total duration
- If failures exist:
  - "View trace: npx playwright show-trace e2e/test-results/{test}/trace.zip"
  - "View HTML report: npx playwright show-report"
  - "Debug specific test: /run-e2e {failed-test} --debug"
- If all passed:
  - "All tests passed!"
  - "Generate reports: /report"
