import { query, initDb } from './src/backend/db.js';

async function migrate() {
  await initDb();
  try {
    await query("ALTER TABLE tradespeople ADD COLUMN company_name VARCHAR(255);");
    console.log("Migration successful: Added company_name to tradespeople table.");
  } catch (err: any) {
    console.log("Migration note:", err.message); // Will likely say column already exists next time
  }
  process.exit(0);
}

migrate();
