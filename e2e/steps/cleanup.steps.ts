/**
 * Cleanup step definitions — teardown actions for test isolation.
 * Used in @cleanup scenarios, emitted as test.afterAll() blocks.
 */

import { StepDef } from './types.js';

export const cleanupSteps: StepDef[] = [
  {
    pattern: 'cleanup: DELETE "{endpoint}"',
    generateCode: ([endpoint]) =>
      `await apiClient.delete('${endpoint}');`,
  },
  {
    pattern: 'cleanup: clear localStorage',
    generateCode: () =>
      `await page.evaluate(() => localStorage.clear());`,
  },
  {
    pattern: 'cleanup: clear cookies',
    generateCode: () =>
      `await context.clearCookies();`,
  },
  {
    pattern: 'cleanup: reset user "{user}" state',
    generateCode: ([user]) =>
      `await apiClient.post('/test/reset', { data: { user: '${user}' } });`,
  },
];
