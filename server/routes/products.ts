import express from 'express';
import { db } from '../db.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
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
        // Find if this is a parent category and get its child category names
        const catRes = await db.query('SELECT name FROM categories WHERE "parentId" = (SELECT id FROM categories WHERE name = $1 LIMIT 1)', [category]);
        if (catRes.rows.length > 0) {
           const subCats = catRes.rows.map(r => r.name);
           const placeholders = subCats.map((_, i) => `$${paramCount + i + 1}`);
           conditions.push(`"categoryId" IN ($${paramCount}, ${placeholders.join(', ')})`);
           params.push(category, ...subCats);
           paramCount += 1 + subCats.length;
        } else {
           conditions.push(`"categoryId" = $${paramCount++}`);
           params.push(category);
        }
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
      
      const isAdmin = req.query.admin === 'true';
      const products = result.rows.map(row => {
          if (!isAdmin) {
              const { purchasePrice, ...clientProduct } = row;
              return clientProduct;
          }
          return row;
      });

      res.json(products);
    } catch (e: any) {
      if (e.message?.includes('authentication failed') || e.message?.includes('password')) {
        res.status(500).json({ error: 'DB_AUTH_FAILED', message: 'Неверный пароль к базе данных (DATABASE_URL недостоверен)' });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  });

  productsRouter.get('/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      
      const product = result.rows[0];
      if (req.query.admin !== 'true') {
          delete product.purchasePrice;
      }
      
      res.json(product);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  productsRouter.post('/import', async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) return res.status(400).json({ error: 'Array expected' });

      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        const now = new Date().toISOString();
        for (const p of products) {
          
          let productId = p.id;
          if (!productId) {
            const safeSku = (p.sku || '').toString().trim();
            const safeName = (p.name || '').toString().trim();
            productId = safeSku ? `sku-${safeSku}` : `name-${Buffer.from(safeName).toString('base64').substring(0, 32)}`;
          }

          await client.query(`
            INSERT INTO products (id, name, sku, barcode, "categoryId", price, "purchasePrice", stock, description, image, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode, "categoryId" = EXCLUDED."categoryId", 
            price = EXCLUDED.price, "purchasePrice" = EXCLUDED."purchasePrice", stock = EXCLUDED.stock, 
            description = EXCLUDED.description, image = EXCLUDED.image, "updatedAt" = EXCLUDED."updatedAt"
          `, [
            productId,
            p.name,
            p.sku || '',
            p.barcode || '',
            p.category || 'Без категории',
            p.price || 0,
            p.purchasePrice || 0,
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

  productsRouter.post('/', async (req, res) => {
    try {
      const p = req.body;
      const now = new Date().toISOString();
      const id = p.id || Date.now().toString();
      await db.query(`
        INSERT INTO products (id, name, sku, barcode, "categoryId", price, "purchasePrice", stock, description, image, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [id, p.name, p.sku || '', p.barcode || '', p.category, p.price || 0, p.purchasePrice || 0, p.stock || 0, p.description || '', p.image || '', now, now]);
      res.json({ id, ...p });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  productsRouter.put('/:id', async (req, res) => {
    try {
      const p = req.body;
      const now = new Date().toISOString();
      await db.query(`
        UPDATE products SET name = $1, sku = $2, barcode = $3, "categoryId" = $4, price = $5, "purchasePrice" = $6, stock = $7, description = $8, image = $9, "updatedAt" = $10
        WHERE id = $11
      `, [p.name, p.sku || '', p.barcode || '', p.category, p.price || 0, p.purchasePrice || 0, p.stock || 0, p.description || '', p.image || '', now, req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  productsRouter.delete('/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });