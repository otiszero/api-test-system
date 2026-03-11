import { describe, beforeAll, afterAll } from 'vitest';
import { dependencyResolver } from './dependency-resolver';
import { getProvider } from './resource-providers';
import { apiClient } from './api-client';
import { cleanup } from './cleanup';

/**
 * Shared context object passed to every test inside a withNeeds() block.
 * Providers populate fields; tests read them.
 */
export interface IntegrationContext {
  /** Owner bearer token (set by "Users auth" provider) */
  ownerToken: string | null;
  /** Convenience accessors populated by providers */
  data: Record<string, any>;
}

function createContext(): IntegrationContext {
  return { ownerToken: null, data: {} };
}

/**
 * Declarative integration-test wrapper.
 *
 * Resolves transitive dependencies for the requested resources,
 * runs their providers in priority order inside `beforeAll`,
 * and calls `cleanup.cleanAll()` in `afterAll`.
 *
 * @example
 * ```ts
 * withNeeds(['Vault Accounts'], (ctx) => {
 *   describe('Vault lifecycle', () => {
 *     it('lists vaults', async () => {
 *       apiClient.setToken(ctx.ownerToken!);
 *       const res = await apiClient.get('/api/users/vault-accounts');
 *       expect(res.status).toBe(200);
 *     });
 *   });
 * });
 * ```
 */
export function withNeeds(
  resources: string[],
  testFn: (ctx: IntegrationContext) => void,
) {
  // Merge transitive deps for all requested resources, dedupe, sort by priority
  const allDeps = new Set<string>();
  for (const r of resources) {
    for (const dep of dependencyResolver.getTransitiveDependencies(r)) {
      allDeps.add(dep);
    }
  }
  const ordered = [...allDeps].sort(
    (a, b) =>
      dependencyResolver.getPriority(a) - dependencyResolver.getPriority(b),
  );

  const ctx = createContext();

  describe(`[needs: ${resources.join(', ')}]`, () => {
    beforeAll(async () => {
      for (const dep of ordered) {
        const provider = getProvider(dep);
        if (provider) {
          try {
            await provider(ctx);
          } catch (err) {
            console.warn(`[needs] provider "${dep}" failed:`, err);
          }
        }
      }
      // Ensure token is set after all providers ran
      if (ctx.ownerToken) apiClient.setToken(ctx.ownerToken);
    }, 30_000);

    afterAll(async () => {
      await cleanup.cleanAll();
    });

    testFn(ctx);
  });
}

export default withNeeds;
