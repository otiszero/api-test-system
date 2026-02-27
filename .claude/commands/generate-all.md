Sinh toàn bộ tests.

1. Chạy /assess (quick) → check readiness
2. Nếu readiness < 40: cảnh báo "Config quá thiếu" + in action items
3. Tạo helpers trước: api-client, auth-helper, db-client, schema-validator, test-data-factory, cleanup
4. Chạy lần lượt: smoke → contract → single → integration → rbac → security → db
5. Mỗi layer: in progress + kết quả (tests count, files count)
6. Skip layer nào thiếu hard dependency (cảnh báo, KHÔNG crash)
7. In tổng kết: total tests, files, skipped layers, next step
