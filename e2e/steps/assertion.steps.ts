/**
 * Assertion step definitions — text visibility, element state, content checks.
 */

import { StepDef } from './types.js';

export const assertionSteps: StepDef[] = [
  {
    pattern: 'I should see "{text}"',
    generateCode: ([text]) =>
      `await expect(page.getByText('${text}').first()).toBeVisible();`,
  },
  {
    pattern: 'I should not see "{text}"',
    generateCode: ([text]) =>
      `await expect(page.getByText('${text}').first()).not.toBeVisible();`,
  },
  {
    pattern: 'element "{selector}" should be visible',
    generateCode: ([sel]) =>
      `await expect(page.locator('${sel}')).toBeVisible();`,
  },
  {
    pattern: 'element "{selector}" should be disabled',
    generateCode: ([sel]) =>
      `await expect(page.locator('${sel}')).toBeDisabled();`,
  },
  {
    pattern: 'element "{selector}" should be enabled',
    generateCode: ([sel]) =>
      `await expect(page.locator('${sel}')).toBeEnabled();`,
  },
  {
    pattern: 'element "{selector}" should contain "{text}"',
    generateCode: ([sel, text]) =>
      `await expect(page.locator('${sel}')).toContainText('${text}');`,
  },
  {
    pattern: 'element "{selector}" should have value "{value}"',
    generateCode: ([sel, value]) =>
      `await expect(page.locator('${sel}')).toHaveValue('${value}');`,
  },
  {
    pattern: 'the page title should be "{title}"',
    generateCode: ([title]) =>
      `await expect(page).toHaveTitle('${title}');`,
  },
  {
    pattern: 'I should see {count} "{selector}" elements',
    generateCode: ([count, sel]) =>
      `await expect(page.locator('${sel}')).toHaveCount(${count});`,
  },
  {
    pattern: 'element "{selector}" should have text "{text}"',
    generateCode: ([sel, text]) =>
      `await expect(page.locator('${sel}')).toHaveText('${text}');`,
  },
  {
    pattern: 'element "{selector}" should not be visible',
    generateCode: ([sel]) =>
      `await expect(page.locator('${sel}')).not.toBeVisible();`,
  },
  {
    pattern: 'I should see error "{message}"',
    generateCode: ([msg]) =>
      `await expect(page.locator('[role="alert"], .error, [data-testid*="error"]').first()).toContainText('${msg}');`,
  },
  {
    pattern: 'I should see toast "{message}"',
    generateCode: ([msg]) =>
      `await expect(page.locator('[role="status"], [role="alert"]').first()).toContainText('${msg}');`,
  },
  {
    pattern: 'I should be redirected to "{path}"',
    generateCode: ([path]) =>
      `await page.waitForURL('**${path}');\nawait expect(page).toHaveURL(new RegExp('${path.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}'));`,
  },
  {
    pattern: 'the submit button should be disabled',
    generateCode: () =>
      `await expect(page.getByRole('button', { name: /submit|continue/i })).toBeDisabled();`,
  },
];
