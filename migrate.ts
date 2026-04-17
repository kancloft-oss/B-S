import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { db as pgDb } from './server/db.js';

async function migrateData() {
  console.log('Начинаем миграцию данных из SQLite в PostgreSQL...');

  const sqlitePath = path.join(process.cwd(), 'database.sqlite');
  if (!fs.existsSync(sqlitePath)) {
    console.error('Файл SQLite базы данных не найден!');
    process.exit(1);
  }

  const sqlite = new Database(sqlitePath);
  const client = await pgDb.connect();

  try {
    await client.query('BEGIN');

    // 1. Миграция категорий
    console.log('Перенос категорий...');
    const categories = sqlite.prepare('SELECT * FROM categories').all() as any[];
    for (const c of categories) {
      await client.query(`
        INSERT INTO categories (id, name, description, image)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.name, c.description, c.image]);
    }
    console.log(`Перенесено категорий: ${categories.length}`);

    // 2. Миграция товаров
    console.log('Перенос товаров...');
    const products = sqlite.prepare('SELECT * FROM products').all() as any[];
    for (const p of products) {
      await client.query(`
        INSERT INTO products (id, name, sku, category, price, stock, description, image, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [p.id, p.name, p.sku, p.category, p.price, p.stock, p.description, p.image, p.createdAt, p.updatedAt]);
    }
    console.log(`Перенесено товаров: ${products.length}`);

    // 3. Миграция заказов
    console.log('Перенос заказов...');
    const orders = sqlite.prepare('SELECT * FROM orders').all() as any[];
    for (const o of orders) {
      await client.query(`
        INSERT INTO orders (id, "userId", customer, phone, date, total, status, items, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [o.id, o.userId, o.customer, o.phone, o.date, o.total, o.status, o.items, o.createdAt]);
    }
    console.log(`Перенесено заказов: ${orders.length}`);

    await client.query('COMMIT');
    console.log('✅ Миграция успешно завершена!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка при миграции:', (error as Error).message);
  } finally {
    client.release();
    sqlite.close();
    process.exit(0);
  }
}

migrateData();
