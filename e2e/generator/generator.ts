/**
 * Generator orchestrator — reads .feature files, parses them,
 * matches steps against the catalog, and emits .spec.ts files.
 * Entry point for both CLI usage and slash command integration.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { parseFeature } from './feature-parser.js';
import { emitSpecFile, EmitResult } from './code-emitter.js';
import { UnmatchedStep } from '../steps/types.js';

export interface GeneratorResult {
  featureName: string;
  featureFile: string;
  outputPath: string;
  totalSteps: number;
  matchedSteps: number;
  unmatchedSteps: UnmatchedStep[];
  matchRate: number;
  generatedCode: string;
}

/** Generate a .spec.ts from a single .feature file */
export function generateFromFeature(featurePath: string, outputDir: string): GeneratorResult {
  const content = readFileSync(featurePath, 'utf-8');
  const fileName = basename(featurePath);
  const featureName = fileName.replace('.feature', '');

  const parsed = parseFeature(content, fileName);
  const emitResult = emitSpecFile(parsed, fileName);

  const outputPath = resolve(outputDir, `${featureName}.spec.ts`);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, emitResult.code, 'utf-8');

  const matchRate = emitResult.totalSteps > 0
    ? Math.round((emitResult.matchedCount / emitResult.totalSteps) * 100)
    : 100;

  return {
    featureName,
    featureFile: featurePath,
    outputPath,
    totalSteps: emitResult.totalSteps,
    matchedSteps: emitResult.matchedCount,
    unmatchedSteps: emitResult.unmatchedSteps,
    matchRate,
    generatedCode: emitResult.code,
  };
}

/** Generate specs for all .feature files in a directory */
export function generateAll(featuresDir: string, outputDir: string): GeneratorResult[] {
  if (!existsSync(featuresDir)) {
    throw new Error(`Features directory not found: ${featuresDir}`);
  }

  const featureFiles = readdirSync(featuresDir)
    .filter((f) => f.endsWith('.feature'))
    .map((f) => resolve(featuresDir, f));

  if (featureFiles.length === 0) {
    throw new Error(`No .feature files found in ${featuresDir}`);
  }

  return featureFiles.map((f) => generateFromFeature(f, outputDir));
}

/** Print a summary table of generation results */
export function printSummary(results: GeneratorResult[]): string {
  let output = '\n=== E2E Generation Summary ===\n\n';
  output += 'Feature'.padEnd(30) + 'Steps'.padEnd(8) + 'Matched'.padEnd(10) + 'Rate\n';
  output += '-'.repeat(56) + '\n';

  let totalSteps = 0;
  let totalMatched = 0;

  for (const r of results) {
    totalSteps += r.totalSteps;
    totalMatched += r.matchedSteps;
    output += r.featureName.padEnd(30)
      + String(r.totalSteps).padEnd(8)
      + String(r.matchedSteps).padEnd(10)
      + `${r.matchRate}%\n`;
  }

  const overallRate = totalSteps > 0 ? Math.round((totalMatched / totalSteps) * 100) : 100;
  output += '-'.repeat(56) + '\n';
  output += 'TOTAL'.padEnd(30)
    + String(totalSteps).padEnd(8)
    + String(totalMatched).padEnd(10)
    + `${overallRate}%\n`;

  if (results.some((r) => r.unmatchedSteps.length > 0)) {
    output += '\nUnmatched steps (need AI interpretation):\n';
    for (const r of results) {
      for (const u of r.unmatchedSteps) {
        output += `  [${r.featureName}] ${u.keyword} ${u.text} (line ${u.lineNumber})\n`;
      }
    }
  }

  return output;
}

// CLI entrypoint: tsx e2e/generator/generator.ts [featureName]
const isCLI = process.argv[1]?.includes('generator');
if (isCLI) {
  const rootDir = resolve(process.argv[1], '../../..');
  const featuresDir = resolve(rootDir, 'e2e/features');
  const outputDir = resolve(rootDir, 'e2e/generated');
  const featureName = process.argv[2];

  try {
    let results: GeneratorResult[];
    if (featureName) {
      const featurePath = resolve(featuresDir, `${featureName}.feature`);
      if (!existsSync(featurePath)) {
        console.error(`Feature file not found: ${featurePath}`);
        process.exit(1);
      }
      results = [generateFromFeature(featurePath, outputDir)];
    } else {
      results = generateAll(featuresDir, outputDir);
    }

    console.log(printSummary(results));

    for (const r of results) {
      console.log(`Written: ${r.outputPath}`);
    }
  } catch (err: any) {
    console.error('Generation failed:', err.message);
    process.exit(1);
  }
}
