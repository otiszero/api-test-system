Sinh RBAC permission tests.

Pre-check:
- auth.config phải có 2+ roles VÀ accounts cho mỗi role
- Nếu chỉ 1 role → cảnh báo: "Cần tối thiểu 2 roles + 2 user accounts cùng role (cho IDOR)"
- Nếu không có permission matrix trong test-rules.md → cảnh báo nhưng vẫn generate (suy đoán, đánh dấu [GUESSED])

Generate: generated/tests/05-rbac/{type}.test.ts

6 LOẠI RBAC TEST:

TYPE 1 — Endpoint Access Matrix (AI 95%):
Mỗi endpoint × mỗi role → test allowed (200/201) hoặc denied (403) hoặc unauth (401).
Đọc permission matrix từ test-rules.md. Không có → suy đoán từ OpenAPI security + naming convention.

TYPE 2 — IDOR / Resource Ownership (AI 85%):
Cần 2 user accounts cùng role (user_a, user_b).
Cho endpoints có 🔒 trong matrix: User A access User B's resource → 403.
Test: view, edit, delete resource người khác. Admin CÓ THỂ override.

TYPE 3 — Field-level Permissions (AI 50%):
CHỈ generate nếu test-rules.md có field-level permission table.
Mỗi role → check response có/không có sensitive fields.

TYPE 4 — Privilege Escalation (AI 75%):
- User tự đổi role mình → fail
- Lower role quản lý higher role → fail
- Register with admin role → fail
- Access admin endpoints bằng direct URL → fail

TYPE 5 — Role State Change (AI 30%):
CHỈ generate nếu test-rules.md có special RBAC rules.
- Login → ban user → old token bị reject?
- Downgrade role → old permissions mất?
- Upgrade role → new permissions có?

TYPE 6 — Cross-role Interaction (AI 25%):
CHỈ generate nếu test-rules.md có interaction scenarios.
- Editor A tạo resource → Editor B sửa được không?
- Team-based access

In summary: bao nhiêu tests per type, AI confidence per type.
