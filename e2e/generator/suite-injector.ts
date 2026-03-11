/**
 * Suite injector — resolves @needs(suite-name) tags from feature files
 * and injects prerequisite steps into Background before code emission.
 * Supports nested suites with cycle detection.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { ParsedFeature, ParsedStep } from './feature-parser.js';

/** A single suite step definition from config */
interface SuiteStep {
  keyword: string;
  text: string;
}

/** A suite definition from suites.config.json */
interface SuiteDefinition {
  description: string;
  steps?: SuiteStep[];
  needs?: string[];
}

/** The full suites config file structure */
interface SuitesConfig {
  suites: Record<string, SuiteDefinition>;
}

/** Load suites config from disk. Returns null if file doesn't exist. */
export function loadSuitesConfig(rootDir: string): SuitesConfig | null {
  const configPath = resolve(rootDir, 'config/suites.config.json');
  if (!existsSync(configPath)) return null;

  const raw = readFileSync(configPath, 'utf-8');
  const config = JSON.parse(raw) as SuitesConfig;

  if (!config.suites || typeof config.suites !== 'object') {
    throw new Error('suites.config.json: missing or invalid "suites" object');
  }

  return config;
}

/**
 * Parse @needs(...) tags from feature tag list.
 * Supports: @needs(login-owner) and @needs(login-owner, navigate-dashboard)
 * Returns array of suite names.
 */
export function parseNeedsTags(tags: string[]): string[] {
  const suiteNames: string[] = [];

  for (const tag of tags) {
    const match = tag.match(/^@needs\((.+)\)$/);
    if (match) {
      const names = match[1].split(',').map((n) => n.trim()).filter(Boolean);
      suiteNames.push(...names);
    }
  }

  return suiteNames;
}

/**
 * Recursively resolve a suite into a flat list of steps.
 * Handles nested `needs` references with cycle detection.
 */
export function resolveSuite(
  name: string,
  config: SuitesConfig,
  visited: Set<string> = new Set()
): ParsedStep[] {
  if (visited.has(name)) {
    throw new Error(`Circular suite dependency detected: ${[...visited, name].join(' → ')}`);
  }

  const suite = config.suites[name];
  if (!suite) {
    throw new Error(`Suite "${name}" not found in suites.config.json. Available: ${Object.keys(config.suites).join(', ')}`);
  }

  visited.add(name);
  const steps: ParsedStep[] = [];

  // Resolve nested needs first (dependency-first order)
  if (suite.needs && suite.needs.length > 0) {
    for (const depName of suite.needs) {
      const depSteps = resolveSuite(depName, config, new Set(visited));
      steps.push(...depSteps);
    }
  }

  // Then add this suite's own steps
  if (suite.steps && suite.steps.length > 0) {
    for (const step of suite.steps) {
      steps.push({
        keyword: step.keyword,
        text: step.text,
        line: 0, // injected steps have no source line
      });
    }
  }

  return steps;
}

/**
 * Inject suite steps into a ParsedFeature's Background.
 * - Reads @needs tags from feature tags
 * - Resolves all referenced suites
 * - Prepends steps to existing Background (or creates one)
 * - Deduplicates by step text
 */
export function injectSuites(
  feature: ParsedFeature,
  config: SuitesConfig | null
): ParsedFeature {
  const neededSuites = parseNeedsTags(feature.tags);

  // No @needs tags or no config → return unchanged
  if (neededSuites.length === 0 || !config) return feature;

  // Resolve all suite steps in declared order
  const injectedSteps: ParsedStep[] = [];
  for (const suiteName of neededSuites) {
    const steps = resolveSuite(suiteName, config);
    injectedSteps.push(...steps);
  }

  if (injectedSteps.length === 0) return feature;

  // Collect existing background step texts for dedup
  const existingTexts = new Set(
    feature.background?.steps.map((s) => s.text) ?? []
  );

  // Filter out duplicates from injected steps
  const uniqueInjected = injectedSteps.filter((s) => !existingTexts.has(s.text));

  if (uniqueInjected.length === 0) return feature;

  // Merge: injected steps first, then existing background steps
  const mergedSteps = [
    ...uniqueInjected,
    ...(feature.background?.steps ?? []),
  ];

  return {
    ...feature,
    background: { steps: mergedSteps },
  };
}
