import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    body: any;
    headers?: Record<string, string>;
  };
  expected: number | number[];
  curl: string;
  error?: string;
}

interface TestSuite {
  name: string;
  file: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

class TestReporter {
  private results: TestSuite[] = [];
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate curl command from request
   */
  generateCurl(request: TestResult['request']): string {
    let curl = `curl -X ${request.method}`;
    curl += ` "${this.baseUrl}${request.url}"`;

    // Add headers
    for (const [key, value] of Object.entries(request.headers)) {
      if (key.toLowerCase() !== 'content-length') {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    }

    // Add body
    if (request.body && Object.keys(request.body).length > 0) {
      curl += ` \\\n  -d '${JSON.stringify(request.body)}'`;
    }

    return curl;
  }

  /**
   * Add test result
   */
  addResult(suiteName: string, file: string, result: Omit<TestResult, 'curl'>) {
    let suite = this.results.find(s => s.name === suiteName);
    if (!suite) {
      suite = { name: suiteName, file, tests: [], passed: 0, failed: 0, skipped: 0, duration: 0 };
      this.results.push(suite);
    }

    const curl = this.generateCurl(result.request);
    const testResult: TestResult = { ...result, curl };

    suite.tests.push(testResult);
    suite.duration += result.duration;

    if (result.status === 'passed') suite.passed++;
    else if (result.status === 'failed') suite.failed++;
    else suite.skipped++;
  }

  /**
   * Generate detailed markdown report
   */
  generateMarkdownReport(): string {
    let md = '# Test Execution Report\n\n';
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Base URL:** ${this.baseUrl}\n\n`;

    // Summary
    const totalPassed = this.results.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = this.results.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = this.results.reduce((sum, s) => sum + s.skipped, 0);
    const totalDuration = this.results.reduce((sum, s) => sum + s.duration, 0);

    md += '## Summary\n\n';
    md += '| Metric | Value |\n';
    md += '|--------|-------|\n';
    md += `| Total Tests | ${totalPassed + totalFailed + totalSkipped} |\n`;
    md += `| ✅ Passed | ${totalPassed} |\n`;
    md += `| ❌ Failed | ${totalFailed} |\n`;
    md += `| ⏭️ Skipped | ${totalSkipped} |\n`;
    md += `| Duration | ${(totalDuration / 1000).toFixed(2)}s |\n\n`;

    // Results by suite
    for (const suite of this.results) {
      md += `---\n\n## ${suite.name}\n\n`;
      md += `**File:** \`${suite.file}\`\n`;
      md += `**Results:** ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped\n\n`;

      for (const test of suite.tests) {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        md += `### ${icon} ${test.name}\n\n`;

        md += `**Status:** ${test.status.toUpperCase()} | **Duration:** ${test.duration}ms\n\n`;

        // Request
        md += '#### Request\n\n';
        md += '```http\n';
        md += `${test.request.method} ${test.request.url}\n`;
        for (const [key, value] of Object.entries(test.request.headers)) {
          md += `${key}: ${value}\n`;
        }
        if (test.request.body) {
          md += `\n${JSON.stringify(test.request.body, null, 2)}\n`;
        }
        md += '```\n\n';

        // Response
        md += '#### Response\n\n';
        md += `**Status:** ${test.response.status}\n\n`;
        md += '```json\n';
        md += JSON.stringify(test.response.body, null, 2).substring(0, 1000);
        if (JSON.stringify(test.response.body).length > 1000) {
          md += '\n... (truncated)';
        }
        md += '\n```\n\n';

        // Expected vs Actual
        md += '#### Assertion\n\n';
        md += `| Expected | Actual | Match |\n`;
        md += `|----------|--------|-------|\n`;
        const expectedStr = Array.isArray(test.expected) ? test.expected.join(' or ') : test.expected;
        const match = Array.isArray(test.expected)
          ? test.expected.includes(test.response.status)
          : test.expected === test.response.status;
        md += `| ${expectedStr} | ${test.response.status} | ${match ? '✅' : '❌'} |\n\n`;

        // Error if failed
        if (test.error) {
          md += '#### Error\n\n';
          md += '```\n' + test.error + '\n```\n\n';
        }

        // Curl command
        md += '#### Curl Command (Copy to Retest)\n\n';
        md += '```bash\n' + test.curl + '\n```\n\n';
      }
    }

    return md;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(): object {
    return {
      generatedAt: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        total: this.results.reduce((sum, s) => sum + s.tests.length, 0),
        passed: this.results.reduce((sum, s) => sum + s.passed, 0),
        failed: this.results.reduce((sum, s) => sum + s.failed, 0),
        skipped: this.results.reduce((sum, s) => sum + s.skipped, 0),
        duration: this.results.reduce((sum, s) => sum + s.duration, 0),
      },
      suites: this.results,
    };
  }

  /**
   * Save reports to files
   */
  saveReports(outputDir: string) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Markdown report
    const mdPath = path.join(outputDir, 'test-execution-report.md');
    fs.writeFileSync(mdPath, this.generateMarkdownReport());

    // JSON report
    const jsonPath = path.join(outputDir, 'test-execution-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.generateJsonReport(), null, 2));

    console.log(`Reports saved to:\n  - ${mdPath}\n  - ${jsonPath}`);
  }

  /**
   * Get results
   */
  getResults(): TestSuite[] {
    return this.results;
  }
}

export const createReporter = (baseUrl: string) => new TestReporter(baseUrl);
export default TestReporter;
