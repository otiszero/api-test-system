/**
 * Form interaction step definitions — fill, clear, select, check, upload.
 * Selector strategy uses data-testid by default (configurable via e2e.config.json).
 */

import { StepDef } from './types.js';

export const formSteps: StepDef[] = [
  {
    pattern: 'I fill "{field}" with "{value}"',
    generateCode: ([field, value]) =>
      `await page.locator('[data-testid="${field}"]').fill('${value}');`,
  },
  {
    pattern: 'I fill input "{placeholder}" with "{value}"',
    generateCode: ([placeholder, value]) =>
      `await page.getByPlaceholder('${placeholder}').fill('${value}');`,
  },
  {
    pattern: 'I clear input "{placeholder}"',
    generateCode: ([placeholder]) =>
      `await page.getByPlaceholder('${placeholder}').clear();`,
  },
  {
    pattern: 'I clear "{field}"',
    generateCode: ([field]) =>
      `await page.locator('[data-testid="${field}"]').clear();`,
  },
  {
    pattern: 'I select "{option}" from "{dropdown}"',
    generateCode: ([option, dropdown]) =>
      `await page.locator('[data-testid="${dropdown}"]').selectOption('${option}');`,
  },
  {
    pattern: 'I check "{checkbox}"',
    generateCode: ([checkbox]) =>
      `await page.locator('[data-testid="${checkbox}"]').check();`,
  },
  {
    pattern: 'I uncheck "{checkbox}"',
    generateCode: ([checkbox]) =>
      `await page.locator('[data-testid="${checkbox}"]').uncheck();`,
  },
  {
    pattern: 'I upload "{file}" to "{input}"',
    generateCode: ([file, input]) =>
      `await page.locator('[data-testid="${input}"]').setInputFiles('${file}');`,
  },
  {
    pattern: 'I fill input "{placeholder}" with TOTP from secret "{secretKey}"',
    generateCode: ([placeholder, secretKey]) =>
      `await page.getByPlaceholder('${placeholder}').fill(generateTOTP('${secretKey}'));`,
  },
  {
    pattern: 'I fill input "{placeholder}" with TOTP for user "{user}"',
    generateCode: ([placeholder, user]) =>
      `await page.getByPlaceholder('${placeholder}').fill(generateTOTP(e2eConfig.accounts['${user}'].totpSecret));`,
  },
];
