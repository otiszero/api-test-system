import depGraph from '../dependency-graph.json' with { type: 'json' };

/**
 * Dependency resolver for test execution ordering
 */
class DependencyResolver {
  /**
   * Get execution order for all resources
   */
  getExecutionOrder(): string[] {
    return depGraph.executionOrder;
  }

  /**
   * Get dependencies for a specific resource
   */
  getDependencies(resource: string): string[] {
    const res = (depGraph.resources as any)[resource];
    return res?.dependencies || [];
  }

  /**
   * Check if all dependencies are satisfied
   */
  areDependenciesMet(resource: string, completedResources: string[]): boolean {
    const deps = this.getDependencies(resource);
    return deps.every(dep => completedResources.includes(dep));
  }

  /**
   * Get endpoints for a resource
   */
  getEndpoints(resource: string): string[] {
    const res = (depGraph.resources as any)[resource];
    return res?.endpoints || [];
  }
}

export const dependencyResolver = new DependencyResolver();
export default dependencyResolver;
