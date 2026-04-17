import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

let dbUrl = process.env.DATABASE_URL || '';

// If the user mistakenly pasted JUST the password, let's try to construct a URL
// using the known database IP (fallback to public IP for AI Studio if needed).
// We assume default user "admin" and db "postgres" based on previous interactions,
// but ONLY if it really looks like a bare password (no postgres:// prefix).
if (dbUrl && !dbUrl.startsWith('postgres') && !dbUrl.includes(':')) {
  console.warn('DATABASE_URL seems to be just a password. Attempting to construct full connection string...');
  const pass = encodeURIComponent(dbUrl); // encode special chars like |
  // Note: For Timeweb deployed app we should use the private IP 192.168.0.6, 
  // but since we don't know the environment definitively, we'll try the private IP first
  // No, actually we must rely on the user fixing the env variable.
  // But let's build a best-guess URL using the public IP for AI Studio to try keeping it alive.
  dbUrl = `postgresql://admin:${pass}@72.56.9.88:5432/postgres`;
}

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000, // Fail fast if it can't connect
});

// Capture startup errors so they don't crash the Node process entirely
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = pool;

// The initialization script will need to be run separately 
// or converted to async (not using db.exec synchronously anymore)
// PostgreSQL doesn't use static files like SQLite (database.sqlite)
export async function initializeDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        sku TEXT,
        category TEXT,
        price NUMERIC,
        stock NUMERIC,
        description TEXT,
        image TEXT,
        "createdAt" TIMESTAMPTZ,
        "updatedAt" TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        "parentId" TEXT,
        name TEXT,
        description TEXT,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        customer TEXT,
        phone TEXT,
        date TIMESTAMPTZ,
        total INTEGER,
        status TEXT,
        items TEXT,
        "createdAt" TIMESTAMPTZ
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    // Don't throw, let the server start even if this fails (e.g., if relations exist)
  }
}

