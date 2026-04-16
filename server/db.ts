import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Initialize the connection pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = pool;

// The initialization script will need to be run separately 
// or converted to async (not using db.exec synchronously anymore)
// PostgreSQL doesn't use static files like SQLite (database.sqlite)
export async function initializeDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      sku TEXT,
      category TEXT,
      price INTEGER,
      stock INTEGER,
      description TEXT,
      image TEXT,
      createdAt TIMESTAMPTZ,
      updatedAt TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT,
      customer TEXT,
      phone TEXT,
      date TIMESTAMPTZ,
      total INTEGER,
      status TEXT,
      items TEXT,
      createdAt TIMESTAMPTZ
    );
  `);
}
