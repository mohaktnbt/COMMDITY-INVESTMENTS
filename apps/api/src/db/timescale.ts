/**
 * PostgreSQL / TimescaleDB client using pg Pool.
 */
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.TIMESCALE_HOST ?? 'localhost',
  port: parseInt(process.env.TIMESCALE_PORT ?? '5432', 10),
  database: process.env.TIMESCALE_DB ?? 'commodity_monitor',
  user: process.env.TIMESCALE_USER ?? 'postgres',
  password: process.env.TIMESCALE_PASSWORD ?? 'postgres',
  max: parseInt(process.env.TIMESCALE_POOL_MAX ?? '20', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected TimescaleDB pool error:', err);
});

/**
 * Execute a parameterized SQL query.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(sql, params);
}

/**
 * Get a client from the pool for transactions.
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export { pool };
