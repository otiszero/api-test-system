import * as fs from 'fs';
import * as path from 'path';
import { apiClient, RequestEvidence } from '../helpers/api-client';

/**
 * Generate detailed HTML report from collected evidence
 */
function generateReport() {
  const evidence = apiClient.getAllEvidence();
  const outputPath = path.join(__dirname, '../../reports/detailed-report.html');

  if (evidence.length === 0) {
    console.log('No evidence collected. Run tests first.');
    return;
  }

  const stats = {
    total: evidence.length,
    success: evidence.filter(e => e.response.status < 400).length,
    failed: evidence.filter(e => e.response.status >= 400).length,
    duration: evidence.reduce((sum, e) => sum + e.duration, 0),
  };

  const html = generateHtml(evidence, stats);
  fs.writeFileSync(outputPath, html);
  console.log(`Report generated: ${outputPath}`);
}

function generateHtml(evidence: RequestEvidence[], stats: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Evidence Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
    .header { background: #1e293b; padding: 20px 32px; border-bottom: 1px solid #334155; }
    .header h1 { font-size: 1.4rem; }
    .stats { display: flex; gap: 16px; padding: 20px 32px; background: #1e293b; }
    .stat { background: #0f172a; padding: 16px; border-radius: 8px; min-width: 100px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .stat-value.success { color: #22c55e; }
    .stat-value.failed { color: #ef4444; }
    .container { padding: 20px 32px; }
    .request { background: #1e293b; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
    .request-header { padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; }
    .request-header:hover { background: #334155; }
    .method { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .method.GET { background: #22c55e20; color: #22c55e; }
    .method.POST { background: #3b82f620; color: #3b82f6; }
    .method.PUT { background: #f59e0b20; color: #f59e0b; }
    .method.DELETE { background: #ef444420; color: #ef4444; }
    .url { flex: 1; font-family: monospace; font-size: 0.875rem; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
    .status.success { background: #22c55e20; color: #22c55e; }
    .status.error { background: #ef444420; color: #ef4444; }
    .duration { font-size: 0.75rem; color: #64748b; }
    .request-detail { display: none; padding: 16px; background: #0f172a; border-top: 1px solid #334155; }
    .request.open .request-detail { display: block; }
    .section { margin-bottom: 16px; }
    .section-label { font-size: 0.7rem; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
    .code { background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 0.8rem; overflow-x: auto; white-space: pre-wrap; }
    .code.json { color: #a5f3fc; }
    .code.curl { color: #86efac; }
    .copy-btn { background: #334155; border: none; color: #e2e8f0; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-top: 8px; }
    .copy-btn:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Test Evidence Report</h1>
    <p style="color: #64748b; font-size: 0.875rem;">Generated: ${new Date().toISOString()}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${stats.total}</div>
      <div style="color: #64748b; font-size: 0.75rem;">REQUESTS</div>
    </div>
    <div class="stat">
      <div class="stat-value success">${stats.success}</div>
      <div style="color: #64748b; font-size: 0.75rem;">SUCCESS</div>
    </div>
    <div class="stat">
      <div class="stat-value failed">${stats.failed}</div>
      <div style="color: #64748b; font-size: 0.75rem;">FAILED</div>
    </div>
    <div class="stat">
      <div class="stat-value">${(stats.duration / 1000).toFixed(1)}s</div>
      <div style="color: #64748b; font-size: 0.75rem;">DURATION</div>
    </div>
  </div>

  <div class="container">
    ${evidence.map((e, i) => `
    <div class="request" id="req-${i}">
      <div class="request-header" onclick="toggleRequest(${i})">
        <span class="method ${e.method}">${e.method}</span>
        <span class="url">${escapeHtml(e.url)}</span>
        <span class="status ${e.response.status < 400 ? 'success' : 'error'}">${e.response.status}</span>
        <span class="duration">${e.duration}ms</span>
      </div>
      <div class="request-detail">
        ${e.body ? `
        <div class="section">
          <div class="section-label">Request Body</div>
          <div class="code json">${escapeHtml(JSON.stringify(e.body, null, 2))}</div>
        </div>` : ''}

        <div class="section">
          <div class="section-label">Response (${e.response.status} ${e.response.statusText})</div>
          <div class="code json">${escapeHtml(JSON.stringify(e.response.body, null, 2))}</div>
        </div>

        <div class="section">
          <div class="section-label">Curl Command</div>
          <div class="code curl">${escapeHtml(e.curl)}</div>
          <button class="copy-btn" onclick="copyText(\`${escapeHtml(e.curl).replace(/`/g, '\\`')}\`)">Copy Curl</button>
        </div>
      </div>
    </div>
    `).join('')}
  </div>

  <script>
    function toggleRequest(i) {
      document.getElementById('req-' + i).classList.toggle('open');
    }
    function copyText(text) {
      navigator.clipboard.writeText(text);
      event.target.textContent = 'Copied!';
      setTimeout(() => event.target.textContent = 'Copy Curl', 1500);
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export { generateReport };
