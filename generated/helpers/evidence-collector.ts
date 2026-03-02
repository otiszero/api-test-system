import * as fs from 'fs';
import * as path from 'path';

export interface TestEvidence {
  id: string;
  name: string;
  suite: string;
  layer: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    body: any;
  };
  expected?: any;
  actual?: any;
  error?: string;
  curl?: string;
  timestamp: string;
}

class EvidenceCollector {
  private evidence: TestEvidence[] = [];
  private currentTest: Partial<TestEvidence> | null = null;

  startTest(name: string, suite: string, layer: string) {
    this.currentTest = {
      id: `${layer}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      suite,
      layer,
      timestamp: new Date().toISOString(),
    };
  }

  recordRequest(method: string, url: string, headers: Record<string, string>, body?: any) {
    if (this.currentTest) {
      this.currentTest.request = { method, url, headers, body };
      this.currentTest.curl = this.generateCurl(method, url, headers, body);
    }
  }

  recordResponse(status: number, body: any, headers?: Record<string, string>, statusText?: string) {
    if (this.currentTest) {
      this.currentTest.response = {
        status,
        body: this.truncateBody(body),
        headers,
        statusText
      };
    }
  }

  recordAssertion(expected: any, actual: any) {
    if (this.currentTest) {
      this.currentTest.expected = expected;
      this.currentTest.actual = actual;
    }
  }

  endTest(status: 'passed' | 'failed' | 'skipped', duration: number, error?: string) {
    if (this.currentTest) {
      this.currentTest.status = status;
      this.currentTest.duration = duration;
      if (error) this.currentTest.error = error;
      this.evidence.push(this.currentTest as TestEvidence);
      this.currentTest = null;
    }
  }

  private generateCurl(method: string, url: string, headers: Record<string, string>, body?: any): string {
    let curl = `curl -X ${method} "${url}"`;
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

  private truncateBody(body: any): any {
    const str = JSON.stringify(body);
    if (str && str.length > 1000) {
      return {
        _truncated: true,
        _length: str.length,
        _preview: JSON.parse(str.substring(0, 1000) + '..."}}')
      };
    }
    return body;
  }

  getEvidence(): TestEvidence[] {
    return this.evidence;
  }

  clear() {
    this.evidence = [];
  }
}

export const evidenceCollector = new EvidenceCollector();
export default evidenceCollector;
