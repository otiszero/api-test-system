# Phase 3: Commands & Documentation Update

## Priority: MEDIUM
## Status: pending

## Overview

Wire everything together — create slash commands, update QC guide, update CLAUDE.md.

## Implementation Steps

1. Update `CLAUDE.md`:
   - Add `/describe-e2e` to workflow commands section
   - Add suite injection explanation to E2E structure docs
   - Add `suites.config.json` to project structure

2. Update `e2e/QC-GUIDE.md`:
   - Add "Writing Tests in Plain Language" section with `/describe-e2e` examples
   - Add "Reusable Suites" section explaining `@needs` tags
   - Add suite list reference (from `suites.config.json`)
   - Add Vietnamese/English example conversions

3. Verify end-to-end flow:
   - `/describe-e2e feature-name` → `.feature` file
   - `.feature` with `@needs` tag → `/generate-e2e` → `.spec.ts` with injected Background
   - `/run-e2e` → tests pass

## Todo

- [ ] Update `CLAUDE.md` with new commands and config
- [ ] Update `e2e/QC-GUIDE.md` with describe-e2e and suites sections
- [ ] End-to-end smoke test: describe → generate → verify output

## Success Criteria

- All docs reflect new capabilities
- QC can follow guide to use `/describe-e2e` and `@needs` tags
- No broken references in docs
