import { db } from './server/db.js';

async function wipe() {
  console.log('Wiping existing test data...');
  try {
    await db.query(`DROP TABLE IF EXISTS products;`);
    await db.query(`DROP TABLE IF EXISTS categories;`);
    console.log('Tables dropped.');
    
    // Re-initialize schema
    const { initializeDatabase } = await import('./server/db.js');
    await initializeDatabase();
    
    console.log('Data wiped and schema recreated successfully.');
  } catch (error) {
    console.error('Wipe failed:', error);
  } finally {
    process.exit(0);
  }
}

wipe();
