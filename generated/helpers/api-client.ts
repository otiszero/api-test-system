import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import apiConfig from '../../config/api.config.json' with { type: 'json' };

/**
 * Evidence record for test reporting
 */
export interface RequestEvidence {
  method: string;
  url: string;
  fullUrl: string;
  headers: Record<string, string>;
  body?: any;
  response: {
    status: number;
    statusText: string;
    body: any;
    headers: Record<string, string>;
  };
  duration: number;
  timestamp: string;
  curl: string;
}

/**
 * API Client helper for making HTTP requests
 * Handles authentication, base URL, and common configurations
 * Records evidence for detailed test reports
 */
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private lastEvidence: RequestEvidence | null = null;
  private allEvidence: RequestEvidence[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: apiConfig.headers,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't throw on expected error status codes (for testing)
        if (error.response) {
          return Promise.resolve(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Generate curl command from request
   */
  private generateCurl(method: string, url: string, headers: Record<string, any>, body?: any): string {
    let curl = `curl -X ${method} "${apiConfig.baseUrl}${url}"`;
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== 'content-length' && value) {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    }
    if (body && Object.keys(body).length > 0) {
      curl += ` \\\n  -d '${JSON.stringify(body)}'`;
    }
    return curl;
  }

  /**
   * Record evidence from request/response
   */
  private recordEvidence(
    method: string,
    url: string,
    requestHeaders: Record<string, any>,
    requestBody: any,
    response: AxiosResponse,
    duration: number
  ): RequestEvidence {
    const evidence: RequestEvidence = {
      method,
      url,
      fullUrl: `${apiConfig.baseUrl}${url}`,
      headers: requestHeaders as Record<string, string>,
      body: requestBody,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: this.truncateBody(response.data),
        headers: response.headers as Record<string, string>,
      },
      duration,
      timestamp: new Date().toISOString(),
      curl: this.generateCurl(method, url, requestHeaders, requestBody),
    };

    this.lastEvidence = evidence;
    this.allEvidence.push(evidence);
    return evidence;
  }

  /**
   * Truncate large response bodies
   */
  private truncateBody(body: any): any {
    if (!body) return body;
    const str = JSON.stringify(body);
    if (str.length > 2000) {
      return {
        _truncated: true,
        _originalLength: str.length,
        _preview: str.substring(0, 2000) + '...'
      };
    }
    return body;
  }

  /**
   * Get last request evidence
   */
  getLastEvidence(): RequestEvidence | null {
    return this.lastEvidence;
  }

  /**
   * Get all recorded evidence
   */
  getAllEvidence(): RequestEvidence[] {
    return this.allEvidence;
  }

  /**
   * Clear all evidence
   */
  clearEvidence() {
    this.allEvidence = [];
    this.lastEvidence = null;
  }

  /**
   * GET request with evidence recording
   */
  async get(url: string, config?: AxiosRequestConfig) {
    const startTime = Date.now();
    const headers = { ...this.client.defaults.headers.common, ...config?.headers };
    const response = await this.client.get(url, config);
    this.recordEvidence('GET', url, headers, undefined, response, Date.now() - startTime);
    return response;
  }

  /**
   * POST request with evidence recording
   */
  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const startTime = Date.now();
    const headers = { ...this.client.defaults.headers.common, ...config?.headers };
    const response = await this.client.post(url, data, config);
    this.recordEvidence('POST', url, headers, data, response, Date.now() - startTime);
    return response;
  }

  /**
   * PUT request with evidence recording
   */
  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    const startTime = Date.now();
    const headers = { ...this.client.defaults.headers.common, ...config?.headers };
    const response = await this.client.put(url, data, config);
    this.recordEvidence('PUT', url, headers, data, response, Date.now() - startTime);
    return response;
  }

  /**
   * PATCH request with evidence recording
   */
  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    const startTime = Date.now();
    const headers = { ...this.client.defaults.headers.common, ...config?.headers };
    const response = await this.client.patch(url, data, config);
    this.recordEvidence('PATCH', url, headers, data, response, Date.now() - startTime);
    return response;
  }

  /**
   * DELETE request with evidence recording
   */
  async delete(url: string, config?: AxiosRequestConfig) {
    const startTime = Date.now();
    const headers = { ...this.client.defaults.headers.common, ...config?.headers };
    const response = await this.client.delete(url, config);
    this.recordEvidence('DELETE', url, headers, undefined, response, Date.now() - startTime);
    return response;
  }

  /**
   * Make request with custom method
   */
  async request(config: AxiosRequestConfig) {
    const startTime = Date.now();
    const response = await this.client.request(config);
    this.recordEvidence(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      config.headers || {},
      config.data,
      response,
      Date.now() - startTime
    );
    return response;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return apiConfig.baseUrl;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
