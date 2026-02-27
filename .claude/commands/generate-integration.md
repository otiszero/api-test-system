Sinh integration tests.

Pre-check BẮT BUỘC:
- Đọc config/test-rules.md → section "Integration scenarios" và "Business Rules" và "Resource relations"
- NẾU test-rules.md trống hoặc chỉ có template mẫu → IN CẢNH BÁO, DỪNG, KHÔNG generate test sai
  Cảnh báo: "Không thể generate integration tests. test-rules.md cần: business rules (3+), integration scenarios (2+). AI không tự suy đoán business logic."

Generate: generated/tests/04-integration/{scenario-name}.test.ts

NẾU có test-rules:
1. Auto từ dependency graph:
   - Cross-resource CRUD: create parent → create child → verify FK
   - GET after POST: data matches
   - Cascade delete: delete parent → check children
   - Pagination consistency: create N items → paginate all pages → verify no missing/duplicate

2. Từ test-rules scenarios (convert tiếng Việt → code):
   - Mỗi step = 1 API call + assertion
   - DB verify ở checkpoints

3. Từ business rules:
   - Mỗi rule = positive test + negative test
   - Ví dụ: "stock không được < 0" → buy last item → OK, buy khi stock=0 → fail

Mỗi integration test SELF-CONTAINED: tự setup all data, tự cleanup afterAll.
