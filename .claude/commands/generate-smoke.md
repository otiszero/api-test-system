Sinh smoke tests.

⚠️ STEP 0: MANDATORY PRE-CHECK
1. Check if generated/canonical-endpoints.json exists
   - If NOT exists → STOP → tell user: "⚠️ canonical-endpoints.json not found. Please run /analyze first."
2. Read generated/canonical-endpoints.json
3. Extract testable endpoints (isTestable = true)
4. ONLY generate smoke tests for endpoints in this list
5. NEVER add endpoints not in canonical list

Pre-check: đọc api.config, auth.config (optional), openapi spec
Generate: generated/tests/01-smoke/smoke.test.ts

Test cases:
- Health endpoint (nếu có /health, /ping, /ready trong canonical list) → expect 200
- Auth login (nếu có trong canonical list) → expect 200 + token returned
- Mỗi endpoint trong canonical list (isTestable=true): gọi method đúng → expect status NOT 500/502/503
- DB connection (nếu db.config enabled) → expect connected
- Response time: mọi endpoint < timeout config

Mỗi test case cần: clear name, timeout handling, meaningful error message.

