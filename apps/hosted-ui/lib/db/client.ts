/**
 * PostgreSQL Database Client
 * 
 * Provides connection pooling and query execution for the transaction ledger.
 * Uses the 'pg' library for PostgreSQL connections.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Database configuration from environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_POOL_MIN = parseInt(process.env.DATABASE_POOL_MIN || '2', 10);
const DATABASE_POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX || '10', 10);

// Connection pool instance
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: DATABASE_URL,
      min: DATABASE_POOL_MIN,
      max: DATABASE_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    console.log('Database pool created');
  }

  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text: text.substring(0, 100),
        duration,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close the database pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Helper to safely handle database errors
 */
export function isDatabaseError(error: unknown): error is Error & { code?: string } {
  return error instanceof Error && 'code' in error;
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueViolation(error: unknown): boolean {
  return isDatabaseError(error) && error.code === '23505';
}

/**
 * Check if error is a foreign key violation
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return isDatabaseError(error) && error.code === '23503';
}

// Export the pool for direct access if needed
export { pool };

// Made with Bob