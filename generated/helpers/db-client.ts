import dbConfig from '../../config/db.config.json' with { type: 'json' };

let pool: any = null;

/**
 * Database client helper - auto-detects DB type from config
 */
class DbClient {
  private connected = false;

  isEnabled(): boolean {
    return dbConfig.enabled === true;
  }

  async connect(): Promise<void> {
    if (!this.isEnabled() || this.connected) return;

    try {
      if (dbConfig.type === 'mysql2') {
        const mysql = await import('mysql2/promise');
        pool = await mysql.createPool({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.username,
          password: dbConfig.password,
          ssl: dbConfig.ssl ? {} : undefined,
          waitForConnections: true,
          connectionLimit: dbConfig.pool?.max || 5,
        });
      } else if (dbConfig.type === 'pg') {
        const { Pool } = await import('pg');
        pool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.username,
          password: dbConfig.password,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          max: dbConfig.pool?.max || 5,
        });
      }
      this.connected = true;
    } catch (error) {
      console.error('DB connection failed:', error);
      throw error;
    }
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    if (!this.isEnabled()) return [];
    if (!this.connected) await this.connect();

    try {
      if (dbConfig.type === 'mysql2') {
        const [rows] = await pool.execute(sql, params);
        return rows as any[];
      } else if (dbConfig.type === 'pg') {
        const result = await pool.query(sql, params);
        return result.rows;
      }
      return [];
    } catch (error) {
      console.error('DB query failed:', sql, error);
      throw error;
    }
  }

  async findOne(table: string, where: Record<string, any>): Promise<any | null> {
    const keys = Object.keys(where);
    const placeholder = dbConfig.type === 'pg'
      ? keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ')
      : keys.map(k => `\`${k}\` = ?`).join(' AND ');
    const values = Object.values(where);

    const rows = await this.query(
      `SELECT * FROM ${dbConfig.type === 'pg' ? `"${table}"` : `\`${table}\``} WHERE ${placeholder} LIMIT 1`,
      values
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async count(table: string, where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${dbConfig.type === 'pg' ? `"${table}"` : `\`${table}\``}`;
    let values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const keys = Object.keys(where);
      const placeholder = dbConfig.type === 'pg'
        ? keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ')
        : keys.map(k => `\`${k}\` = ?`).join(' AND ');
      sql += ` WHERE ${placeholder}`;
      values = Object.values(where);
    }

    const rows = await this.query(sql, values);
    return Number(rows[0]?.count || 0);
  }

  async disconnect(): Promise<void> {
    if (pool) {
      if (dbConfig.type === 'mysql2') {
        await pool.end();
      } else if (dbConfig.type === 'pg') {
        await pool.end();
      }
      pool = null;
      this.connected = false;
    }
  }
}

export const dbClient = new DbClient();
export default dbClient;
