Hiển thị chi tiết 1 report file đã được tạo sẵn trong terminal.

Arguments:
- [report-type]: latest | assessment | test-results | blacklist | test-rules | bugs | coverage | summary (default: latest)
- [resource]: optional filter (e.g., "markets", "orders")

Việc cần làm:
1. Parse argument để xác định report type
2. Map report-type to actual filename:
   - latest → reports/single-api-test-results.md (newest test run)
   - assessment → reports/assessment-report-v3.md (latest version)
   - test-results → reports/single-api-test-results.md
   - blacklist → reports/blacklist-summary.md
   - test-rules → reports/test-rules-summary.md
   - bugs → reports/bugs-found.md (if exists)
   - coverage → reports/coverage-matrix.md (if exists)
   - summary → reports/ai-summary.md (if exists)

3. Check file existence:
   - Nếu file không tồn tại → in warning message với gợi ý command để generate (vd: "Run /report để generate bugs-found.md")
   - List available reports với metadata (size, modified time)

4. Read và display file:
   - Show header với metadata (file name, size, last modified)
   - Display full content formatted
   - Nếu có resource filter → grep sections matching resource name
   - Highlight key metrics:
     - Pass rate (✅ green)
     - Failure count (❌ red)
     - Critical/P0 issues (⚠️ yellow)

5. Display footer với actions:
   - "📊 View other reports: /view-report [type]"
   - "🔄 Re-run tests: /run [layer]"
   - "📝 Generate new reports: /report"
   - "📈 Check coverage: /coverage"

6. Special handling cho từng report type:
   - assessment: Show scorecard table + top actions
   - test-results: Show pass/fail summary + critical errors
   - blacklist: Show filtered endpoints count + impact
   - test-rules: Show business rules count + scenarios

Examples:
- /view-report                    → show latest test results
- /view-report assessment         → show config assessment (v3)
- /view-report test-results       → show test execution results
- /view-report blacklist          → show endpoint filtering analysis
- /view-report bugs               → show bugs-found.md (if exists)
- /view-report test-results markets → filter by "markets" resource

Output Format:
═══════════════════════════════════════════
📊 REPORT: Single API Test Results
═══════════════════════════════════════════
📁 File: reports/single-api-test-results.md
📏 Size: 10.2 KB
🕐 Modified: 2026-02-27 11:32

[Full report content here with formatting]

═══════════════════════════════════════════
📌 QUICK ACTIONS:
  • View assessment: /view-report assessment
  • Re-run tests: /run single
  • Generate reports: /report
  • Check coverage: /coverage
═══════════════════════════════════════════
