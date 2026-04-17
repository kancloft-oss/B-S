import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initializeDatabase } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initializeDatabase();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Увеличенный лимит для приема большого массива товаров

  // API Health Check
  app.get('/api/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (e) {
      if ((e as Error).message.includes('authentication failed') || (e as Error).message.includes('password')) {
        res.status(500).json({ error: 'DB_AUTH_FAILED', message: 'Неверный логин или пароль к базе данных' });
      } else {
        res.status(500).json({ status: 'error', message: (e as Error).message });
      }
    }
  });

  // ================= API PRODUCTS =================
  app.get('/api/products', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      let query = 'SELECT * FROM products';
      const params: any[] = [];
      const conditions: string[] = [];
      let paramCount = 1;

      if (category) {
        conditions.push(`category = $${paramCount++}`);
        params.push(category);
      }
      
      if (search) {
        conditions.push(`(name ILIKE $${paramCount} OR sku ILIKE $${paramCount + 1})`);
        params.push(`%${search}%`, `%${search}%`);
        paramCount += 2;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (e: any) {
      if (e.message?.includes('authentication failed') || e.message?.includes('password')) {
        res.status(500).json({ error: 'DB_AUTH_FAILED', message: 'Неверный пароль к базе данных (DATABASE_URL недостоверен)' });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/products/import', async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) return res.status(400).json({ error: 'Array expected' });

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        const now = new Date().toISOString();
        for (const p of products) {
          await client.query(`
            INSERT INTO products (id, name, sku, category, price, stock, description, image, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category, price = EXCLUDED.price, 
            stock = EXCLUDED.stock, description = EXCLUDED.description, image = EXCLUDED.image, "updatedAt" = EXCLUDED."updatedAt"
          `, [
            p.id || Date.now().toString() + Math.random(),
            p.name,
            p.sku || '',
            p.category || 'Без категории',
            p.price || 0,
            p.stock || 0,
            p.description || '',
            p.image || '',
            p.createdAt || now,
            now
          ]);
        }
        await client.query('COMMIT');
        res.json({ success: true, imported: products.length });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const p = req.body;
      const now = new Date().toISOString();
      const id = p.id || Date.now().toString();
      await db.query(`
        INSERT INTO products (id, name, sku, category, price, stock, description, image, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [id, p.name, p.sku, p.category, p.price, p.stock, p.description, p.image, now, now]);
      res.json({ id, ...p });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const p = req.body;
      const now = new Date().toISOString();
      await db.query(`
        UPDATE products SET name = $1, sku = $2, category = $3, price = $4, stock = $5, description = $6, image = $7, "updatedAt" = $8
        WHERE id = $9
      `, [p.name, p.sku, p.category, p.price, p.stock, p.description, p.image, now, req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ================= API CATEGORIES =================
  app.get('/api/categories', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM categories');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || Date.now().toString();
      await db.query(`
        INSERT INTO categories (id, name, description, image)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image
      `, [id, c.name, c.description || '', c.image || '']);
      res.json({ id, ...c });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // ================= API ORDERS =================
  app.get('/api/orders', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      let query = 'SELECT * FROM orders';
      const params: any[] = [];
      
      if (userId) {
        query += ' WHERE "userId" = $1';
        params.push(userId);
      }
      query += ' ORDER BY date DESC';
      
      const result = await db.query(query, params);
      const parsedOrders = result.rows.map((o: any) => ({
        ...o,
        items: JSON.parse(o.items || '[]')
      }));
      res.json(parsedOrders);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const o = req.body;
      const id = o.id || Date.now().toString();
      const now = new Date().toISOString();
      await db.query(`
        INSERT INTO orders (id, "userId", customer, phone, date, total, status, items, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [id, o.userId || '', o.customer, o.phone, o.date || now, o.total, o.status, JSON.stringify(o.items || []), now]);
      res.json({ id, ...o });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { status } = req.body;
      await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // ================= API STATS =================
  app.get('/api/stats', async (req, res) => {
    try {
      const productsCount = await db.query('SELECT COUNT(*) as c FROM products');
      const categoriesCount = await db.query('SELECT COUNT(*) as c FROM categories');
      const ordersCount = await db.query('SELECT COUNT(*) as c FROM orders');
      
      const now = new Date();
      now.setDate(now.getDate() - 7);
      const sevenDaysAgo = now.toISOString();
      const newProductsCount = await db.query('SELECT COUNT(*) as c FROM products WHERE "createdAt" >= $1', [sevenDaysAgo]);
      
      const lastUpdate = await db.query('SELECT "updatedAt" FROM products ORDER BY "updatedAt" DESC LIMIT 1');

      res.json({
        totalProducts: parseInt(productsCount.rows[0].c),
        totalCategories: parseInt(categoriesCount.rows[0].c),
        totalOrders: parseInt(ordersCount.rows[0].c),
        newProducts7d: parseInt(newProductsCount.rows[0].c),
        lastUpdate: lastUpdate.rows.length > 0 ? lastUpdate.rows[0].updatedAt : null
      });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  // Middleware Vite (всегда должно быть после API-маршрутов)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend-сервер успешно запущен на http://localhost:${PORT}`);
  });
}

startServer();
