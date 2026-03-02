import { beforeEach, afterEach, afterAll } from 'vitest';
import { evidenceStore } from './generated/helpers/evidence-store';
import { apiClient } from './generated/helpers/api-client';
import * as fs from 'fs';
import * as path from 'path';

// Track current test context
let currentTestName = '';
let currentSuiteName = '';

beforeEach((context) => {
  currentTestName = context.task.name;
  currentSuiteName = context.task.suite?.name || 'Root';
  evidenceStore.setCurrentTest(currentTestName, currentSuiteName);

  // Clear evidence for this test (api-client collects per-request)
  apiClient.clearEvidence();
});

afterEach(() => {
  // Collect evidence from api-client for this test
  const requestEvidence = apiClient.getAllEvidence();

  for (const req of requestEvidence) {
    evidenceStore.addEvidence({
      method: req.method,
      url: req.fullUrl,
      requestHeaders: req.headers,
      requestBody: req.body,
      responseStatus: req.response.status,
      responseBody: req.response.body,
      duration: req.duration,
      curl: req.curl,
      timestamp: req.timestamp,
    });
  }

  evidenceStore.clearCurrentTest();
});

afterAll(() => {
  // Save all collected evidence
  evidenceStore.save();

  // Generate detailed HTML report with evidence
  generateDetailedReport();
});

function generateDetailedReport() {
  const evidence = evidenceStore.load();
  if (evidence.length === 0) return;

  const outputPath = path.resolve(process.cwd(), 'reports/detailed-evidence.html');

  // Group by test
  const byTest = evidence.reduce((acc, e) => {
    const key = `${e.testSuite}::${e.testName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {} as Record<string, typeof evidence>);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Evidence Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
    .header { background: #1e293b; padding: 20px 32px; border-bottom: 1px solid #334155; }
    .header h1 { font-size: 1.4rem; }
    .stats { display: flex; gap: 16px; padding: 20px 32px; background: #1e293b; }
    .stat { background: #0f172a; padding: 16px; border-radius: 8px; min-width: 100px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
    .container { padding: 20px 32px; }

    .test-group { background: #1e293b; border-radius: 8px; margin-bottom: 16px; overflow: hidden; border: 1px solid #334155; }
    .test-group-header { padding: 12px 16px; cursor: pointer; background: #0f172a; }
    .test-group-header:hover { background: #1e293b; }
    .test-group-header h3 { font-size: 0.9rem; }
    .test-group-header .suite { font-size: 0.75rem; color: #64748b; }
    .test-group-body { display: none; }
    .test-group.open .test-group-body { display: block; }

    .request { border-top: 1px solid #334155; padding: 16px; }
    .request-line { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .method { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .method.GET { background: #22c55e20; color: #22c55e; }
    .method.POST { background: #3b82f620; color: #3b82f6; }
    .method.PUT { background: #f59e0b20; color: #f59e0b; }
    .method.DELETE { background: #ef444420; color: #ef4444; }
    .method.PATCH { background: #8b5cf620; color: #8b5cf6; }
    .url { font-family: monospace; font-size: 0.875rem; flex: 1; word-break: break-all; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .status.success { background: #22c55e20; color: #22c55e; }
    .status.error { background: #ef444420; color: #ef4444; }
    .duration { font-size: 0.75rem; color: #64748b; }

    .section { margin-bottom: 12px; }
    .section-label { font-size: 0.7rem; color: #64748b; margin-bottom: 4px; text-transform: uppercase; font-weight: 600; }
    .code { background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 0.8rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }
    .code.json { color: #a5f3fc; }
    .code.curl { color: #86efac; }

    .copy-btn { background: #334155; border: none; color: #e2e8f0; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-top: 8px; }
    .copy-btn:hover { background: #475569; }
    .copy-btn:active { background: #22c55e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Evidence Report</h1>
    <p style="color: #64748b; font-size: 0.875rem;">Generated: ${new Date().toISOString()}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${Object.keys(byTest).length}</div>
      <div style="color: #64748b; font-size: 0.75rem;">TESTS WITH EVIDENCE</div>
    </div>
    <div class="stat">
      <div class="stat-value">${evidence.length}</div>
      <div style="color: #64748b; font-size: 0.75rem;">API CALLS</div>
    </div>
  </div>

  <div class="container">
    ${Object.entries(byTest).map(([key, requests], idx) => {
      const [suite, ...nameParts] = key.split('::');
      const name = nameParts.join('::');
      return `
    <div class="test-group ${idx < 3 ? 'open' : ''}">
      <div class="test-group-header" onclick="this.parentElement.classList.toggle('open')">
        <h3>${escapeHtml(name)}</h3>
        <div class="suite">${escapeHtml(suite)} - ${requests.length} request(s)</div>
      </div>
      <div class="test-group-body">
        ${requests.map(req => `
        <div class="request">
          <div class="request-line">
            <span class="method ${req.method}">${req.method}</span>
            <span class="url">${escapeHtml(req.url)}</span>
            <span class="status ${req.responseStatus < 400 ? 'success' : 'error'}">${req.responseStatus}</span>
            <span class="duration">${req.duration}ms</span>
          </div>

          ${req.requestBody ? `
          <div class="section">
            <div class="section-label">Request Body</div>
            <div class="code json">${escapeHtml(JSON.stringify(req.requestBody, null, 2))}</div>
          </div>` : ''}

          <div class="section">
            <div class="section-label">Response Body</div>
            <div class="code json">${escapeHtml(JSON.stringify(req.responseBody, null, 2))}</div>
          </div>

          <div class="section">
            <div class="section-label">Curl Command</div>
            <div class="code curl">${escapeHtml(req.curl)}</div>
            <button class="copy-btn" onclick="copyToClipboard(this, \`${escapeHtml(req.curl).replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">Copy Curl</button>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
    }).join('')}
  </div>

  <script>
    function copyToClipboard(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Curl', 1500);
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
  console.log(`\\n📋 Evidence report: ${outputPath}`);
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
