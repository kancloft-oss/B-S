import { db } from './server/db.js';

async function checkCategoriesStructure() {
  try {
    const result = await db.query('SELECT id, "parentId", name FROM categories LIMIT 20');
    console.log('--- DB CATEGORIES STRUCTURE SAMPLE ---');
    console.table(result.rows);
  } catch (e) {
    console.error('Error fetching categories:', e);
  } finally {
    process.exit();
  }
}

checkCategoriesStructure();
