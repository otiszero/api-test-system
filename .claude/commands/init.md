Khởi tạo project test.

Việc cần làm:
1. Tạo folder structure: config/, input/, generated/tests/, generated/helpers/, reports/
2. Nếu chưa có config files, tạo templates:
   - config/api.config.json: { baseUrl, timeout, headers }
   - config/auth.config.json: { type, roles, accounts, accountSetup }
   - config/db.config.json: { enabled, type, host, port, database, username, password }
   - config/test-rules.md: Template với 8 sections (business rules, resource relations, validation rules, permission matrix, field-level permissions, state machines, integration scenarios, special notes)
3. npm init -y && npm install -D vitest typescript axios ajv ajv-formats yaml @faker-js/faker
4. Detect DB type từ config → install pg / mysql2 / mongodb
5. Tạo vitest.config.ts và tsconfig.json
6. In summary: files tạo được, files CẦN ĐIỀN, next step

Với mỗi config template, thêm _comment giải thích và ví dụ.
Đặc biệt config/test-rules.md phải có template chi tiết cho:
- Permission matrix (bảng endpoint × role, dùng ✅❌🔒)
- Field-level permissions (field nào role nào thấy)
- State machines (vẽ transitions)
- Integration scenarios (viết bằng ngôn ngữ tự nhiên)
