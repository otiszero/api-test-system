Sinh security tests.

Pre-check: openapi spec, api.config, auth.config (optional)
Generate: generated/tests/06-security/{category}.test.ts

Categories:
1. Authentication: mọi protected endpoint no token → 401, expired → 401, malformed → 401, brute force → 429
2. Authorization/IDOR: (nếu có 2+ roles) User A access User B → 403
3. SQL Injection: inject payloads vào query params, body fields, path params. Payloads: ' OR 1=1--, '; DROP TABLE--, UNION SELECT, etc.
4. XSS: inject <script>alert(1)</script> vào string fields → check response escaped
5. Data Exposure: response KHÔNG chứa password/hash/secret/token/stack_trace. Error messages không leak internal info.
6. Rate Limiting: gửi nhiều requests nhanh → eventually 429

Không có auth.config → skip auth/authz tests, chỉ test injection + data exposure.
