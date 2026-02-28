Sinh single API tests. Argument optional: resource name (vd: /generate-single users).

⚠️ ============================================================
⚠️ CRITICAL: ANTI-HALLUCINATION VALIDATION
⚠️ ============================================================

STEP 0: MANDATORY PRE-CHECK
1. Check if generated/canonical-endpoints.json exists
   - If NOT exists → STOP → tell user: "⚠️ canonical-endpoints.json not found. Please run /analyze first."
   - If exists → continue

2. Read generated/canonical-endpoints.json
3. Extract testable endpoints (isTestable = true)
4. Filter by resource if argument provided (e.g., /generate-single markets → only Markets tag)
5. This is your ONLY source of endpoints
6. NEVER add endpoints not in this list
7. NEVER assume endpoints exist based on patterns

⚠️ CRITICAL RULE: You MUST ONLY generate tests for endpoints that exist in canonical-endpoints.json with isTestable=true. Any endpoint not in this list is HALLUCINATION and will cause test failures.

Example hallucinations to AVOID:
- ❌ /markets/new-markets (doesn't exist, should be /markets/proposed)
- ❌ /markets/popular-markets (doesn't exist, should be /markets/favorites)
- ❌ /auth/me, /auth/logout (check canonical file first)

If you think an endpoint SHOULD exist but it's not in canonical-endpoints.json:
- Check if it's blacklisted (blacklistReason field)
- Check if it's missing from OpenAPI spec (ask user to update spec)
- DO NOT generate tests for it

⚠️ ============================================================

Pre-check: đọc openapi spec, api.config, auth.config, test-rules, db.config
Generate: generated/tests/03-single/{resource}.test.ts

Với MỖI endpoint FROM CANONICAL LIST, generate tests theo nhóm:

NHÓM 1 — Happy Path:
- POST: valid data → 201 + schema valid + DB verify (row exists, values match)
- GET single: valid ID → 200 + schema valid + data matches what was created
- GET list: → 200 + array + pagination meta
- PUT: valid update → 200 + DB verify (values updated, updated_at changed)
- PATCH: partial update → 200 + DB verify (only specified fields changed)
- DELETE: → 200/204 + DB verify (row gone or soft deleted)

NHÓM 2 — Validation (mỗi field trong request body):
- string: null, empty "", max_length+1, special chars, SQL injection payload
- number/integer: null, 0, -1, MAX_INT+1, float (for integer), string "abc"
- email: invalid formats (no @, double @, empty)
- enum: invalid value, empty, case sensitivity
- array: empty [], max+1 items
- required fields: omit each required field one at a time
- optional fields: omit all, include all
→ Expect 400 hoặc 422, KHÔNG PHẢI 500

NHÓM 3 — Error Handling:
- Not found: GET/PUT/DELETE fake ID → 404
- Invalid ID format: string thay vì UUID → 400
- Duplicate: POST trùng unique field → 409
- Auth: no token → 401

NHÓM 4 — Pagination (cho GET list):
- page=1&limit=10 → 10 items
- page=last → remaining items
- page=over → empty array (not error)
- limit=0, limit=-1 → handled gracefully
- Sort: asc/desc
- No duplicate items across pages

NHÓM 5 — DB Verification (nếu db.config enabled):
- POST → SELECT → row exists, values match
- PUT → SELECT → values updated, updated_at changed, other fields unchanged
- DELETE → SELECT → row gone / deleted_at set

Đọc test-rules.md để thêm business validation rules (price > 0, email unique, etc).
Dùng faker cho test data. Cleanup afterAll.
