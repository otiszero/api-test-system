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
```

## Project Structure

```
config/           ← QC điền vào (PHẢI có trước khi generate)
  api.config.json       baseUrl, timeout, headers
  auth.config.json      auth type, roles, accounts
  db.config.json        DB connection (enabled/disabled)
  test-rules.md         business rules, permission matrix, scenarios

input/            ← QC copy openapi.yaml vào đây

generated/        ← AI sinh ra, không tay chỉnh
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
3. Validate mọi response against OpenAPI schema (dùng ajv)
4. Verify DB state sau mỗi write operation (nếu `db.config.enabled = true`)
5. Mỗi test suite self-contained: tự setup data, tự cleanup trong `afterAll`
6. Respect dependency order từ `dependency-graph.json`: tạo parent resources trước child

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
npx vitest run                          # chạy tất cả
npx vitest run --reporter=verbose       # verbose output
npx vitest run generated/tests/01-smoke # chỉ smoke layer
npx vitest run --reporter=html          # HTML report → html/index.html
npx tsc --noEmit                        # type check
```
