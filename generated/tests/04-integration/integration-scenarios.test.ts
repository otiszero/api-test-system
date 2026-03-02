import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';
import * as fs from 'fs';
import * as path from 'path';

// Load scenarios from config
const scenariosPath = path.join(__dirname, '../../../config/integration-scenarios.json');
const scenariosConfig = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));

interface TestEvidence {
  scenario: string;
  step: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    body: any;
  };
  expected: number | number[];
  passed: boolean;
  duration: number;
  curl: string;
}

const evidence: TestEvidence[] = [];
const savedData: Record<string, any> = {};

/**
 * Generate curl command
 */
function generateCurl(method: string, url: string, headers: Record<string, string>, body?: any): string {
  let curl = `curl -X ${method} "https://api.foreon.network${url}"`;

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== 'content-length') {
      curl += ` \\\n  -H "${key}: ${value}"`;
    }
  }

  if (body && Object.keys(body).length > 0) {
    curl += ` \\\n  -d '${JSON.stringify(body)}'`;
  }

  return curl;
}

/**
 * Replace variables in string (e.g., ${marketList.data[0].id})
 */
function replaceVariables(str: string, data: Record<string, any>): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    try {
      // Handle special variables
      if (expr === 'timestamp') return Date.now().toString();
      if (expr === 'randomId') return Math.floor(Math.random() * 1000).toString();

      // Evaluate expression against saved data
      const fn = new Function(...Object.keys(data), `return ${expr}`);
      const result = fn(...Object.values(data));
      return result?.toString() || match;
    } catch {
      return match;
    }
  });
}

/**
 * Process body with variable replacement
 */
function processBody(body: any, data: Record<string, any>): any {
  if (!body) return undefined;

  const processed: any = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      processed[key] = replaceVariables(value, data);
      // Convert to number if it looks like a number
      if (/^\d+$/.test(processed[key])) {
        processed[key] = parseInt(processed[key], 10);
      }
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

describe('04 - Integration Tests (Scenario-Based)', () => {
  afterAll(() => {
    // Save evidence to file
    const evidencePath = path.join(__dirname, '../../../reports/integration-evidence.json');
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

    // Generate markdown report
    generateEvidenceReport();
  });

  for (const scenario of scenariosConfig.scenarios) {
    describe(`${scenario.id}: ${scenario.name}`, () => {
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepName = `Step ${i + 1}: ${step.action} ${step.endpoint}`;

        it(stepName, async () => {
          const startTime = Date.now();

          // Process endpoint with variables
          const url = replaceVariables(step.endpoint, savedData);

          // Process body with variables
          const body = processBody(step.body, savedData);

          // Setup auth if required
          if (step.auth) {
            authHelper.setAuthToken(step.auth);
          } else if (step.auth === null) {
            apiClient.clearToken();
          }

          // Make request
          let response: any;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (step.auth) {
            const token = authHelper.getToken(step.auth);
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          }

          switch (step.action) {
            case 'GET':
              response = await apiClient.get(url);
              break;
            case 'POST':
              response = await apiClient.post(url, body);
              break;
            case 'PUT':
              response = await apiClient.put(url, body);
              break;
            case 'DELETE':
              response = await apiClient.delete(url);
              break;
            default:
              throw new Error(`Unknown action: ${step.action}`);
          }

          const duration = Date.now() - startTime;

          // Clear auth after request
          if (step.auth) {
            authHelper.clearAuthToken();
          }

          // Save data if requested
          if (step.saveAs && response.data) {
            savedData[step.saveAs] = response.data;
          }

          // Generate curl
          const curl = generateCurl(step.action, url, headers, body);

          // Check expected status
          const expected = Array.isArray(step.expect) ? step.expect : [step.expect];
          const passed = expected.includes(response.status);

          // Record evidence
          evidence.push({
            scenario: `${scenario.id}: ${scenario.name}`,
            step: stepName,
            request: {
              method: step.action,
              url,
              headers,
              body
            },
            response: {
              status: response.status,
              body: truncateBody(response.data)
            },
            expected: step.expect,
            passed,
            duration,
            curl
          });

          // Assert
          expect(expected).toContain(response.status);
        });
      }
    });
  }
});

/**
 * Truncate response body for report
 */
function truncateBody(body: any): any {
  const str = JSON.stringify(body);
  if (str.length > 500) {
    return {
      _truncated: true,
      _preview: str.substring(0, 500) + '...',
      _fullLength: str.length
    };
  }
  return body;
}

/**
 * Generate evidence report markdown
 */
function generateEvidenceReport() {
  let md = '# Integration Test Evidence Report\n\n';
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Scenarios Config:** \`config/integration-scenarios.json\`\n\n`;
  md += '> **💡 Tip:** QC có thể customize scenarios trong file config trên và regenerate tests.\n\n';

  // Summary
  const passed = evidence.filter(e => e.passed).length;
  const failed = evidence.filter(e => !e.passed).length;

  md += '## Summary\n\n';
  md += `| Total | Passed | Failed |\n`;
  md += `|-------|--------|--------|\n`;
  md += `| ${evidence.length} | ✅ ${passed} | ❌ ${failed} |\n\n`;

  // Group by scenario
  const byScenario = evidence.reduce((acc, e) => {
    if (!acc[e.scenario]) acc[e.scenario] = [];
    acc[e.scenario].push(e);
    return acc;
  }, {} as Record<string, TestEvidence[]>);

  for (const [scenario, tests] of Object.entries(byScenario)) {
    md += `---\n\n## ${scenario}\n\n`;

    for (const test of tests) {
      const icon = test.passed ? '✅' : '❌';
      md += `### ${icon} ${test.step}\n\n`;

      // Request
      md += '**Request:**\n';
      md += '```http\n';
      md += `${test.request.method} ${test.request.url}\n`;
      if (test.request.body) {
        md += `\n${JSON.stringify(test.request.body, null, 2)}\n`;
      }
      md += '```\n\n';

      // Response
      md += `**Response:** \`${test.response.status}\`\n`;
      md += '```json\n';
      if (test.response.body?._truncated) {
        md += test.response.body._preview;
      } else {
        md += JSON.stringify(test.response.body, null, 2);
      }
      md += '\n```\n\n';

      // Assertion
      const expectedStr = Array.isArray(test.expected)
        ? test.expected.join(' | ')
        : test.expected;
      md += `**Expected:** ${expectedStr} | **Actual:** ${test.response.status} | **Duration:** ${test.duration}ms\n\n`;

      // Curl
      md += '**Curl (Copy to Retest):**\n';
      md += '```bash\n' + test.curl + '\n```\n\n';
    }
  }

  // Save report
  const reportPath = path.join(__dirname, '../../../reports/integration-evidence.md');
  fs.writeFileSync(reportPath, md);
  console.log(`Evidence report saved to: ${reportPath}`);
}
