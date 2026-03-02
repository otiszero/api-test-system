import * as fs from 'fs';
import * as path from 'path';

/**
 * Evidence entry for API calls
 */
export interface ApiEvidence {
  testName: string;
  testSuite: string;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus: number;
  responseBody?: any;
  duration: number;
  curl: string;
  timestamp: string;
}

/**
 * Global evidence store - persisted to file after each test
 */
class EvidenceStore {
  private evidence: ApiEvidence[] = [];
  private currentTest: { name: string; suite: string } | null = null;
  private outputPath: string;

  constructor() {
    this.outputPath = path.resolve(process.cwd(), 'reports/evidence.json');
  }

  setCurrentTest(name: string, suite: string) {
    this.currentTest = { name, suite };
  }

  clearCurrentTest() {
    this.currentTest = null;
  }

  addEvidence(entry: Omit<ApiEvidence, 'testName' | 'testSuite'>) {
    if (this.currentTest) {
      this.evidence.push({
        ...entry,
        testName: this.currentTest.name,
        testSuite: this.currentTest.suite,
      });
    }
  }

  getEvidence(): ApiEvidence[] {
    return this.evidence;
  }

  clear() {
    this.evidence = [];
  }

  save() {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.outputPath, JSON.stringify(this.evidence, null, 2));
  }

  load(): ApiEvidence[] {
    if (fs.existsSync(this.outputPath)) {
      const data = fs.readFileSync(this.outputPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  }
}

export const evidenceStore = new EvidenceStore();
export default evidenceStore;
