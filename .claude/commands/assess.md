Đánh giá config completeness và ước lượng test coverage.

Việc cần làm:
1. Check từng config file: tồn tại? đã điền (không phải placeholder)? parse được?
2. OpenAPI spec: tồn tại? valid? đếm endpoints, schemas, security defs
3. API config: baseUrl điền chưa? Thử GET baseUrl → reachable?
4. Auth config: auth type chọn chưa? Bao nhiêu roles? Bao nhiêu accounts? Thử login?
   - RBAC check: có 2+ roles? có 2 user accounts cùng role (cho IDOR)?
   - Có permission matrix trong test-rules.md?
5. DB config: enabled? Thử connect?
6. Test rules: mỗi section có nội dung thật hay chỉ template?
   - Đếm: business rules, permission matrix rows, scenarios, state machines
7. DB schema: tồn tại? parse được? đếm tables? map được với API resources?

Scoring:
- OpenAPI spec: /10
- API config: /5
- Auth config: /10 (thêm điểm cho multi-role, IDOR accounts)
- DB config: /10 (0 nếu disabled)
- Test rules: /20 (quan trọng nhất, chia điểm theo section)
- DB schema: /5

Output format:
- Scorecard table (config × score × status)
- API overview (endpoints, resources, auth method)
- Coverage estimate per layer (% và bottleneck)
- RBAC readiness check (roles, accounts, permission matrix)
- TOP ACTIONS sorted by impact (làm gì để tăng coverage nhiều nhất)
- Kết luận: layers nào sẵn sàng generate, layers nào cần thêm config
