# Plan: E2E Architecture Alignment

## Context
So sánh kiến trúc E2E hiện tại (Gherkin + step catalog + code-emitter) với draft POM-based architecture (`draft/e2e-structures.md`). Xác định 3 gaps cần align.

## Phases

| # | Phase | Priority | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | [Authenticated State (storageState)](#phase-1) | HIGH | Medium | Pending |
| 2 | [Page Object Model](#phase-2) | MEDIUM | Medium | Pending |
| 3 | [Test Data Centralization](#phase-3) | LOW | Small | Pending |

## Dependency
Phase 1 → Phase 2 (POM dùng authenticated fixture) → Phase 3 (test data feed vào POM + fixtures)

Có thể implement Phase 1 độc lập, Phase 2-3 nên làm cùng nhau.

---

## Details → see phase files
- [phase-01-authenticated-state.md](./phase-01-authenticated-state.md)
- [phase-02-page-object-model.md](./phase-02-page-object-model.md)
- [phase-03-test-data-centralization.md](./phase-03-test-data-centralization.md)
