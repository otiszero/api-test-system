Sinh contract tests (response schema validation).

Pre-check: đọc openapi spec (CẦN response schemas), api.config, auth.config
Generate: generated/tests/02-contract/{resource}.contract.test.ts

Với mỗi endpoint + mỗi status code có response schema trong spec:
- Build AJV validator từ OpenAPI schema
- Gọi API → validate response body
- Check: field names, types, required, enum values, nullable, format (email, date, uuid)
- Check: không có extra fields (strict mode: additionalProperties false)
- Check: error response format nhất quán across endpoints

Cần helper: generated/helpers/schema-validator.ts (load OpenAPI, build validators, validate function).
