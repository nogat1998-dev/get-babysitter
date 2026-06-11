import { config } from '../config/env';

// Use SQLite in development when no DATABASE_URL is configured
const usePostgres = config.db.url && !config.db.url.includes('user:password@localhost');

let queryFn: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number | null }>;
let poolObj: { end: () => Promise<void> };

if (usePostgres) {
  // Production: PostgreSQL
  const { Pool } = require('pg');
  const pgPool = new Pool({
    connectionString: config.db.url,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pgPool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  queryFn = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  };

  poolObj = { end: () => pgPool.end() };
  console.log('📦 Using PostgreSQL database');
} else {
  // Development: SQLite
  const sqlite = require('./sqlite');
  queryFn = sqlite.query;
  poolObj = sqlite.pool;
  console.log('📦 Using SQLite database (dev mode)');
}

export const query = queryFn;
export const pool = poolObj;
