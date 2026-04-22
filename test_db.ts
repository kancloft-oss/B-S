import { db } from './server/db.js';

async function test() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log("DB connected:", res.rows[0]);
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    process.exit(0);
  }
}

test();
