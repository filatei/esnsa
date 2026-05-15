const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'esnsa_db',
  user:     process.env.DB_USER     || 'esnsa_user',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:      10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterised query.
 * @param {string} text   SQL string with $1, $2… placeholders
 * @param {any[]}  params Parameter values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
