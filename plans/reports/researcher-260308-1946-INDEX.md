# Gherkin-to-Playwright Research Index

**Completed**: 2026-03-08
**Research Lead**: Researcher Agent
**Project**: API Test System

---

## 📋 Report Files

### 1. Executive Summary (START HERE)
**File**: `researcher-260308-1946-gherkin-playwright-summary.md`

Quick overview of:
- Tools assessment (playwright-bdd vs cucumber-js vs static generation)
- Key decision matrix
- Token cost comparison
- Recommended architecture
- Step definition best practices
- Implementation roadmap

**Time to read**: 8 minutes
**Audience**: Architects, decision-makers

---

### 2. Full Research Report
**File**: `researcher-260308-1946-gherkin-playwright-research.md`

Comprehensive deep-dive covering:
- Existing tools & maintenance status
- Code generation approaches (static vs runtime)
- Step definition catalogs & reusability patterns
- Token cost optimization strategies
- Hybrid UI+API testing patterns
- Project-specific architecture recommendations
- Unresolved questions

**Time to read**: 25 minutes
**Audience**: Technical leads, architects

---

### 3. Technical Deep Dive
**File**: `researcher-260308-1946-gherkin-technical-deep-dive.md`

Implementation-focused details:
- Tool mechanics & overhead analysis
- Code generation patterns (3 examples)
- Step definition architecture
- Context design & example implementations
- Token cost breakdown
- Hybrid testing use cases
- Phase-by-phase implementation checklist

**Time to read**: 35 minutes
**Audience**: Implementation team, developers

---

## 🎯 Key Findings

### Recommended Approach
**Static Code Generation + Reusable Step Library**

Why:
- ✅ Lowest token cost (one-time setup, minimal per-endpoint cost)
- ✅ Native Vitest speed (no runtime interpreter)
- ✅ Full IDE support & debugging
- ✅ Deterministic API tests don't need runtime BDD

### Tools Comparison

| Tool | Status | Best For | Token Cost | Speed |
|------|--------|----------|-----------|-------|
| **playwright-bdd** | ✅ Active | Runtime BDD, Playwright-first | Recurring | -200-500ms |
| **cucumber-js** | ✅ Mature | General BDD, cross-project | Recurring | -300-600ms |
| **Static Generation** | 🏗️ Custom | **API tests (RECOMMENDED)** | **One-time** | **Native** |

### Implementation Cost

```
Initial Setup:        12,500 tokens
Per Endpoint:         200 tokens
Regeneration:         500 tokens (if feature changes)

For 68 endpoints:     ~26,000 tokens total
```

vs. Runtime BDD:
```
Initial Setup:        9,000 tokens
Per Change:           500-1,000 tokens
After 10 changes:     ~14,000-19,000 tokens (+ ongoing)
```

**Static generation breaks even after ~10 feature modifications**

---

## 📊 Decision Framework

### Use Static Code Generation IF:
- ✅ API tests with fully specified endpoints
- ✅ Tests are deterministic (same input → same output)
- ✅ Performance is critical (CI/CD time-sensitive)
- ✅ Budget-conscious on LLM token cost
- ✅ Strong TypeScript team
- ✅ Need full IDE support & type safety

### Use Runtime BDD (playwright-bdd) IF:
- ✅ Stakeholder-facing tests (non-technical audience)
- ✅ Rapid test iteration needed
- ✅ Tests frequently modified (not just data-driven)
- ✅ Budget allows recurring LLM tokens
- ✅ Prefer "pure BDD" feel over performance

### Use cucumber-js IF:
- ✅ Need cross-project step reusability
- ✅ Enterprise CI/CD integration required
- ✅ Multi-team BDD coordination
- ✅ Mature reporting/compliance requirements

---

## 🚀 Next Steps

### Phase 1: Foundation (Weeks 1-2)
- [ ] Design TestContext (shared state object)
- [ ] Implement API client wrapper
- [ ] Implement auth manager
- [ ] Write 50+ reusable step functions

### Phase 2: Generator (Week 3)
- [ ] Build feature parser
- [ ] Implement code generator (200-300 lines TypeScript)
- [ ] Add step validation
- [ ] Create npm script

### Phase 3: Templates (Week 4)
- [ ] Create feature templates (CRUD, auth, errors, validation, pagination)
- [ ] Test on 10-15 endpoints
- [ ] Document patterns

### Phase 4: Scale (Weeks 5+)
- [ ] Generate full 68-endpoint test suite
- [ ] Performance optimization
- [ ] Team training

---

## ❓ Unresolved Questions

1. **Feature Template Versioning**
   - How to auto-regenerate features when OpenAPI spec changes?
   - Should features be version-controlled or regenerated?

2. **Step Definition Scope**
   - Support Gherkin data tables or keep parameters simple?
   - Impact on feature readability vs. complexity?

3. **Cross-Project Reusability**
   - Extract step library to shared npm package?
   - Requires standardization across projects?

4. **Generated Test Management**
   - Version-control generated code or regenerate each time?
   - How to handle manual customizations?

**Recommendation**: Address these after Phase 2 (when generator is functional).

---

## 📚 Related Documentation

- **Project CLAUDE.md**: `/Users/trung.hoang/Desktop/api-test-system/CLAUDE.md`
- **Anti-Hallucination System**: Section 2.3 of CLAUDE.md
- **Canonical Endpoints**: `generated/canonical-endpoints.json`
- **Test Architecture**: `generated/test-plan.md`

---

## 🔗 External Resources (References)

### Tools
- **playwright-bdd**: https://github.com/playwright-bdd/playwright-bdd
- **cucumber-js**: https://github.com/cucumber/cucumber-js
- **Gherkin Parser**: https://github.com/cucumber/gherkin-go

### Documentation
- **Playwright**: https://playwright.dev
- **Vitest**: https://vitest.dev
- **Cucumber**: https://cucumber.io

### Related Patterns
- BDD Best Practices: Behavior-driven development principles
- Step Definition Patterns: Reusable, parameterized test steps
- Hybrid Testing: Mixing API and UI testing in same scenario
- Test Code Generation: Automated test creation from specifications

---

## 📝 Research Methodology

**Search Strategy**:
1. Maintained packages (github activity, npm downloads)
2. Active maintenance status (Q1 2026)
3. Community adoption & ecosystem maturity
4. Technical patterns (code generation, architecture)
5. Token cost optimization (LLM-efficient approaches)
6. Industry best practices (API testing, BDD)

**Sources Consulted**:
- NPM package registries (maintenance status)
- GitHub repository activity (active development)
- Industry documentation (Playwright, Cucumber)
- Architecture patterns (BDD, code generation)
- Cost optimization research (token efficiency)

---

## 📧 Questions or Clarification?

If you need:
- **Quick answer**: Read Executive Summary (8 min)
- **Full context**: Read Full Research Report (25 min)
- **Implementation details**: Read Technical Deep Dive (35 min)
- **Specific tool comparison**: See decision matrix in Summary
- **Token cost analysis**: See token optimization sections
- **Architecture templates**: See Section 6 of Full Research
