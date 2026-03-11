# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

Bạn là Senior QA Engineer. Nhận lệnh từ QC qua slash commands để phân tích API, sinh test, chạy test, và báo cáo. Output bằng tiếng Việt khi QC dùng tiếng Việt.

## Workflow (slash commands)

```
/init          → setup project, cài npm packages, tạo config templates
/assess        → chấm điểm config completeness, ước tính coverage
/analyze       → parse OpenAPI, sinh test-plan.md + dependency-graph.json
/generate-all  → sinh toàn bộ 7 layers (theo thứ tự)
/generate-smoke|contract|single|integration|rbac|security|db  → sinh từng layer
/run [layer] [resource]  → chạy tests qua vitest
/report        → sinh 4 report files vào reports/
/coverage      → hiển thị endpoint × layer matrix (không cần chạy test)
/view-report [type] [resource]  → xem chi tiết report đã tạo (latest, assessment, bugs, etc.)
/list-reports                    → liệt kê tất cả reports với metadata

# E2E Testing (Playwright + Gherkin)
/describe-e2e [feature]  → QC mô tả bằng ngôn ngữ tự nhiên → AI sinh .feature file
/generate-e2e [feature]  → parse .feature, match catalog, AI for unmatched, output .spec.ts
/run-e2e [feature|flags] → chạy E2E tests qua Playwright (--headed, --trace, --debug)
```

## Project Structure

```
config/           ← QC điền vào (PHẢI có trước khi generate)
  api.config.json       baseUrl, timeout, headers
  auth.config.json      auth type, roles, accounts
  db.config.json        DB connection (enabled/disabled)
  suites.config.json    reusable E2E prerequisite suites (@needs tags)
  test-rules.md         business rules, permission matrix, scenarios

input/            ← QC copy openapi.yaml vào đây

generated/        ← AI sinh ra, không tay chỉnh
  canonical-endpoints.json  SOURCE OF TRUTH - danh sách endpoints chính thức
  helpers/              api-client, auth-helper, db-client, schema-validator,
                        test-data-factory, cleanup, dependency-resolver
  tests/
    01-smoke/
    02-contract/
    03-single/
    04-integration/
    05-rbac/
    06-security/
    07-db/
  test-plan.md
  dependency-graph.json

reports/          ← AI sinh ra
  latest-report.md
  bugs-found.md
  coverage-matrix.md
  ai-summary.md

e2e/              ← E2E testing module (Playwright + Gherkin)
  features/           QC writes .feature files here (Given/When/Then)
  steps/              step definition catalog (pattern → Playwright code)
  generator/          feature-parser, code-emitter, generator orchestrator
  generated/          AI-generated Playwright .spec.ts files
  pages/              Page Object Models (optional)
  playwright.config.ts
```

## Tech Stack

- **Test runner**: Vitest + TypeScript
- **HTTP client**: axios
- **Schema validation**: ajv + ajv-formats (validate against OpenAPI schemas)
- **Test data**: @faker-js/faker (realistic data, không dùng "test123")
- **DB client**: auto-detect từ `db.config.json` → pg / mysql2 / mongodb

## Core Rules

1. Luôn đọc `config/` trước khi làm bất kỳ việc gì
2. **Respect endpoint filters**: Đọc `api.config.json` → `endpointFilter` để skip blacklisted endpoints
3. **ZERO HALLUCINATION**: ONLY use endpoints from `generated/canonical-endpoints.json` (see Anti-Hallucination System below)
4. Validate mọi response against OpenAPI schema (dùng ajv)
5. Verify DB state sau mỗi write operation (nếu `db.config.enabled = true`)
6. Mỗi test suite self-contained: tự setup data, tự cleanup trong `afterAll`
7. Respect dependency order từ `dependency-graph.json`: tạo parent resources trước child

## Anti-Hallucination System

### Canonical Endpoint Manifest

**File**: `generated/canonical-endpoints.json`

This file contains the definitive list of all testable endpoints extracted from OpenAPI spec with filters applied.

**CRITICAL RULES**:
- This is the ONLY source of truth for what endpoints exist
- AI MUST read this file before generating any tests
- AI MUST NOT generate tests for endpoints not in this file
- AI MUST NOT assume endpoints exist based on common patterns

### Example Hallucinations to AVOID

❌ **NEVER assume these patterns exist**:
- `/markets/new-markets` (doesn't exist, actual: `/markets/proposed`)
- `/markets/popular-markets` (doesn't exist, actual: `/markets/favorites`)
- `/auth/me`, `/auth/logout` without checking canonical file first
- Admin endpoints that might be blacklisted

### Workflow

1. **First time setup**:
   ```bash
   /analyze  # Extracts endpoints → canonical-endpoints.json
   ```

2. **Generate tests**:
   ```bash
   /generate-single  # Reads canonical-endpoints.json, only generates for listed endpoints
   ```

3. **After OpenAPI spec changes**:
   ```bash
   /analyze          # Re-extract endpoints
   /generate-all     # Re-generate all tests with new endpoint list
   ```

### How It Prevents Hallucination

❌ **Old way (hallucination possible)**:
- AI reads instructions: "generate tests for each endpoint"
- AI infers endpoints from patterns, permission matrix, common APIs
- AI generates tests for endpoints that don't exist → 404 errors

✅ **New way (hallucination impossible)**:
- Script extracts exact endpoints from OpenAPI spec: `npm run extract-endpoints`
- Applies blacklist/whitelist filters
- Writes `canonical-endpoints.json`
- AI reads this file BEFORE generating
- AI only generates for endpoints in this file with `isTestable: true`
- No room for inference or assumptions

### Canonical Endpoint Format

```json
{
  "metadata": {
    "generatedAt": "2026-02-27T...",
    "totalEndpoints": 68,
    "testableEndpoints": 42,
    "blacklistedEndpoints": 26
  },
  "endpoints": [
    {
      "method": "GET",
      "path": "/markets",
      "operationId": "MarketController_findAll",
      "tags": ["Markets"],
      "isTestable": true,
      "blacklistReason": null
    }
  ],
  "byResource": {
    "Markets": ["GET /markets", "POST /markets/market", ...]
  }
}
```

### If Endpoint Missing from Canonical File

If you need an endpoint that's not in `canonical-endpoints.json`:
1. Check `blacklistReason` field → might be blacklisted
2. Check OpenAPI spec → might be missing from spec
3. Ask user to update OpenAPI spec or adjust filters
4. **DO NOT generate tests for it**


## Endpoint Filtering

**Config**: `api.config.json` → `endpointFilter`

### Blacklist Mode (default)
```json
{
  "endpointFilter": {
    "blacklist": ["/admin/*", "*/admin/*"]
  }
}
```
→ Skip tất cả endpoints match patterns. Dùng `*` làm wildcard.

### Whitelist Mode
```json
{
  "endpointFilter": {
    "whitelist": ["/users/*", "/orders/*"]
  }
}
```
→ CHỈ generate cho endpoints match whitelist. Blacklist bị ignore.

### Matching Rules
- `*` = wildcard (match bất kỳ)
- `/admin/*` → match `/admin`, `/admin/users`, `/admin/market/{id}`
- `*/admin/*` → match `/auth/admin/login`, `/api/admin/users`
- Case-sensitive
- Match path only (không match method)

**Important**: Khi generate tests, luôn:
1. Parse `endpointFilter` từ `api.config.json`
2. Filter endpoints TRƯỚC khi sinh test code
3. Log số endpoints filtered: `Skipped 26/68 endpoints (blacklist)`
4. Update coverage calculations dựa trên filtered list

## Test Layers & Config Dependencies

| Layer | Hard deps (chặn) | Soft deps (giảm coverage) |
|---|---|---|
| 🟢 Smoke | openapi | api-config, auth-config |
| 🔵 Contract | openapi | api-config, auth-config |
| 🟡 Single API | openapi, api-config | auth-config, test-rules, db-config |
| 🟠 Integration | openapi, api-config, **test-rules** | auth-config, db-config |
| 🔐 RBAC | openapi, auth-config (2+ roles) | test-rules/permission-matrix |
| ⚫ Security | openapi, api-config | auth-config, test-rules |
| 🟣 DB Integrity | **db-config** | openapi, db-schema, test-rules |

**Integration guard**: nếu `test-rules.md` chỉ có template mẫu → dừng, không generate. AI không tự suy đoán business logic.

**RBAC guard**: cần 2+ roles + tối thiểu 2 accounts cùng role (cho IDOR tests).

## Commands (sau /init)

```bash
# Extract canonical endpoints (run after OpenAPI changes)
npm run extract-endpoints            # Parse OpenAPI → canonical-endpoints.json

# Run tests
npx vitest run                          # chạy tất cả
npx vitest run --reporter=verbose       # verbose output
npx vitest run generated/tests/01-smoke # chỉ smoke layer
npx vitest run --reporter=html          # HTML report → html/index.html
npx tsc --noEmit                        # type check
```

## Viewing Reports

After running tests or assessments, use these commands to view results:

### View Specific Report
```bash
/view-report                    # Latest test results
/view-report assessment         # Config assessment (v3)
/view-report test-results       # Test execution analysis
/view-report blacklist          # Endpoint filtering
/view-report bugs               # Bug reports (if generated)
/view-report coverage           # Coverage matrix (if generated)
```

### List All Reports
```bash
/list-reports                   # Show all available reports with metadata
```

### Filter Reports by Resource
```bash
/view-report test-results markets    # Show only markets-related results
/view-report bugs orders              # Show only orders bugs
```

### Report Workflow
```
1. Run tests:        /run single
2. View results:     /view-report test-results
3. Generate reports: /report
4. View bugs:        /view-report bugs
5. List all:         /list-reports
```
