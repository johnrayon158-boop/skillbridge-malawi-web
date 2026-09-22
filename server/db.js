const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error(
    'Supabase database connection is not configured. Add DATABASE_URL or SUPABASE_DB_URL to .env.local using the Postgres connection string from Supabase Dashboard > Connect.'
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (error) => {
  console.error('Unexpected Supabase database pool error:', error.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
