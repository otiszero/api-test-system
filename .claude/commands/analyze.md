Phân tích OpenAPI spec, sinh test plan và dependency graph.

Việc cần làm:

STEP 0: EXTRACT CANONICAL ENDPOINTS
1. Chạy extraction script: npm run extract-endpoints
2. Verify file generated/canonical-endpoints.json đã được tạo
3. File này là SOURCE OF TRUTH duy nhất cho danh sách endpoints
4. Log summary: "Found X total endpoints, Y testable, Z blacklisted"

STEP 1: ANALYZE CANONICAL ENDPOINTS
1. Read generated/canonical-endpoints.json
2. Use ONLY endpoints where isTestable = true
3. Extract thông tin cho mỗi endpoint:
   - method, path, operationId (đã có sẵn trong canonical file)
   - request schemas, response schemas (đọc từ OpenAPI spec)
   - path params, query params (đã có sẵn hasPathParams/hasQueryParams)
   - security requirements (đã có sẵn trong canonical file)

STEP 2: BUILD DEPENDENCIES & PLAN
1. Group endpoints by resource (dùng tags từ canonical file)
2. Build dependency graph: nếu POST /orders body có user_id → users trước orders
3. Kết hợp với config/test-rules.md: đánh dấu critical endpoints, business rules
4. Estimate test count per layer (chỉ count testable endpoints)

STEP 3: OUTPUT
1. generated/test-plan.md: full test plan với test cases per endpoint per layer
   - CHỈ bao gồm endpoints có isTestable = true
   - Note số endpoints bị blacklist ở đầu file
2. generated/dependency-graph.json: { resources, dependencies, executionOrder }
3. In summary:
   - Resources found
   - Dependency order
   - Estimated tests per layer (dựa trên testable endpoints only)
   - Total endpoints: X (Y testable, Z blacklisted)
   - Est. runtime

⚠️ CRITICAL RULE: NEVER add endpoints not in canonical-endpoints.json. If you need an endpoint that's not in the list, it's either:
- Blacklisted (check blacklistReason)
- Not in OpenAPI spec (hallucination)
- OpenAPI spec needs to be updated (ask user)

