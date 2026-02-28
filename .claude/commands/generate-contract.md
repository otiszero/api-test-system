Sinh contract tests (response schema validation).

⚠️ STEP 0: MANDATORY PRE-CHECK
1. Check if generated/canonical-endpoints.json exists
   - If NOT exists → STOP → tell user: "⚠️ canonical-endpoints.json not found. Please run /analyze first."
2. Read generated/canonical-endpoints.json
3. Extract testable endpoints (isTestable = true)
4. ONLY generate contract tests for endpoints in this list
5. NEVER add endpoints not in canonical list

Pre-check: đọc openapi spec (CẦN response schemas), api.config, auth.config
Generate: generated/tests/02-contract/{resource}.contract.test.ts

Với mỗi endpoint FROM CANONICAL LIST + mỗi status code có response schema trong spec:
- Build AJV validator từ OpenAPI schema
- Gọi API → validate response body
- Check: field names, types, required, enum values, nullable, format (email, date, uuid)
- Check: không có extra fields (strict mode: additionalProperties false)
- Check: error response format nhất quán across endpoints

Cần helper: generated/helpers/schema-validator.ts (load OpenAPI, build validators, validate function).

