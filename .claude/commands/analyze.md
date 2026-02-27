Phân tích OpenAPI spec, sinh test plan và dependency graph.

Việc cần làm:
1. Parse input/openapi.yaml (hoặc .json)
2. Extract: endpoints (method+path+operationId), request schemas, response schemas per status code, path params, query params, security requirements, enums
3. Group endpoints by resource (dựa trên path prefix: /users/*, /products/*)
4. Build dependency graph: nếu POST /orders body có user_id (ref đến User) → users trước orders
5. Kết hợp với config/test-rules.md: đánh dấu critical endpoints, thêm business rules
6. Estimate test count per layer
7. Output:
   - generated/test-plan.md: full test plan với test cases per endpoint per layer
   - generated/dependency-graph.json: { resources, dependencies, executionOrder }
8. In summary: resources found, dependency order, estimated tests per layer, total, est. runtime
