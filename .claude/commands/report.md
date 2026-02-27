Sinh test report từ kết quả chạy gần nhất.

Sinh 4 files:
1. reports/latest-report.md: Summary table, results by layer, failed tests detail với evidence
2. reports/bugs-found.md: Mỗi failure = 1 bug report (title, severity, endpoint, steps to reproduce bằng curl, expected, actual, evidence). Severity: Critical (security/RBAC bypass, data loss), High (wrong business logic, validation missing), Medium (schema mismatch, wrong status code), Low (performance, minor).
3. reports/coverage-matrix.md: Endpoint × test type matrix (✅❌—)
4. reports/ai-summary.md: AI phân tích patterns trong failures, risk areas, coverage gaps, prioritized recommendations

Tất cả report bằng tiếng Việt nếu QC dùng tiếng Việt.
