/**
 * Daily Refresh Pipeline — entry point
 * Runs snapshot-job then compute-outputs-job.
 *
 * Usage:
 *   node jobs/daily-refresh/run.js [--date YYYY-MM-DD]
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runSnapshotJob }       from './snapshot-job.js';
import { runComputeOutputsJob } from './compute-outputs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '../../data/groceries.db');
const SCHEMA    = join(__dirname, '../../packages/db/schema.sql');

async function main() {
  const args = process.argv.slice(2);
  const dateIdx = args.indexOf('--date');
  const date    = dateIdx !== -1 ? args[dateIdx + 1] : undefined;

  // Ensure data directory exists
  const { mkdirSync } = await import('node:fs');
  mkdirSync(join(__dirname, '../../data'), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Apply schema (idempotent — IF NOT EXISTS)
  const schema = readFileSync(SCHEMA, 'utf8');
  db.exec(schema);

  console.log(`[daily-refresh] DB ready at ${DB_PATH}`);

  await runSnapshotJob(db, { date });
  await runComputeOutputsJob(db, { date });

  db.close();
  console.log('[daily-refresh] Pipeline complete');
}

main().catch((err) => {
  console.error('[daily-refresh] FATAL:', err.message);
  process.exit(1);
});
