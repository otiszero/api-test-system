import * as fs from 'fs';
import * as path from 'path';
import type { File, Reporter, Task, TaskResultPack } from 'vitest';

interface TestEvidence {
  name: string;
  suite: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

/**
 * Custom Vitest Reporter that generates detailed HTML report
 * with request/response evidence for each test
 */
export default class DetailedHtmlReporter implements Reporter {
  private tests: TestEvidence[] = [];
  private startTime: number = 0;

  onInit() {
    this.startTime = Date.now();
    this.tests = [];
  }

  onTaskUpdate(packs: TaskResultPack[]) {
    // Collect test results as they complete
  }

  onFinished(files?: File[]) {
    if (!files) return;

    // Collect all test results
    for (const file of files) {
      this.collectTests(file.tasks, file.name);
    }

    // Generate detailed HTML report
    this.generateReport();
  }

  private collectTests(tasks: Task[], fileName: string) {
    for (const task of tasks) {
      if (task.type === 'test') {
        const result = task.result;
        this.tests.push({
          name: task.name,
          suite: task.suite?.name || 'Root',
          file: fileName,
          status: result?.state === 'pass' ? 'passed' :
                  result?.state === 'fail' ? 'failed' : 'skipped',
          duration: result?.duration || 0,
          error: result?.errors?.[0]?.message,
        });
      } else if (task.type === 'suite' && task.tasks) {
        this.collectTests(task.tasks, fileName);
      }
    }
  }

  private generateReport() {
    const outputPath = path.resolve(process.cwd(), 'reports/detailed-report.html');
    const totalDuration = Date.now() - this.startTime;

    const stats = {
      total: this.tests.length,
      passed: this.tests.filter(t => t.status === 'passed').length,
      failed: this.tests.filter(t => t.status === 'failed').length,
      skipped: this.tests.filter(t => t.status === 'skipped').length,
      duration: totalDuration,
    };

    const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';

    // Group by file/layer
    const byFile = this.tests.reduce((acc, t) => {
      const layer = this.extractLayer(t.file);
      if (!acc[layer]) acc[layer] = [];
      acc[layer].push(t);
      return acc;
    }, {} as Record<string, TestEvidence[]>);

    const html = this.generateHtml(byFile, stats, passRate);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`\n📊 Detailed HTML report: ${outputPath}`);
  }

  private extractLayer(filePath: string): string {
    const match = filePath.match(/(\d{2}-\w+)/);
    return match ? match[1] : 'other';
  }

  private generateHtml(
    byLayer: Record<string, TestEvidence[]>,
    stats: { total: number; passed: number; failed: number; skipped: number; duration: number },
    passRate: string
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
    }

    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 24px 32px;
      border-bottom: 1px solid #334155;
    }
    .header h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; }
    .header .meta { font-size: 0.875rem; color: #94a3b8; }

    .stats {
      display: flex;
      gap: 16px;
      padding: 24px 32px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      flex-wrap: wrap;
    }
    .stat {
      background: #0f172a;
      padding: 16px 24px;
      border-radius: 8px;
      min-width: 120px;
    }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
    .stat-passed .stat-value { color: #22c55e; }
    .stat-failed .stat-value { color: #ef4444; }
    .stat-total .stat-value { color: #3b82f6; }

    .progress-bar {
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
    }

    .container { padding: 24px 32px; }

    .layer {
      margin-bottom: 24px;
      background: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .layer-header {
      padding: 16px 20px;
      background: #0f172a;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .layer-header:hover { background: #1e293b; }
    .layer-title { display: flex; align-items: center; gap: 12px; }
    .layer-icon { font-size: 1.25rem; }
    .layer-name { font-weight: 600; }
    .layer-stats { display: flex; gap: 16px; font-size: 0.875rem; }
    .layer-stats .pass { color: #22c55e; }
    .layer-stats .fail { color: #ef4444; }

    .layer-body { display: none; }
    .layer.open .layer-body { display: block; }

    .test { border-top: 1px solid #334155; }
    .test-header {
      padding: 12px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .test-header:hover { background: rgba(255,255,255,0.02); }
    .test-status {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }
    .test-status.passed { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .test-status.failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .test-status.skipped { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
    .test-info { flex: 1; min-width: 0; }
    .test-name { font-weight: 500; font-size: 0.9rem; }
    .test-suite { font-size: 0.75rem; color: #64748b; }
    .test-duration { font-size: 0.75rem; color: #64748b; }

    .test-detail {
      display: none;
      padding: 16px 20px;
      background: #0f172a;
      border-top: 1px solid #334155;
    }
    .test.open .test-detail { display: block; }

    .error-box {
      background: #7f1d1d20;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 12px;
      color: #fca5a5;
      font-family: monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .filters {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .filter-btn {
      background: #334155;
      border: none;
      color: #e2e8f0;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .filter-btn:hover { background: #475569; }
    .filter-btn.active { background: #3b82f6; }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .info-box {
      background: #1e40af20;
      border: 1px solid #1e40af;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .info-box h3 { color: #60a5fa; margin-bottom: 8px; }
    .info-box p { font-size: 0.875rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Test Evidence Report</h1>
    <div class="meta">
      Generated: ${new Date().toISOString()} |
      Duration: ${(stats.duration / 1000).toFixed(2)}s |
      Pass Rate: ${passRate}%
    </div>
  </div>

  <div class="stats">
    <div class="stat stat-total">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat stat-passed">
      <div class="stat-value">${stats.passed}</div>
      <div class="stat-label">Passed</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${passRate}%"></div>
      </div>
    </div>
    <div class="stat stat-failed">
      <div class="stat-value">${stats.failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.skipped}</div>
      <div class="stat-label">Skipped</div>
    </div>
  </div>

  <div class="container">
    <div class="info-box">
      <h3>Request/Response Details</h3>
      <p>Click on any test to see error details. For full request/response evidence with curl commands,
      run tests with evidence collection enabled or check <code>reports/integration-evidence.md</code>.</p>
    </div>

    <div class="toolbar">
      <div class="filters">
        <button class="filter-btn active" onclick="filterTests('all')">All</button>
        <button class="filter-btn" onclick="filterTests('passed')">Passed</button>
        <button class="filter-btn" onclick="filterTests('failed')">Failed</button>
      </div>
    </div>

    ${Object.entries(byLayer).map(([layer, tests]) => {
      const layerPassed = tests.filter(t => t.status === 'passed').length;
      const layerFailed = tests.filter(t => t.status === 'failed').length;
      const layerIcon = this.getLayerIcon(layer);

      return `
    <div class="layer ${layerFailed > 0 ? 'open' : ''}" data-layer="${layer}">
      <div class="layer-header" onclick="toggleLayer(this)">
        <div class="layer-title">
          <span class="layer-icon">${layerIcon}</span>
          <span class="layer-name">${layer}</span>
        </div>
        <div class="layer-stats">
          <span class="pass">✓ ${layerPassed}</span>
          <span class="fail">✗ ${layerFailed}</span>
          <span>${tests.length} tests</span>
        </div>
      </div>
      <div class="layer-body">
        ${tests.map(test => this.renderTest(test)).join('')}
      </div>
    </div>`;
    }).join('')}
  </div>

  <script>
    function toggleLayer(el) {
      el.parentElement.classList.toggle('open');
    }

    function toggleTest(el) {
      el.parentElement.classList.toggle('open');
    }

    function filterTests(status) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('.test').forEach(test => {
        if (status === 'all') {
          test.style.display = '';
        } else {
          test.style.display = test.dataset.status === status ? '' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;
  }

  private getLayerIcon(layer: string): string {
    const icons: Record<string, string> = {
      '01-smoke': '🟢',
      '02-contract': '🔵',
      '03-single': '🟡',
      '04-integration': '🟠',
      '05-rbac': '🔐',
      '06-security': '⚫',
      '07-db': '🟣',
    };
    return icons[layer] || '📋';
  }

  private renderTest(test: TestEvidence): string {
    const statusIcon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';

    return `
        <div class="test ${test.error ? 'open' : ''}" data-status="${test.status}">
          <div class="test-header" onclick="toggleTest(this)">
            <div class="test-status ${test.status}">${statusIcon}</div>
            <div class="test-info">
              <div class="test-name">${this.escapeHtml(test.name)}</div>
              <div class="test-suite">${this.escapeHtml(test.suite)}</div>
            </div>
            <div class="test-duration">${test.duration}ms</div>
          </div>
          ${test.error ? `
          <div class="test-detail">
            <div class="error-box">${this.escapeHtml(test.error)}</div>
          </div>` : ''}
        </div>`;
  }

  private escapeHtml(str: string): string {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
