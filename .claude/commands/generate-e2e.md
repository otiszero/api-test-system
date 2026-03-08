Sinh E2E test từ feature file. Argument optional: feature name (vd: /generate-e2e login).

Pre-check:
1. Verify `e2e/` directory exists (if not → tell user to create e2e/ structure first)
2. Verify `config/e2e.config.json` exists
3. Read `config/e2e.config.json`, `config/api.config.json`, `config/auth.config.json`

If argument provided:
  → Process `e2e/features/{argument}.feature` only
If no argument:
  → Process ALL `.feature` files in `e2e/features/`

For EACH `.feature` file:
1. Read the feature file content
2. Read `e2e/steps/catalog.ts` to understand available step patterns
3. Run the generator: `npx tsx e2e/generator/generator.ts {featureName}`
   - This parses Gherkin, matches steps against catalog, emits .spec.ts
   - MATCHED steps → catalog code template (NO AI cost)
   - UNMATCHED steps → marked with `// TODO: [AI]` comments
4. Read the generated `.spec.ts` file from `e2e/generated/`
5. Find all `// TODO: [AI]` lines in the generated file
6. For each TODO line, AI interprets the step text and generates Playwright code:
   - Use `e2e.config.json` selectorStrategy for element selectors (default: data-testid)
   - Use `e2e.config.json` pages map for page navigation URLs
   - API steps must use existing `api-client.ts` and `auth-helper.ts` helpers
   - Follow Playwright best practices (locators, assertions, waits)
7. Replace all TODO lines with generated code
8. Write updated file back to `e2e/generated/{feature-name}.spec.ts`

Display generation summary:
- Total steps processed
- Catalog-matched steps (no AI cost)
- AI-interpreted steps (token cost)
- Match rate percentage
- If match rate < 50%: suggest adding common steps to catalog

After generation:
- Suggest: "Run tests: /run-e2e {feature}"
- Suggest: "View catalog: Read e2e/steps/catalog.ts"
- If unmatched steps were found: "Consider adding frequent patterns to e2e/steps/ to reduce future AI cost"

IMPORTANT RULES:
- Read the step catalog FIRST before interpreting any steps
- For matched steps, use EXACTLY the catalog's code template — do not modify
- For unmatched steps, generate Playwright code following project patterns
- Generated code must be valid TypeScript — run `npx tsc --noEmit --project e2e/tsconfig.json` to verify
- Respect the selectorStrategy from e2e.config.json
- API hybrid steps (prefixed with "API:") reuse existing helpers, not browser automation
