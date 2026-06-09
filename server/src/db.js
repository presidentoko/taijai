const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../migrations/001_init.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migrations complete');
}

module.exports = { pool, runMigrations };
