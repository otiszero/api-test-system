/**
 * Navigation step definitions — page routing and URL assertions.
 * Each entry maps a Gherkin pattern to a Playwright code template.
 */

import { StepDef } from './types.js';

export const navigationSteps: StepDef[] = [
  {
    pattern: 'I am on the "{page}" page',
    generateCode: ([page]) =>
      `await page.goto(e2eConfig.pages['${page}'] || '/${page}');`,
  },
  {
    pattern: 'I navigate to "{url}"',
    generateCode: ([url]) => `await page.goto('${url}');`,
  },
  {
    pattern: 'the URL should contain "{path}"',
    generateCode: ([path]) =>
      `await expect(page).toHaveURL(new RegExp('${path}'));`,
  },
  {
    pattern: 'the URL should be "{url}"',
    generateCode: ([url]) => `await expect(page).toHaveURL('${url}');`,
  },
  {
    pattern: 'I go back',
    generateCode: () => `await page.goBack();`,
  },
  {
    pattern: 'I refresh the page',
    generateCode: () => `await page.reload();`,
  },
];
