/**
 * Core types for the step catalog system.
 * Steps are CODE TEMPLATES consumed at generation time, not runtime.
 */

/** A registered step pattern that maps Gherkin text to Playwright code */
export interface StepTemplate {
  pattern: string;
  regex: RegExp;
  params: string[];
  category: 'navigation' | 'form' | 'assertion' | 'action' | 'api' | 'data';
  generateCode: (args: string[]) => string;
}

/** Result of matching a step against the catalog */
export interface StepMatch {
  matched: boolean;
  template?: StepTemplate;
  args?: string[];
  code?: string;
}

/** An unmatched step that needs AI interpretation */
export interface UnmatchedStep {
  scenarioName: string;
  keyword: string;
  text: string;
  lineNumber: number;
}

/** Step definition used by sub-module files (navigation, form, assertion, api) */
export interface StepDef {
  pattern: string;
  generateCode: (args: string[]) => string;
}
