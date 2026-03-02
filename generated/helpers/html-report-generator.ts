import * as fs from 'fs';
import * as path from 'path';
import type { TestEvidence } from './evidence-collector';

/**
 * Generate detailed HTML report with request/response evidence
 */
export function generateDetailedHtmlReport(evidence: TestEvidence[], outputPath: string) {
  const stats = {
    total: evidence.length,
    passed: evidence.filter(e => e.status === 'passed').length,
    failed: evidence.filter(e => e.status === 'failed').length,
    skipped: evidence.filter(e => e.status === 'skipped').length,
    duration: evidence.reduce((sum, e) => sum + e.duration, 0),
  };

  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';

  // Group by layer
  const byLayer = evidence.reduce((acc, e) => {
    if (!acc[e.layer]) acc[e.layer] = [];
    acc[e.layer].push(e);
    return acc;
  }, {} as Record<string, TestEvidence[]>);

  const html = `<!DOCTYPE html>
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
      transition: width 0.3s;
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
    .layer-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .layer-icon { font-size: 1.25rem; }
    .layer-name { font-weight: 600; }
    .layer-stats {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
    }
    .layer-stats .pass { color: #22c55e; }
    .layer-stats .fail { color: #ef4444; }

    .layer-body { display: none; }
    .layer.open .layer-body { display: block; }

    .test {
      border-top: 1px solid #334155;
    }
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

    .detail-section {
      margin-bottom: 16px;
    }
    .detail-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
    }

    .request-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .method {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .method.GET { background: #22c55e20; color: #22c55e; }
    .method.POST { background: #3b82f620; color: #3b82f6; }
    .method.PUT { background: #f59e0b20; color: #f59e0b; }
    .method.DELETE { background: #ef444420; color: #ef4444; }
    .method.PATCH { background: #8b5cf620; color: #8b5cf6; }
    .url { font-family: monospace; font-size: 0.875rem; color: #e2e8f0; }

    .code-block {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8rem;
      line-height: 1.5;
    }
    .code-block pre { white-space: pre-wrap; word-break: break-all; }
    .code-block.json { color: #a5f3fc; }
    .code-block.curl { color: #86efac; }

    .response-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .response-status.success { background: #22c55e20; color: #22c55e; }
    .response-status.error { background: #ef444420; color: #ef4444; }
    .response-status.redirect { background: #f59e0b20; color: #f59e0b; }

    .assertion {
      display: flex;
      gap: 24px;
      padding: 12px;
      background: #1e293b;
      border-radius: 8px;
    }
    .assertion-item { flex: 1; }
    .assertion-label { font-size: 0.7rem; color: #64748b; margin-bottom: 4px; }
    .assertion-value { font-family: monospace; font-size: 0.875rem; }
    .assertion-value.match { color: #22c55e; }
    .assertion-value.mismatch { color: #ef4444; }

    .error-box {
      background: #7f1d1d20;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 12px;
      color: #fca5a5;
      font-family: monospace;
      font-size: 0.8rem;
    }

    .copy-btn {
      background: #334155;
      border: none;
      color: #e2e8f0;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      margin-top: 8px;
    }
    .copy-btn:hover { background: #475569; }
    .copy-btn:active { background: #22c55e; }

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

    .search {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 10px 16px;
      border-radius: 8px;
      width: 300px;
      font-size: 0.875rem;
    }
    .search:focus { outline: none; border-color: #3b82f6; }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .stats { flex-direction: column; }
      .stat { width: 100%; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search { width: 100%; }
    }
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
    <div class="toolbar">
      <div class="filters">
        <button class="filter-btn active" onclick="filterTests('all')">All</button>
        <button class="filter-btn" onclick="filterTests('passed')">Passed</button>
        <button class="filter-btn" onclick="filterTests('failed')">Failed</button>
      </div>
      <input type="text" class="search" placeholder="Search tests..." onkeyup="searchTests(this.value)">
    </div>

    ${Object.entries(byLayer).map(([layer, tests]) => {
      const layerPassed = tests.filter(t => t.status === 'passed').length;
      const layerFailed = tests.filter(t => t.status === 'failed').length;
      const layerIcon = getLayerIcon(layer);

      return `
    <div class="layer" data-layer="${layer}">
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
        ${tests.map(test => renderTest(test)).join('')}
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

    function searchTests(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.test').forEach(test => {
        const name = test.querySelector('.test-name').textContent.toLowerCase();
        const url = test.dataset.url || '';
        test.style.display = name.includes(q) || url.includes(q) ? '' : 'none';
      });
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        event.target.textContent = 'Copied!';
        setTimeout(() => { event.target.textContent = 'Copy'; }, 1500);
      });
    }

    // Open first failed layer by default
    const failedLayer = document.querySelector('.layer:has(.test[data-status="failed"])');
    if (failedLayer) failedLayer.classList.add('open');
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`Detailed HTML report saved to: ${outputPath}`);
}

function getLayerIcon(layer: string): string {
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

function renderTest(test: TestEvidence): string {
  const statusIcon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
  const responseStatusClass = test.response?.status
    ? (test.response.status < 300 ? 'success' : test.response.status < 400 ? 'redirect' : 'error')
    : '';

  return `
        <div class="test" data-status="${test.status}" data-url="${test.request?.url || ''}">
          <div class="test-header" onclick="toggleTest(this)">
            <div class="test-status ${test.status}">${statusIcon}</div>
            <div class="test-info">
              <div class="test-name">${escapeHtml(test.name)}</div>
              <div class="test-suite">${escapeHtml(test.suite)}</div>
            </div>
            <div class="test-duration">${test.duration}ms</div>
          </div>
          <div class="test-detail">
            ${test.request ? `
            <div class="detail-section">
              <div class="detail-label">Request</div>
              <div class="request-line">
                <span class="method ${test.request.method}">${test.request.method}</span>
                <span class="url">${escapeHtml(test.request.url)}</span>
              </div>
              ${test.request.body ? `
              <div class="code-block json">
                <pre>${escapeHtml(JSON.stringify(test.request.body, null, 2))}</pre>
              </div>` : ''}
            </div>` : ''}

            ${test.response ? `
            <div class="detail-section">
              <div class="detail-label">Response</div>
              <div class="response-status ${responseStatusClass}">
                ${test.response.status} ${test.response.statusText || ''}
              </div>
              <div class="code-block json">
                <pre>${escapeHtml(JSON.stringify(test.response.body, null, 2))}</pre>
              </div>
            </div>` : ''}

            ${test.expected !== undefined ? `
            <div class="detail-section">
              <div class="detail-label">Assertion</div>
              <div class="assertion">
                <div class="assertion-item">
                  <div class="assertion-label">Expected</div>
                  <div class="assertion-value">${escapeHtml(JSON.stringify(test.expected))}</div>
                </div>
                <div class="assertion-item">
                  <div class="assertion-label">Actual</div>
                  <div class="assertion-value ${test.status === 'passed' ? 'match' : 'mismatch'}">
                    ${escapeHtml(JSON.stringify(test.actual))}
                  </div>
                </div>
              </div>
            </div>` : ''}

            ${test.error ? `
            <div class="detail-section">
              <div class="detail-label">Error</div>
              <div class="error-box">${escapeHtml(test.error)}</div>
            </div>` : ''}

            ${test.curl ? `
            <div class="detail-section">
              <div class="detail-label">Curl Command</div>
              <div class="code-block curl">
                <pre>${escapeHtml(test.curl)}</pre>
              </div>
              <button class="copy-btn" onclick="copyToClipboard(\`${escapeHtml(test.curl).replace(/`/g, '\\`')}\`)">Copy</button>
            </div>` : ''}
          </div>
        </div>`;
}

function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default generateDetailedHtmlReport;
