import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

let schemas: any = null;

/**
 * Schema validator using ajv to validate responses against OpenAPI schemas
 */
class SchemaValidator {
  private ajv: Ajv;
  private specCache: any = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: true });
    addFormats(this.ajv);
  }

  /**
   * Load OpenAPI spec and extract schemas
   */
  private loadSpec(): any {
    if (this.specCache) return this.specCache;

    try {
      const specPath = path.resolve(process.cwd(), 'input/openapi.yaml');
      const content = fs.readFileSync(specPath, 'utf-8');
      this.specCache = yaml.load(content) as any;
      return this.specCache;
    } catch (error) {
      console.error('Failed to load OpenAPI spec:', error);
      return null;
    }
  }

  /**
   * Get schema for a specific component
   */
  getSchema(schemaName: string): any {
    const spec = this.loadSpec();
    if (!spec) return null;
    return spec.components?.schemas?.[schemaName] || null;
  }

  /**
   * Validate data against a named schema
   */
  validateSchema(data: any, schemaName: string): { valid: boolean; errors: any[] } {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      return { valid: false, errors: [{ message: `Schema ${schemaName} not found` }] };
    }

    // Resolve $ref references
    const resolvedSchema = this.resolveRefs(schema);

    try {
      const validate = this.ajv.compile(resolvedSchema);
      const valid = validate(data);
      return { valid: !!valid, errors: validate.errors || [] };
    } catch (error: any) {
      return { valid: false, errors: [{ message: error.message }] };
    }
  }

  /**
   * Validate response has expected status code
   */
  validateStatus(actual: number, expected: number | number[]): boolean {
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }
    return actual === expected;
  }

  /**
   * Validate response Content-Type
   */
  validateContentType(headers: any, expected: string = 'application/json'): boolean {
    const contentType = headers?.['content-type'] || '';
    return contentType.includes(expected);
  }

  /**
   * Validate response body has required fields
   */
  validateRequiredFields(data: any, fields: string[]): { valid: boolean; missing: string[] } {
    if (!data || typeof data !== 'object') {
      return { valid: false, missing: fields };
    }

    const missing = fields.filter(f => !(f in data));
    return { valid: missing.length === 0, missing };
  }

  /**
   * Validate array response
   */
  validateArrayResponse(data: any): boolean {
    return Array.isArray(data);
  }

  /**
   * Validate paginated response
   */
  validatePaginatedResponse(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    return Array.isArray(data.data) || Array.isArray(data.items) || Array.isArray(data);
  }

  /**
   * Resolve $ref references in schema
   */
  private resolveRefs(schema: any): any {
    if (!schema) return schema;
    if (typeof schema !== 'object') return schema;

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      const refSchema = this.getSchema(refPath);
      return refSchema ? this.resolveRefs(refSchema) : schema;
    }

    const resolved: any = Array.isArray(schema) ? [] : {};
    for (const key of Object.keys(schema)) {
      resolved[key] = this.resolveRefs(schema[key]);
    }
    return resolved;
  }

  /**
   * Get all paths from spec
   */
  getPaths(): any {
    const spec = this.loadSpec();
    return spec?.paths || {};
  }

  /**
   * Get response schema for a specific endpoint and status
   */
  getResponseSchema(path: string, method: string, statusCode: string): any {
    const spec = this.loadSpec();
    if (!spec) return null;

    const pathItem = spec.paths?.[path];
    if (!pathItem) return null;

    const operation = pathItem[method.toLowerCase()];
    if (!operation) return null;

    const response = operation.responses?.[statusCode];
    if (!response) return null;

    const content = response.content?.['application/json'];
    if (!content) return null;

    return content.schema ? this.resolveRefs(content.schema) : null;
  }
}

export const schemaValidator = new SchemaValidator();
export default schemaValidator;
