Sinh DB integrity tests.

Pre-check: db.config PHẢI enabled. Nếu disabled → cảnh báo, dừng.
Generate: generated/tests/07-db/{category}.test.ts

Categories:
1. Nếu CÓ db-schema.sql: FK constraints, unique, NOT NULL, check constraints → thử violate mỗi cái
2. API ↔ DB consistency: POST qua API → SELECT trực tiếp DB → compare
3. Compare API required fields vs DB NOT NULL → report mismatches
4. Timestamps: created_at set, updated_at changes
5. Từ test-rules: business integrity (stock >= 0, computed fields accuracy, audit log)
