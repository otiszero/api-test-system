Chạy tests. Argument optional: layer name hoặc "layer resource".

Ví dụ:
- /run → chạy tất cả
- /run smoke → chỉ smoke
- /run single → chỉ single API
- /run single users → chỉ single API cho users resource
- /run rbac → chỉ RBAC

Execution:
1. Chạy vitest với pattern match theo argument
2. Nếu /run (all): chạy theo thứ tự layer. Smoke fail → cảnh báo + hỏi tiếp không.
3. Capture per test: name, status, duration, failure details
4. Failure evidence: request (method, url, headers, body) + response (status, body) + DB state (nếu có)
5. In realtime progress
6. Cuối: summary table (layer × pass × fail × skip × duration)
7. Tự động suggest /report nếu có failures
