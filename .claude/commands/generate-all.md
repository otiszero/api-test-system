Sinh toàn bộ tests.

⚠️ CRITICAL: EXTRACT ENDPOINTS FIRST
1. Chạy /analyze (sẽ tự động extract canonical endpoints)
2. Verify generated/canonical-endpoints.json đã được tạo
3. File này là SOURCE OF TRUTH cho tất cả test generation

Workflow:
1. Chạy /assess (quick) → check readiness
2. Nếu readiness < 40: cảnh báo "Config quá thiếu" + in action items
3. Tạo helpers trước: api-client, auth-helper, db-client, schema-validator, test-data-factory, cleanup
4. Chạy lần lượt: smoke → contract → single → integration → rbac → security → db
   ⚠️ TẤT CẢ các layer PHẢI đọc canonical-endpoints.json và CHỈ generate tests cho endpoints có isTestable=true
5. Mỗi layer: in progress + kết quả (tests count, files count)
6. Skip layer nào thiếu hard dependency (cảnh báo, KHÔNG crash)
7. In tổng kết: total tests, files, skipped layers, next step

