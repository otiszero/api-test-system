import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ============================================================================
// Type Definitions
// ============================================================================

interface OpenAPISpec {
  openapi: string;
  paths: {
    [path: string]: {
      [method: string]: {
        operationId?: string;
        tags?: string[];
        parameters?: Array<{ in: string; name: string; required?: boolean }>;
        requestBody?: any;
        responses?: any;
        security?: Array<{ [key: string]: string[] }>;
      };
    };
  };
}

interface EndpointFilter {
  blacklist?: string[];
  whitelist?: string[];
}

interface ApiConfig {
  endpointFilter?: EndpointFilter;
}

interface EndpointInfo {
  method: string;
  path: string;
  operationId: string;
  tags: string[];
  hasRequestBody: boolean;
  hasPathParams: boolean;
  hasQueryParams: boolean;
  security: string[];
  isTestable: boolean;
  blacklistReason: string | null;
}

interface CanonicalManifest {
  metadata: {
    generatedAt: string;
    totalEndpoints: number;
    testableEndpoints: number;
    blacklistedEndpoints: number;
    openapiVersion: string;
    sourceFile: string;
  };
  endpoints: EndpointInfo[];
  byResource: { [resource: string]: string[] };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse OpenAPI spec from YAML or JSON file
 */
function parseOpenAPISpec(filePath: string): OpenAPISpec {
  console.log('📖 Parsing OpenAPI spec...');

  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ OpenAPI spec not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  try {
    // Try JSON first
    const spec = JSON.parse(content) as OpenAPISpec;
    console.log('✅ Parsed as JSON');
    return spec;
  } catch (e) {
    // Fall back to YAML
    try {
      const spec = yaml.load(content) as OpenAPISpec;
      console.log('✅ Parsed as YAML');
      return spec;
    } catch (yamlError) {
      throw new Error(`❌ Failed to parse OpenAPI spec: ${yamlError}`);
    }
  }
}

/**
 * Load API config with endpoint filters
 */
function loadApiConfig(): ApiConfig {
  const configPath = path.join(process.cwd(), 'config/api.config.json');

  if (!fs.existsSync(configPath)) {
    console.log('⚠️  api.config.json not found, using empty filters');
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('❌ Failed to parse api.config.json:', e);
    return {};
  }
}

/**
 * Check if path matches filter pattern
 * Pattern: /admin/* matches /admin, /admin/users, /admin/market/{id}
 * Pattern: star-slash-admin-slash-star matches /auth/admin/login, /api/admin/users
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')  // * → .*
    .replace(/\//g, '\\/'); // / → \/

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Apply endpoint filters (blacklist/whitelist)
 */
function applyFilters(path: string, filter?: EndpointFilter): { isTestable: boolean; reason: string | null } {
  if (!filter) {
    return { isTestable: true, reason: null };
  }

  // Whitelist mode: ONLY include matches
  if (filter.whitelist && filter.whitelist.length > 0) {
    const matched = filter.whitelist.some(pattern => matchesPattern(path, pattern));
    if (matched) {
      return { isTestable: true, reason: null };
    } else {
      return { isTestable: false, reason: 'Not in whitelist' };
    }
  }

  // Blacklist mode: Exclude matches
  if (filter.blacklist && filter.blacklist.length > 0) {
    for (const pattern of filter.blacklist) {
      if (matchesPattern(path, pattern)) {
        return { isTestable: false, reason: `Matched pattern: ${pattern}` };
      }
    }
  }

  return { isTestable: true, reason: null };
}

/**
 * Extract all endpoints from OpenAPI spec
 */
function extractEndpoints(spec: OpenAPISpec, apiConfig: ApiConfig): EndpointInfo[] {
  console.log('🔍 Extracting endpoints from spec...');

  const endpoints: EndpointInfo[] = [];
  const paths = spec.paths || {};

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'];

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Extract parameters
      const params = operation.parameters || [];
      const hasPathParams = params.some(p => p.in === 'path');
      const hasQueryParams = params.some(p => p.in === 'query');

      // Extract security
      const security = operation.security || [];
      const securitySchemes = security.flatMap(s => Object.keys(s));

      // Apply filters
      const { isTestable, reason } = applyFilters(pathStr, apiConfig.endpointFilter);

      endpoints.push({
        method: method.toUpperCase(),
        path: pathStr,
        operationId: operation.operationId || `${method}_${pathStr}`,
        tags: operation.tags || [],
        hasRequestBody: !!operation.requestBody,
        hasPathParams,
        hasQueryParams,
        security: securitySchemes,
        isTestable,
        blacklistReason: reason,
      });
    }
  }

  return endpoints;
}

/**
 * Group endpoints by resource/tag
 */
function groupByResource(endpoints: EndpointInfo[]): { [resource: string]: string[] } {
  const byResource: { [resource: string]: string[] } = {};

  for (const endpoint of endpoints) {
    const resource = endpoint.tags[0] || 'Untagged';
    const key = `${endpoint.method} ${endpoint.path}`;

    if (!byResource[resource]) {
      byResource[resource] = [];
    }
    byResource[resource].push(key);
  }

  return byResource;
}

/**
 * Generate canonical manifest
 */
function generateManifest(spec: OpenAPISpec, endpoints: EndpointInfo[]): CanonicalManifest {
  const testableEndpoints = endpoints.filter(e => e.isTestable);
  const blacklistedEndpoints = endpoints.filter(e => !e.isTestable);

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalEndpoints: endpoints.length,
      testableEndpoints: testableEndpoints.length,
      blacklistedEndpoints: blacklistedEndpoints.length,
      openapiVersion: spec.openapi || '3.0.0',
      sourceFile: 'input/openapi.yaml',
    },
    endpoints,
    byResource: groupByResource(endpoints),
  };
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('🚀 Starting endpoint extraction...\n');

  try {
    // 1. Parse OpenAPI spec
    const specPath = path.join(process.cwd(), 'input/openapi.yaml');
    const spec = parseOpenAPISpec(specPath);

    // 2. Load API config
    const apiConfig = loadApiConfig();
    console.log('✅ Loaded API config');

    // 3. Extract endpoints
    const endpoints = extractEndpoints(spec, apiConfig);
    console.log(`✅ Found ${endpoints.length} total endpoints`);

    // 4. Generate manifest
    const manifest = generateManifest(spec, endpoints);

    // 5. Write to file
    const outputPath = path.join(process.cwd(), 'generated/canonical-endpoints.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');

    // 6. Print summary
    console.log('\n📊 Summary:');
    console.log(`   Total endpoints: ${manifest.metadata.totalEndpoints}`);
    console.log(`   Testable endpoints: ${manifest.metadata.testableEndpoints}`);
    console.log(`   Blacklisted endpoints: ${manifest.metadata.blacklistedEndpoints}`);
    console.log(`   Resources: ${Object.keys(manifest.byResource).length}`);
    console.log(`\n✅ Canonical manifest saved: ${outputPath}`);

    // 7. Show filter info
    if (apiConfig.endpointFilter) {
      console.log('\n🔍 Filters applied:');
      if (apiConfig.endpointFilter.whitelist && apiConfig.endpointFilter.whitelist.length > 0) {
        console.log(`   Whitelist: ${apiConfig.endpointFilter.whitelist.join(', ')}`);
      }
      if (apiConfig.endpointFilter.blacklist && apiConfig.endpointFilter.blacklist.length > 0) {
        console.log(`   Blacklist: ${apiConfig.endpointFilter.blacklist.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Extraction failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main();
