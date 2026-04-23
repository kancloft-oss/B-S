import { db, initializeDatabase } from './server/db.js';

async function run() {
  await initializeDatabase();
  const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
  console.log(res.rows);
  process.exit(0);
}
run();
