# Gherkin → Playwright: Executive Summary

## Quick Answer

**Best Approach for Your API Test System**: Static code generation + reusable step library

---

## Tools Assessment

| Tool | Status | Best For | Token Cost |
|------|--------|----------|-----------|
| **playwright-bdd** | ✅ Active | Runtime BDD, Playwright-first | Recurring |
| **cucumber-js** | ✅ Mature | General BDD, cross-project | Recurring |
| **Static Generation** | 🏗️ Custom | API tests, deterministic specs | **One-time** |

---

## Key Decision Matrix

```
Runtime BDD (playwright-bdd)
├─ Pros: Native BDD feel, easy modifications
├─ Cons: 200-500ms overhead per test, recurring token cost
└─ Use: Exploratory/manual testing

Static Code Generation
├─ Pros: Native Vitest speed, lower token cost, full IDE support
├─ Cons: Custom scaffolding, regeneration management
└─ Use: ✅ API test systems (YOUR CASE)

Manual Playwright (status quo)
├─ Pros: Maximum control, no framework overhead
├─ Cons: High token cost per test, no code reuse
└─ Use: One-off tests, ad-hoc scenarios
```

---

## Token Cost Comparison

| Approach | Setup | Per-Test | Regeneration | Winner |
|----------|-------|----------|--------------|--------|
| Runtime BDD | 8K | 2K | 3K/change | ❌ Expensive |
| Static Gen | 10K | 2K | 1K/feature | ✅ **Best** |
| Manual | 0 | 8K | 8K/change | ❌ Worst |

---

## Recommended Architecture

```
features/templates/
├── crud.feature           # Reusable patterns (5K tokens, write once)
├── auth.feature
├── error-scenarios.feature
└── pagination.feature

generated/steps/
├── context.ts            # Shared test context (1K)
├── api-steps.ts          # HTTP, auth, validation (1K)
└── catalog.ts            # Step registry (1K)

generated/tests/
├── 01-smoke/*.test.ts    # Auto-generated from templates (2K)
└── 03-single/*.test.ts
```

---

## Step Definition Best Practices (Minimize AI Burden)

**DO**:
- ✅ Parameterized steps: `When user calls {method} {path} with {data}`
- ✅ Explicit selectors: `When user clicks "{selector}"`
- ✅ Typed parameters: `Given user is authenticated as {role}`
- ✅ Step registry: Single catalog of available steps
- ✅ Shared context: Pass TestContext to all steps

**DON'T**:
- ❌ Natural language: `When user clicks the login button` (needs NLP)
- ❌ Implicit assumptions: `When user creates a resource` (which resource?)
- ❌ Complex logic in features: Keep features data-driven
- ❌ Scattered steps: Central registry prevents drift

---

## Hybrid UI + API Testing

Use this pattern for cross-layer validation:

```typescript
// Fast API setup
Given('user has 5 markets created via API', ...)

// UI verification
When('user navigates to /markets page', ...)
Then('user should see all 5 markets', ...)

// State verification via API (no UI clicking)
And('API should show markets as "published"', ...)

// Fast cleanup
After(cleanup via API)
```

**Result**: Tests are 10x faster than UI-only, maintain business logic verification.

---

## Implementation Roadmap

**Phase 1** (Weeks 1-2): Step definition library
- Create context.ts, api-steps.ts, auth-steps.ts
- Implement step registry (50 common steps)
- Total: ~8 hours, 3K tokens

**Phase 2** (Week 3): Feature templates
- Write CRUD, auth, error, pagination templates
- Test with 10-15 endpoints
- Total: ~6 hours, 5K tokens

**Phase 3** (Week 4): Code generator
- Build TypeScript generator (200-300 lines)
- Integrate with `/generate-*` commands
- Total: ~12 hours, 2K tokens

**Phase 4** (Ongoing): Scale to full suite
- Generate tests for all 68 endpoints
- Maintain step library as new patterns emerge

---

## Unresolved Questions

1. How to auto-regenerate feature templates when OpenAPI spec changes?
2. Should steps support Gherkin data tables (vs. simple parameters)?
3. Should step library be extracted to shared npm package?
4. Version-control strategy for generated tests?

---

## References

- **Report**: `/Users/trung.hoang/Desktop/api-test-system/plans/reports/researcher-260308-1946-gherkin-playwright-research.md`
- **Tech Stack**: Playwright + Vitest + TypeScript + axios
- **Pattern**: BDD semantics + deterministic API test generation
