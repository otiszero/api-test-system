Sinh smoke tests.

Pre-check: đọc api.config, auth.config (optional), openapi spec
Generate: generated/tests/01-smoke/smoke.test.ts

Test cases:
- Health endpoint (nếu có /health, /ping, /ready) → expect 200
- Auth login (nếu có) → expect 200 + token returned
- Mỗi endpoint trong spec: gọi method đúng → expect status NOT 500/502/503
- DB connection (nếu db.config enabled) → expect connected
- Response time: mọi endpoint < timeout config

Mỗi test case cần: clear name, timeout handling, meaningful error message.
