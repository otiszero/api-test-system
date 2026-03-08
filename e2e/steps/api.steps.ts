/**
 * API hybrid step definitions — HTTP calls, auth, response assertions.
 * Generated code reuses existing api-client.ts and auth-helper.ts helpers.
 */

import { StepDef } from './types.js';

export const apiSteps: StepDef[] = [
  {
    pattern: 'API: user "{role}" is authenticated',
    generateCode: ([role]) =>
      `authHelper.setAuthToken('${role}');`,
  },
  {
    pattern: 'API: GET "{endpoint}" returns {code}',
    generateCode: ([endpoint, code]) =>
      `ctx.lastApiResponse = await apiClient.get('${endpoint}');\nexpect(ctx.lastApiResponse.status).toBe(${code});`,
  },
  {
    pattern: 'API: POST "{endpoint}" returns {code}',
    generateCode: ([endpoint, code]) =>
      `ctx.lastApiResponse = await apiClient.post('${endpoint}');\nexpect(ctx.lastApiResponse.status).toBe(${code});`,
  },
  {
    pattern: 'API: PUT "{endpoint}" returns {code}',
    generateCode: ([endpoint, code]) =>
      `ctx.lastApiResponse = await apiClient.put('${endpoint}');\nexpect(ctx.lastApiResponse.status).toBe(${code});`,
  },
  {
    pattern: 'API: DELETE "{endpoint}" returns {code}',
    generateCode: ([endpoint, code]) =>
      `ctx.lastApiResponse = await apiClient.delete('${endpoint}');\nexpect(ctx.lastApiResponse.status).toBe(${code});`,
  },
  {
    pattern: 'API: response should contain "{field}"',
    generateCode: ([field]) =>
      `expect(ctx.lastApiResponse.data).toHaveProperty('${field}');`,
  },
  {
    pattern: 'API: response "{field}" should equal "{value}"',
    generateCode: ([field, value]) =>
      `expect(ctx.lastApiResponse.data.${field}).toBe('${value}');`,
  },
];
