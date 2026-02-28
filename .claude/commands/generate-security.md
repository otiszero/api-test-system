Sinh security tests.

⚠️ STEP 0: MANDATORY PRE-CHECK
1. Check if generated/canonical-endpoints.json exists
   - If NOT exists → STOP → tell user: "⚠️ canonical-endpoints.json not found. Please run /analyze first."
2. Read generated/canonical-endpoints.json
3. Extract testable endpoints (isTestable = true)
4. ONLY generate security tests for endpoints in this list
5. NEVER add endpoints not in canonical list

Pre-check: openapi spec, api.config, auth.config (optional)
Generate: generated/tests/06-security/{category}.test.ts

Categories:
1. Authentication: mọi protected endpoint FROM CANONICAL LIST no token → 401, expired → 401, malformed → 401, brute force → 429
2. Authorization/IDOR: (nếu có 2+ roles) User A access User B → 403 (CHỈ endpoints trong canonical list)
3. SQL Injection: inject payloads vào query params, body fields, path params. Payloads: ' OR 1=1--, '; DROP TABLE--, UNION SELECT, etc.
4. XSS: inject <script>alert(1)</script> vào string fields → check response escaped
5. Data Exposure: response KHÔNG chứa password/hash/secret/token/stack_trace. Error messages không leak internal info.
6. Rate Limiting: gửi nhiều requests nhanh → eventually 429

Không có auth.config → skip auth/authz tests, chỉ test injection + data exposure.

