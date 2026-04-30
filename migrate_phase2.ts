import { query, initDb } from './src/backend/db.js';

async function runPhase2Migrations() {
  console.log("Running Phase 2 Migrations...");
  await initDb();
  console.log("Migration finished.");
  process.exit(0);
}

runPhase2Migrations();
