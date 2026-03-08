/**
 * Feature parser — reads .feature files and produces a structured AST.
 * Uses @cucumber/gherkin to parse Gherkin syntax.
 */

import * as Gherkin from '@cucumber/gherkin';
import * as Messages from '@cucumber/messages';

/** Parsed step from a feature file */
export interface ParsedStep {
  keyword: string;
  text: string;
  dataTable?: string[][];
  line: number;
}

/** Background block shared across scenarios */
export interface ParsedBackground {
  steps: ParsedStep[];
}

/** Examples table for Scenario Outline */
export interface ParsedExamples {
  name: string;
  headers: string[];
  rows: string[][];
}

/** A single scenario (or expanded outline) */
export interface ParsedScenario {
  name: string;
  tags: string[];
  steps: ParsedStep[];
  examples?: ParsedExamples[];
}

/** Top-level parsed feature */
export interface ParsedFeature {
  name: string;
  description: string;
  tags: string[];
  background?: ParsedBackground;
  scenarios: ParsedScenario[];
}

/**
 * Parse a .feature file content string into a ParsedFeature.
 */
export function parseFeature(content: string, uri: string = 'feature.feature'): ParsedFeature {
  const uuidFn = Messages.IdGenerator.uuid();
  const builder = new Gherkin.AstBuilder(uuidFn);
  const matcher = new Gherkin.GherkinClassicTokenMatcher();
  const parser = new Gherkin.Parser(builder, matcher);

  const gherkinDocument = parser.parse(content);
  const feature = gherkinDocument.feature;

  if (!feature) {
    throw new Error(`No feature found in ${uri}`);
  }

  const result: ParsedFeature = {
    name: feature.name,
    description: feature.description?.trim() || '',
    tags: feature.tags.map((t) => t.name),
    scenarios: [],
  };

  for (const child of feature.children) {
    // Background
    if (child.background) {
      result.background = {
        steps: child.background.steps.map(extractStep),
      };
    }

    // Scenario or Scenario Outline
    if (child.scenario) {
      const scenario = child.scenario;
      const tags = scenario.tags.map((t) => t.name);

      if (scenario.examples && scenario.examples.length > 0) {
        // Scenario Outline → expand with examples
        const expanded = expandScenarioOutline(scenario);
        result.scenarios.push(...expanded);
      } else {
        result.scenarios.push({
          name: scenario.name,
          tags,
          steps: scenario.steps.map(extractStep),
        });
      }
    }
  }

  return result;
}

/** Extract a parsed step from a Gherkin step AST node */
function extractStep(step: Messages.Step): ParsedStep {
  const parsed: ParsedStep = {
    keyword: step.keyword.trim(),
    text: step.text,
    line: step.location.line,
  };

  if (step.dataTable) {
    parsed.dataTable = step.dataTable.rows.map((row) =>
      row.cells.map((cell) => cell.value)
    );
  }

  return parsed;
}

/** Expand a Scenario Outline into concrete scenarios using Examples rows */
function expandScenarioOutline(scenario: Messages.Scenario): ParsedScenario[] {
  const expanded: ParsedScenario[] = [];
  const tags = scenario.tags.map((t) => t.name);

  for (const examples of scenario.examples) {
    if (!examples.tableHeader) continue;

    const headers = examples.tableHeader.cells.map((c) => c.value);

    for (const row of examples.tableBody) {
      const values = row.cells.map((c) => c.value);

      // Build substitution map: <header> → value
      const subs = new Map<string, string>();
      headers.forEach((h, i) => subs.set(h, values[i]));

      // Substitute placeholders in scenario name
      let name = scenario.name;
      for (const [key, val] of subs) {
        name = name.replace(new RegExp(`<${key}>`, 'g'), val);
      }

      // Substitute placeholders in each step text
      const steps = scenario.steps.map((step): ParsedStep => {
        let text = step.text;
        for (const [key, val] of subs) {
          text = text.replace(new RegExp(`<${key}>`, 'g'), val);
        }
        return {
          keyword: step.keyword.trim(),
          text,
          line: step.location.line,
        };
      });

      expanded.push({ name, tags, steps });
    }
  }

  return expanded;
}
