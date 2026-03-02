import authConfig from '../../config/auth.config.json';
import { apiClient } from './api-client';

/**
 * Authentication helper for managing tokens and login
 */
class AuthHelper {
  private tokens: Map<string, string> = new Map();

  /**
   * Get token for a specific role/user
   */
  getToken(role: string, label: string = 'default'): string | null {
    // For bearer_direct type, get token from config
    if (authConfig.type === 'bearer_direct') {
      const accounts = (authConfig.accounts as any)[role];
      if (!accounts || !Array.isArray(accounts)) {
        return null;
      }

      const account = label === 'default'
        ? accounts[0]
        : accounts.find((acc: any) => acc.label === label);

      if (!account || !account.token || account.token.includes('FILL_ME')) {
        return null;
      }

      return account.token;
    }

    // For other auth types, return cached token
    return this.tokens.get(`${role}:${label}`) || null;
  }

  /**
   * Login and get token (for bearer type with login endpoint)
   */
  async login(username: string, password: string): Promise<string | null> {
    if (authConfig.type !== 'bearer') {
      throw new Error('Login only supported for bearer auth type');
    }

    try {
      const loginBody = {
        [authConfig.loginBody.usernameField]: username,
        [authConfig.loginBody.passwordField]: password,
      };

      const response = await apiClient.post(authConfig.loginEndpoint, loginBody);

      if (response.status === 200 && response.data) {
        // Extract token using tokenPath (e.g., "data.token")
        const token = this.extractTokenFromResponse(response.data, authConfig.tokenPath);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  }

  /**
   * Extract token from response using path (e.g., "data.token")
   */
  private extractTokenFromResponse(data: any, path: string): string | null {
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Set auth token in API client
   */
  setAuthToken(role: string, label: string = 'default') {
    const token = this.getToken(role, label);
    if (token) {
      apiClient.setToken(token);
      return true;
    }
    return false;
  }

  /**
   * Clear auth token from API client
   */
  clearAuthToken() {
    apiClient.clearToken();
  }

  /**
   * Check if auth is configured
   */
  hasAuth(): boolean {
    return authConfig.type !== 'none';
  }

  /**
   * Get all available roles
   */
  getRoles(): string[] {
    return authConfig.roles || [];
  }

  /**
   * Get auth type
   */
  getAuthType(): string {
    return authConfig.type;
  }

  /**
   * Check if a specific role has valid token
   */
  hasValidToken(role: string, label: string = 'default'): boolean {
    const token = this.getToken(role, label);
    return token !== null && token.length > 0;
  }
}

// Export singleton instance
export const authHelper = new AuthHelper();
export default authHelper;
