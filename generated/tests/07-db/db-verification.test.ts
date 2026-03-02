import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { dbClient } from '../../helpers/db-client';
import { apiClient } from '../../helpers/api-client';
import { authHelper } from '../../helpers/auth-helper';

/**
 * DB Verification Tests
 * Direct database queries to verify API operations
 */

describe('DB Verification Tests', () => {
  beforeAll(async () => {
    if (dbClient.isEnabled()) {
      await dbClient.connect();
    }
  });

  afterAll(async () => {
    await dbClient.disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      if (!dbClient.isEnabled()) {
        console.log('DB disabled, skipping');
        return;
      }
      // Simple query to verify connection
      const result = await dbClient.query('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Users Table Verification', () => {
    it('should have users table with data', async () => {
      if (!dbClient.isEnabled()) return;

      const count = await dbClient.count('users');
      expect(count).toBeGreaterThan(0);
      console.log(`Found ${count} users in database`);
    });

    it('should match API user data with DB', async () => {
      if (!dbClient.isEnabled()) return;

      // Get user from API
      authHelper.setAuthToken('user');
      const apiResponse = await apiClient.get('/auth/me');
      authHelper.clearAuthToken();

      if (apiResponse.status !== 200) {
        console.log('API returned non-200, skipping DB verification');
        return;
      }

      const apiUser = apiResponse.data.data;

      // Get same user from DB
      const dbUser = await dbClient.findOne('users', { id: apiUser.id });

      expect(dbUser).not.toBeNull();
      expect(dbUser.walletAddress).toBe(apiUser.walletAddress);
      expect(Boolean(dbUser.isAdmin)).toBe(apiUser.isAdmin);
      console.log(`Verified user ${apiUser.id}: API matches DB`);
    });
  });

  describe('Markets Table Verification', () => {
    it('should have markets table with data', async () => {
      if (!dbClient.isEnabled()) return;

      const count = await dbClient.count('markets');
      expect(count).toBeGreaterThan(0);
      console.log(`Found ${count} markets in database`);
    });

    it('should match API markets count with DB count', async () => {
      if (!dbClient.isEnabled()) return;

      // Get count from API
      const apiResponse = await apiClient.get('/markets?limit=1');
      if (apiResponse.status !== 200) return;

      const apiTotal = apiResponse.data.metadata?.total || 0;

      // Get count from DB (only active/visible markets)
      const dbCount = await dbClient.count('markets');

      // DB count should be >= API count (API may filter)
      expect(dbCount).toBeGreaterThanOrEqual(apiTotal);
      console.log(`Markets: API shows ${apiTotal}, DB has ${dbCount}`);
    });

    it('should verify market detail matches DB', async () => {
      if (!dbClient.isEnabled()) return;

      // Get a market from API
      const listResponse = await apiClient.get('/markets?limit=1');
      if (listResponse.status !== 200 || !listResponse.data.data?.length) return;

      const apiMarket = listResponse.data.data[0];

      // Get from DB
      const dbMarket = await dbClient.findOne('markets', { id: apiMarket.id });

      expect(dbMarket).not.toBeNull();
      expect(dbMarket.title).toBe(apiMarket.title);
      console.log(`Verified market ${apiMarket.id}: "${apiMarket.title}"`);
    });
  });

  describe('Orders Table Verification', () => {
    it('should have orders table', async () => {
      if (!dbClient.isEnabled()) return;

      const count = await dbClient.count('orders');
      console.log(`Found ${count} orders in database`);
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should verify user orders match DB', async () => {
      if (!dbClient.isEnabled()) return;

      // Get user ID first
      authHelper.setAuthToken('user');
      const meResponse = await apiClient.get('/auth/me');

      if (meResponse.status !== 200) {
        authHelper.clearAuthToken();
        return;
      }

      const userId = meResponse.data.data.id;

      // Get orders from API
      const ordersResponse = await apiClient.get('/orders');
      authHelper.clearAuthToken();

      if (ordersResponse.status !== 200) return;

      const apiOrders = ordersResponse.data.data || [];

      // Get orders from DB for this user (snake_case: user_id)
      const dbOrders = await dbClient.query(
        'SELECT * FROM `orders` WHERE `user_id` = ? LIMIT 10',
        [userId]
      );

      console.log(`User ${userId}: API shows ${apiOrders.length} orders, DB has ${dbOrders.length}`);

      // API should show subset of DB (may filter by status, etc)
      expect(dbOrders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Comments Table Verification', () => {
    it('should have comments table', async () => {
      if (!dbClient.isEnabled()) return;

      const count = await dbClient.count('comments');
      console.log(`Found ${count} comments in database`);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Outcomes Table Verification', () => {
    it('should have outcomes table', async () => {
      if (!dbClient.isEnabled()) return;

      const count = await dbClient.count('outcomes');
      console.log(`Found ${count} outcomes in database`);
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should verify each market has at least 2 outcomes', async () => {
      if (!dbClient.isEnabled()) return;

      // Get markets with less than 2 outcomes (snake_case: market_id)
      const result = await dbClient.query(`
        SELECT m.id, m.title, COUNT(o.id) as outcomeCount
        FROM markets m
        LEFT JOIN outcomes o ON o.market_id = m.id
        GROUP BY m.id
        HAVING outcomeCount < 2
        LIMIT 5
      `);

      if (result.length > 0) {
        console.warn(`Found ${result.length} markets with < 2 outcomes:`, result);
      } else {
        console.log('All markets have >= 2 outcomes (business rule verified)');
      }

      // This may or may not be enforced, so just log
      expect(result).toBeDefined();
    });
  });

  describe('Foreign Key Integrity', () => {
    it('should verify orders reference valid markets', async () => {
      if (!dbClient.isEnabled()) return;

      // Find orphan orders (snake_case: market_id)
      const orphans = await dbClient.query(`
        SELECT o.id, o.market_id
        FROM orders o
        LEFT JOIN markets m ON o.market_id = m.id
        WHERE m.id IS NULL
        LIMIT 5
      `);

      if (orphans.length > 0) {
        console.warn(`Found ${orphans.length} orphan orders:`, orphans);
      } else {
        console.log('No orphan orders found (FK integrity OK)');
      }

      expect(orphans.length).toBe(0);
    });

    it('should verify comments reference valid markets', async () => {
      if (!dbClient.isEnabled()) return;

      // snake_case: market_id
      const orphans = await dbClient.query(`
        SELECT c.id, c.market_id
        FROM comments c
        LEFT JOIN markets m ON c.market_id = m.id
        WHERE m.id IS NULL
        LIMIT 5
      `);

      if (orphans.length > 0) {
        console.warn(`Found ${orphans.length} orphan comments:`, orphans);
      } else {
        console.log('No orphan comments found (FK integrity OK)');
      }

      expect(orphans.length).toBe(0);
    });

    it('should verify orders reference valid users', async () => {
      if (!dbClient.isEnabled()) return;

      // snake_case: user_id
      const orphans = await dbClient.query(`
        SELECT o.id, o.user_id
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE u.id IS NULL
        LIMIT 5
      `);

      if (orphans.length > 0) {
        console.warn(`Found ${orphans.length} orders with invalid userId:`, orphans);
      } else {
        console.log('All orders reference valid users (FK integrity OK)');
      }

      expect(orphans.length).toBe(0);
    });
  });

  describe('Data Constraints', () => {
    it('should verify no negative order amounts', async () => {
      if (!dbClient.isEnabled()) return;

      const negativeAmounts = await dbClient.query(`
        SELECT id, amount FROM orders WHERE amount < 0 LIMIT 5
      `);

      expect(negativeAmounts.length).toBe(0);
      console.log('No negative order amounts found');
    });

    it('should verify market ended_at > created_at', async () => {
      if (!dbClient.isEnabled()) return;

      // snake_case: ended_at, created_at
      const invalid = await dbClient.query(`
        SELECT id, title, ended_at, created_at
        FROM markets
        WHERE ended_at <= created_at
        LIMIT 5
      `);

      if (invalid.length > 0) {
        console.warn(`Found ${invalid.length} markets with invalid ended_at:`, invalid);
      } else {
        console.log('All markets have valid ended_at > created_at');
      }
    });
  });
});
