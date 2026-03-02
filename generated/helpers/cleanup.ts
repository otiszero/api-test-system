import { apiClient } from './api-client';
import { authHelper } from './auth-helper';

/**
 * Cleanup helper for test data teardown
 */
class Cleanup {
  private createdResources: Array<{ type: string; id: any; endpoint: string }> = [];

  /**
   * Track a created resource for cleanup
   */
  track(type: string, id: any, endpoint: string) {
    this.createdResources.push({ type, id, endpoint });
  }

  /**
   * Clean up all tracked resources (reverse order)
   */
  async cleanAll() {
    // Set admin token for cleanup operations
    authHelper.setAuthToken('admin');

    const reversed = [...this.createdResources].reverse();
    for (const resource of reversed) {
      try {
        await apiClient.delete(`${resource.endpoint}/${resource.id}`);
      } catch (error) {
        // Ignore cleanup errors - resource may already be deleted
      }
    }

    this.createdResources = [];
    authHelper.clearAuthToken();
  }

  /**
   * Clean up resources of a specific type
   */
  async cleanType(type: string) {
    authHelper.setAuthToken('admin');

    const resources = this.createdResources.filter(r => r.type === type).reverse();
    for (const resource of resources) {
      try {
        await apiClient.delete(`${resource.endpoint}/${resource.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    this.createdResources = this.createdResources.filter(r => r.type !== type);
    authHelper.clearAuthToken();
  }

  /**
   * Reset tracked resources without calling API
   */
  reset() {
    this.createdResources = [];
  }
}

export const cleanup = new Cleanup();
export default cleanup;
