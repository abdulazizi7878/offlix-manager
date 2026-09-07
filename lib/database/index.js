import pg from "pg";

const { Pool } = pg;

const globalForPg = globalThis;

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (!globalForPg.pgPool) {
  globalForPg.pgPool = pool;
}

export default pool;