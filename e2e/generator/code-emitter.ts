/**
 * Code emitter — takes a parsed feature + step catalog matches
 * and emits a complete Playwright .spec.ts file as a string.
 */

import { ParsedFeature, ParsedScenario, ParsedStep, ParsedBackground } from './feature-parser.js';
import { matchStep } from '../steps/catalog.js';
import { UnmatchedStep } from '../steps/types.js';

export interface EmitResult {
  code: string;
  totalSteps: number;
  matchedCount: number;
  unmatchedSteps: UnmatchedStep[];
}

/**
 * Emit a complete .spec.ts file from a parsed feature.
 */
export function emitSpecFile(feature: ParsedFeature, featureFileName: string): EmitResult {
  const unmatched: UnmatchedStep[] = [];
  let totalSteps = 0;
  let matchedCount = 0;

  // Detect if any scenario uses API steps (to conditionally import helpers)
  const allStepTexts = collectAllStepTexts(feature);
  const hasApiSteps = allStepTexts.some((t) => t.startsWith('API:'));
  const hasUiSteps = allStepTexts.some((t) => !t.startsWith('API:'));
  const isApiOnly = feature.tags.includes('@api-only');

  // Build imports
  const lines: string[] = [];
  lines.push(`// Auto-generated from: features/${featureFileName}`);
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push(`// DO NOT EDIT — regenerate with /generate-e2e ${featureFileName.replace('.feature', '')}`);
  lines.push('');
  lines.push("import { test, expect } from '@playwright/test';");

  if (hasUiSteps || !isApiOnly) {
    lines.push("import e2eConfig from '../../config/e2e.config.json';");
  }
  if (hasApiSteps) {
    lines.push("import { apiClient } from '../../generated/helpers/api-client.js';");
    lines.push("import { authHelper } from '../../generated/helpers/auth-helper.js';");
  }

  lines.push('');

  // Feature describe block
  lines.push(`test.describe('${escapeQuotes(feature.name)}', () => {`);

  // Background → test.beforeEach
  if (feature.background) {
    lines.push('');
    const fixture = isApiOnly ? '' : '{ page }';
    lines.push(`  test.beforeEach(async (${fixture}) => {`);
    for (const step of feature.background.steps) {
      totalSteps++;
      const result = matchStep(step.text);
      if (result.matched && result.code) {
        matchedCount++;
        for (const codeLine of result.code.split('\n')) {
          lines.push(`    ${codeLine}`);
        }
      } else {
        unmatched.push({
          scenarioName: 'Background',
          keyword: step.keyword,
          text: step.text,
          lineNumber: step.line,
        });
        lines.push(`    // TODO: [AI] ${step.keyword} ${step.text}`);
      }
    }
    lines.push('  });');
  }

  // Each scenario → test block
  for (const scenario of feature.scenarios) {
    lines.push('');
    const scenarioHasUiSteps = scenario.steps.some((s) => !s.text.startsWith('API:'));
    const scenarioIsApiOnly = !scenarioHasUiSteps || scenario.tags.includes('@api-only');
    const fixture = scenarioIsApiOnly ? '' : '{ page }';

    lines.push(`  test('${escapeQuotes(scenario.name)}', async (${fixture}) => {`);
    lines.push('    const ctx = { variables: new Map<string, any>(), lastApiResponse: null as any };');

    for (const step of scenario.steps) {
      totalSteps++;
      const result = matchStep(step.text);
      if (result.matched && result.code) {
        matchedCount++;
        for (const codeLine of result.code.split('\n')) {
          lines.push(`    ${codeLine}`);
        }
      } else {
        unmatched.push({
          scenarioName: scenario.name,
          keyword: step.keyword,
          text: step.text,
          lineNumber: step.line,
        });
        lines.push(`    // TODO: [AI] ${step.keyword} ${step.text}`);
      }

      // Handle data tables — emit fill commands for field/value tables
      if (step.dataTable && step.dataTable.length >= 2) {
        const headers = step.dataTable[0];
        const fieldIdx = headers.indexOf('field');
        const valueIdx = headers.indexOf('value');
        if (fieldIdx !== -1 && valueIdx !== -1) {
          for (let i = 1; i < step.dataTable.length; i++) {
            const field = step.dataTable[i][fieldIdx];
            const value = step.dataTable[i][valueIdx];
            lines.push(`    await page.locator('[data-testid="${field}"]').fill('${escapeQuotes(value)}');`);
          }
        }
      }
    }

    lines.push('  });');
  }

  lines.push('});');
  lines.push('');

  return {
    code: lines.join('\n'),
    totalSteps,
    matchedCount,
    unmatchedSteps: unmatched,
  };
}

/** Collect all step texts from a feature (including background) */
function collectAllStepTexts(feature: ParsedFeature): string[] {
  const texts: string[] = [];
  if (feature.background) {
    texts.push(...feature.background.steps.map((s) => s.text));
  }
  for (const scenario of feature.scenarios) {
    texts.push(...scenario.steps.map((s) => s.text));
  }
  return texts;
}

/** Escape characters that could break generated string literals */
function escapeQuotes(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
