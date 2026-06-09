const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  let files;
  try {
    files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  } catch (e) {
    console.error('Migrations dir not found:', migrationsDir, e.message);
    return;
  }
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`Migration applied: ${file}`);
    } catch (e) {
      console.error(`Migration failed ${file}:`, e.message);
    }
  }
}

module.exports = { pool, runMigrations };
