/**
 * Central step catalog — registry + pattern matcher.
 * Converts Gherkin {param} placeholders to regex capture groups.
 * Used by the generator to map steps to Playwright code without AI.
 */

import { StepTemplate, StepMatch } from './types.js';
import { navigationSteps } from './navigation.steps.js';
import { formSteps } from './form.steps.js';
import { assertionSteps } from './assertion.steps.js';
import { apiSteps } from './api.steps.js';
import { authSteps } from './auth.steps.js';
import { walletSteps } from './wallet.steps.js';
import { cleanupSteps } from './cleanup.steps.js';

const registry: StepTemplate[] = [];

/**
 * Convert a Gherkin pattern like 'I fill "{field}" with "{value}"'
 * into a regex with named capture groups.
 * - "{param}" → captures quoted string
 * - {param} → captures number
 */
function patternToRegex(pattern: string): { regex: RegExp; params: string[] } {
  const params: string[] = [];
  // Use sentinel tokens to protect placeholders during escaping
  let idx = 0;
  const tokens = new Map<string, { quoted: boolean; name: string }>();

  // Replace "{param}" with sentinel (quoted string placeholder)
  let tokenized = pattern.replace(/"\{(\w+)\}"/g, (_match, name) => {
    const token = `__PLACEHOLDER_${idx++}__`;
    tokens.set(token, { quoted: true, name });
    params.push(name);
    return token;
  });
  // Replace {param} with sentinel (number placeholder)
  tokenized = tokenized.replace(/\{(\w+)\}/g, (_match, name) => {
    const token = `__PLACEHOLDER_${idx++}__`;
    tokens.set(token, { quoted: false, name });
    params.push(name);
    return token;
  });

  // Escape all regex metacharacters in the remaining literal text
  let regexStr = tokenized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace sentinels with actual capture groups
  for (const [token, info] of tokens) {
    if (info.quoted) {
      regexStr = regexStr.replace(token, '"([^"]*)"');
    } else {
      regexStr = regexStr.replace(token, '(\\d+)');
    }
  }

  return { regex: new RegExp(`^${regexStr}$`, 'i'), params };
}

/** Register a step pattern into the catalog */
export function registerStep(
  pattern: string,
  category: StepTemplate['category'],
  generateCode: (args: string[]) => string
): void {
  const { regex, params } = patternToRegex(pattern);
  registry.push({ pattern, regex, params, category, generateCode });
}

/** Match a step text against all registered patterns */
export function matchStep(stepText: string): StepMatch {
  for (const template of registry) {
    const match = stepText.match(template.regex);
    if (match) {
      const args = match.slice(1);
      return {
        matched: true,
        template,
        args,
        code: template.generateCode(args),
      };
    }
  }
  return { matched: false };
}

/** Get all steps that don't match any catalog pattern */
export function getUnmatchedSteps(steps: string[]): string[] {
  return steps.filter((text) => !matchStep(text).matched);
}

/** Get all registered step templates (for QC reference) */
export function getAllSteps(): StepTemplate[] {
  return [...registry];
}

/** Print catalog in human-readable format */
export function printCatalog(): string {
  const grouped = new Map<string, string[]>();
  for (const step of registry) {
    const list = grouped.get(step.category) || [];
    list.push(step.pattern);
    grouped.set(step.category, list);
  }
  let output = '# Step Definition Catalog\n\n';
  for (const [category, patterns] of grouped) {
    output += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
    for (const p of patterns) {
      output += `- ${p}\n`;
    }
    output += '\n';
  }
  return output;
}

// Register all built-in steps from sub-modules
function initCatalog(): void {
  for (const step of navigationSteps) {
    registerStep(step.pattern, 'navigation', step.generateCode);
  }
  for (const step of formSteps) {
    registerStep(step.pattern, 'form', step.generateCode);
  }
  for (const step of assertionSteps) {
    registerStep(step.pattern, 'assertion', step.generateCode);
  }
  for (const step of apiSteps) {
    registerStep(step.pattern, 'api', step.generateCode);
  }
  for (const step of authSteps) {
    registerStep(step.pattern, 'auth', step.generateCode);
  }
  for (const step of walletSteps) {
    registerStep(step.pattern, 'wallet', step.generateCode);
  }
  for (const step of cleanupSteps) {
    registerStep(step.pattern, 'cleanup', step.generateCode);
  }

  // Inline action steps (small set)
  registerStep('I click "{element}"', 'action', ([el]) =>
    `await page.locator('[data-testid="${el}"]').click();`
  );
  registerStep('I click button "{text}"', 'action', ([text]) =>
    `await page.getByRole('button', { name: '${text}' }).click();`
  );
  registerStep('I click link "{text}"', 'action', ([text]) =>
    `await page.getByRole('link', { name: '${text}' }).click();`
  );
  registerStep('I press "{key}"', 'action', ([key]) =>
    `await page.keyboard.press('${key}');`
  );
  registerStep('I wait {seconds} seconds', 'action', ([sec]) =>
    `await page.waitForTimeout(${sec} * 1000);`
  );
  registerStep('I wait for "{selector}" to be visible', 'action', ([sel]) =>
    `await page.locator('${sel}').waitFor({ state: 'visible' });`
  );

  // Inline data steps (small set)
  registerStep('I save "{value}" as "{variable}"', 'data', ([val, varName]) =>
    `ctx.variables.set('${varName}', '${val}');`
  );
  registerStep('I save element "{selector}" text as "{variable}"', 'data', ([sel, varName]) =>
    `ctx.variables.set('${varName}', await page.locator('${sel}').textContent());`
  );
  registerStep('variable "{name}" should equal "{expected}"', 'data', ([name, expected]) =>
    `expect(ctx.variables.get('${name}')).toBe('${expected}');`
  );
}

initCatalog();
