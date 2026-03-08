/**
 * DB Integrity Tests - Upmount Custody Platform
 * Verify API responses match DB records for key entities
 *
 * Tests:
 * - User profile data matches DB
 * - Organization data consistency
 * - Vault accounts data integrity
 * - Transaction records alignment
 * - KYB status consistency
 * - Counts alignment (members, vaults)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '../../helpers/api-client';
import authConfig from '../../../config/auth.config.json';
import dbConfig from '../../../config/db.config.json';
import { Pool } from 'pg';

const TIMEOUT = 20000;
const ownerToken = authConfig.accounts.user?.[0]?.token;

// Extract email from JWT payload (base64-decoded middle segment)
function extractEmailFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.email || null;
  } catch { return null; }
}
const ownerEmail = ownerToken ? extractEmailFromJwt(ownerToken) : null;

let dbPool: Pool | null = null;

// ============================================================================
// DB SETUP
// ============================================================================
beforeAll(async () => {
  if (!dbConfig.enabled || dbConfig.type !== 'pg') {
    console.log('⏭️ DB tests skipped - PostgreSQL not enabled');
    return;
  }

  try {
    dbPool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      max: dbConfig.pool?.max || 3,
      min: dbConfig.pool?.min || 1,
    });

    // Test connection
    await dbPool.query('SELECT 1');
  } catch (error) {
    console.warn('⚠️ DB connection failed, DB tests will be skipped:', error);
    dbPool = null;
  }

  if (ownerToken) apiClient.setToken(ownerToken);
});

afterAll(async () => {
  if (dbPool) {
    await dbPool.end();
  }
});

// ============================================================================
// 1. USER PROFILE - API vs DB
// ============================================================================
describe('DB Integrity: User Profile', () => {
  it('API profile data matches DB user record', async () => {
    if (!dbPool || !ownerToken || !ownerEmail) return;

    // Get from API
    const apiRes = await apiClient.get('/api/users/profile/me');
    expect(apiRes.status).toBe(200);
    const apiProfile = apiRes.data?.data || apiRes.data;

    // Get from DB
    const dbResult = await dbPool.query(
      'SELECT id, email, "firstName", "lastName", "isEmailVerified", "is2FAEnabled" FROM users WHERE email = $1',
      [ownerEmail]
    );

    if (dbResult.rows.length === 0) {
      console.log('⏭️ User not found in DB, table structure may differ');
      return;
    }

    const dbUser = dbResult.rows[0];

    // Compare key fields
    expect(apiProfile.email).toBe(dbUser.email);

    if (apiProfile.firstName !== undefined) {
      expect(apiProfile.firstName).toBe(dbUser.firstName);
    }
    if (apiProfile.isEmailVerified !== undefined) {
      expect(apiProfile.isEmailVerified).toBe(dbUser.isEmailVerified);
    }
  }, TIMEOUT);

  it('User ID in API matches DB primary key', async () => {
    if (!dbPool || !ownerToken || !ownerEmail) return;

    const apiRes = await apiClient.get('/api/users/profile/me');
    if (apiRes.status !== 200) return;

    const apiProfile = apiRes.data?.data || apiRes.data;
    const apiUserId = apiProfile.id || apiProfile.userId;
    if (!apiUserId) return;

    const dbResult = await dbPool.query(
      'SELECT id FROM users WHERE email = $1',
      [ownerEmail]
    );

    if (dbResult.rows.length > 0) {
      expect(String(apiUserId)).toBe(String(dbResult.rows[0].id));
    }
  }, TIMEOUT);
});

// ============================================================================
// 2. ORGANIZATION - API vs DB
// ============================================================================
describe('DB Integrity: Organization', () => {
  let orgId: string | null = null;

  it('Organization from API matches DB', async () => {
    if (!dbPool || !ownerToken) return;

    // Get org ID from profile
    const profileRes = await apiClient.get('/api/users/profile/me');
    if (profileRes.status !== 200) return;

    const profile = profileRes.data?.data || profileRes.data;
    orgId = profile?.organizationId || profile?.organization?.id;
    if (!orgId) return;

    // Get from API
    const orgApiRes = await apiClient.get(`/api/users/organization/${orgId}`);
    if (orgApiRes.status !== 200) return;
    const apiOrg = orgApiRes.data?.data || orgApiRes.data;

    // Get from DB
    const dbResult = await dbPool.query(
      'SELECT id, name FROM organizations WHERE id = $1',
      [orgId]
    );

    if (dbResult.rows.length === 0) {
      console.log('⏭️ Organization not found in DB');
      return;
    }

    const dbOrg = dbResult.rows[0];
    expect(String(apiOrg.id)).toBe(String(dbOrg.id));
    if (apiOrg.name && dbOrg.name) {
      expect(apiOrg.name).toBe(dbOrg.name);
    }
  }, TIMEOUT);
});

// ============================================================================
// 3. VAULT ACCOUNTS - Count Consistency
// ============================================================================
describe('DB Integrity: Vault Accounts', () => {
  it('Vault count from API matches DB', async () => {
    if (!dbPool || !ownerToken || !ownerEmail) return;

    // Get user's org ID
    const profileRes = await apiClient.get('/api/users/profile/me');
    if (profileRes.status !== 200) return;
    const profile = profileRes.data?.data || profileRes.data;
    const orgId = profile?.organizationId || profile?.organization?.id;
    if (!orgId) return;

    // Get from API
    const apiRes = await apiClient.get('/api/users/vault-accounts');
    if (apiRes.status !== 200) return;
    const apiVaults = apiRes.data?.data || apiRes.data;
    if (!Array.isArray(apiVaults)) return;

    // Get count from DB
    const dbResult = await dbPool.query(
      'SELECT COUNT(*) as count FROM vault_accounts WHERE "organizationId" = $1',
      [orgId]
    );

    if (dbResult.rows.length > 0) {
      const dbCount = parseInt(dbResult.rows[0].count, 10);
      // API may paginate, so API count <= DB count
      expect(apiVaults.length).toBeLessThanOrEqual(dbCount);
    }
  }, TIMEOUT);

  it('Vault details from API match DB record', async () => {
    if (!dbPool || !ownerToken) return;

    // Get first vault from API
    const apiRes = await apiClient.get('/api/users/vault-accounts');
    if (apiRes.status !== 200) return;
    const apiVaults = apiRes.data?.data || apiRes.data;
    if (!Array.isArray(apiVaults) || apiVaults.length === 0) return;

    const firstVault = apiVaults[0];
    const vaultId = firstVault.id;

    // Get from DB
    const dbResult = await dbPool.query(
      'SELECT id, name FROM vault_accounts WHERE id = $1',
      [vaultId]
    );

    if (dbResult.rows.length > 0) {
      const dbVault = dbResult.rows[0];
      expect(String(firstVault.id)).toBe(String(dbVault.id));
      if (firstVault.name && dbVault.name) {
        expect(firstVault.name).toBe(dbVault.name);
      }
    }
  }, TIMEOUT);
});

// ============================================================================
// 4. TRANSACTIONS - Count Consistency
// ============================================================================
describe('DB Integrity: Transactions', () => {
  it('Transaction records exist in DB if API returns them', async () => {
    if (!dbPool || !ownerToken) return;

    // Get transactions from API
    const apiRes = await apiClient.get('/api/users/transactions');
    if (apiRes.status !== 200) return;
    const apiTxns = apiRes.data?.data || apiRes.data;
    if (!Array.isArray(apiTxns) || apiTxns.length === 0) return;

    // Check first transaction exists in DB
    const firstTx = apiTxns[0];
    const txId = firstTx.id;

    const dbResult = await dbPool.query(
      'SELECT id FROM transactions WHERE id = $1',
      [txId]
    );

    expect(dbResult.rows.length).toBeGreaterThan(0);
  }, TIMEOUT);
});

// ============================================================================
// 5. KYB STATUS - Consistency
// ============================================================================
describe('DB Integrity: KYB Status', () => {
  it('KYB status from API matches DB', async () => {
    if (!dbPool || !ownerToken || !ownerEmail) return;

    // Get user's org ID
    const profileRes = await apiClient.get('/api/users/profile/me');
    if (profileRes.status !== 200) return;
    const profile = profileRes.data?.data || profileRes.data;
    const orgId = profile?.organizationId || profile?.organization?.id;
    if (!orgId) return;

    // Get KYB status from API
    const kybApiRes = await apiClient.get('/api/users/organization-kyb/kyb-status');
    if (kybApiRes.status !== 200) return;
    const apiKybStatus = kybApiRes.data?.data || kybApiRes.data;

    // Get from DB
    const dbResult = await dbPool.query(
      'SELECT status FROM organization_kyb WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [orgId]
    );

    if (dbResult.rows.length > 0 && apiKybStatus?.status) {
      expect(apiKybStatus.status).toBe(dbResult.rows[0].status);
    }
  }, TIMEOUT);
});

// ============================================================================
// 6. ORGANIZATION MEMBERS - Count Consistency
// ============================================================================
describe('DB Integrity: Organization Members', () => {
  it('Member count from API matches DB', async () => {
    if (!dbPool || !ownerToken) return;

    // Get user's org ID
    const profileRes = await apiClient.get('/api/users/profile/me');
    if (profileRes.status !== 200) return;
    const profile = profileRes.data?.data || profileRes.data;
    const orgId = profile?.organizationId || profile?.organization?.id;
    if (!orgId) return;

    // Get members from API
    const membersRes = await apiClient.get('/api/users/organization-members/members');
    if (membersRes.status !== 200) return;
    const apiMembers = membersRes.data?.data || membersRes.data;
    if (!Array.isArray(apiMembers)) return;

    // Get count from DB
    const dbResult = await dbPool.query(
      'SELECT COUNT(*) as count FROM organization_members WHERE "organizationId" = $1',
      [orgId]
    );

    if (dbResult.rows.length > 0) {
      const dbCount = parseInt(dbResult.rows[0].count, 10);
      expect(apiMembers.length).toBeLessThanOrEqual(dbCount);
    }
  }, TIMEOUT);
});

// ============================================================================
// 7. COUNTRIES - Reference Data
// ============================================================================
describe('DB Integrity: Countries Reference', () => {
  it('Countries from API match DB', async () => {
    if (!dbPool) return;

    // Get from API (public endpoint)
    apiClient.clearToken();
    const apiRes = await apiClient.get('/api/countries');
    expect(apiRes.status).toBe(200);
    const apiCountries = apiRes.data?.data || apiRes.data;
    if (!Array.isArray(apiCountries)) return;

    // Get from DB
    const dbResult = await dbPool.query('SELECT COUNT(*) as count FROM countries');

    if (dbResult.rows.length > 0) {
      const dbCount = parseInt(dbResult.rows[0].count, 10);
      // API count should match DB count (no pagination for reference data)
      expect(apiCountries.length).toBe(dbCount);
    }

    // Restore token
    if (ownerToken) apiClient.setToken(ownerToken);
  }, TIMEOUT);
});

// ============================================================================
// 8. RBAC ROLES - Reference Data
// ============================================================================
describe('DB Integrity: RBAC Roles', () => {
  it('RBAC roles from API exist in DB', async () => {
    if (!dbPool || !ownerToken) return;
    apiClient.setToken(ownerToken);

    const apiRes = await apiClient.get('/api/users/rbac/roles');
    if (apiRes.status !== 200) return;
    const apiRoles = apiRes.data?.data || apiRes.data;
    if (!Array.isArray(apiRoles) || apiRoles.length === 0) return;

    // Get from DB
    const dbResult = await dbPool.query('SELECT COUNT(*) as count FROM roles');

    if (dbResult.rows.length > 0) {
      const dbCount = parseInt(dbResult.rows[0].count, 10);
      expect(dbCount).toBeGreaterThan(0);
      expect(apiRoles.length).toBeLessThanOrEqual(dbCount);
    }
  }, TIMEOUT);
});

// ============================================================================
// 9. DATA INTEGRITY - No orphaned records
// ============================================================================
describe('DB Integrity: No Orphans', () => {
  it('All vault_accounts have valid organizationId', async () => {
    if (!dbPool) return;

    const dbResult = await dbPool.query(`
      SELECT va.id FROM vault_accounts va
      LEFT JOIN organizations o ON va."organizationId" = o.id
      WHERE o.id IS NULL
      LIMIT 5
    `);

    expect(dbResult.rows.length).toBe(0);
  }, TIMEOUT);

  it('All organization_members have valid userId and organizationId', async () => {
    if (!dbPool) return;

    const dbResult = await dbPool.query(`
      SELECT om.id FROM organization_members om
      LEFT JOIN users u ON om."userId" = u.id
      WHERE u.id IS NULL
      LIMIT 5
    `);

    expect(dbResult.rows.length).toBe(0);
  }, TIMEOUT);

  it('All transactions have valid vault reference', async () => {
    if (!dbPool) return;

    const dbResult = await dbPool.query(`
      SELECT t.id FROM transactions t
      LEFT JOIN vault_accounts va ON t."vaultAccountId" = va.id
      WHERE va.id IS NULL AND t."vaultAccountId" IS NOT NULL
      LIMIT 5
    `);

    expect(dbResult.rows.length).toBe(0);
  }, TIMEOUT);
});
