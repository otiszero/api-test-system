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
   * Get priority for a resource (lower = earlier)
   */
  getPriority(resource: string): number {
    const res = (depGraph.resources as any)[resource];
    return res?.priority ?? 999;
  }

  /**
   * Resolve transitive dependencies for a resource (includes the resource itself).
   * Returns list sorted by priority (ascending), with the resource at the end.
   */
  getTransitiveDependencies(resource: string): string[] {
    const visited = new Set<string>();
    const collect = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      for (const dep of this.getDependencies(name)) {
        collect(dep);
      }
    };
    collect(resource);
    visited.delete(resource); // re-add at end after sorting deps
    const sorted = [...visited].sort(
      (a, b) => this.getPriority(a) - this.getPriority(b),
    );
    sorted.push(resource);
    return sorted;
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
