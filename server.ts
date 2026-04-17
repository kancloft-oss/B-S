import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db, initializeDatabase } from './server/db.js';
import { uploadToS3 } from './src/services/s3Service.js';
import { CommerceMLParser } from './src/services/commerceMLParser.js';

// ... (existing code top)

async function startServer() {
  await initializeDatabase();
  const app = express();
  const PORT = 3000;

  // Updated logging helper to handle info and errors
  const logToServer = (msg: string, pathToFile: string, isError: boolean = true) => {
    try {
      const logPath = path.resolve('./logs.json');
      const data = fs.readFileSync(logPath, 'utf-8');
      const logs = data ? JSON.parse(data) : [];
      logs.unshift({ 
        id: Date.now(), 
        type: isError ? 'error' : 'info', 
        message: msg, 
        time: new Date().toLocaleTimeString(), 
        path: pathToFile 
      });
      fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error('Failed to log to server:', e);
    }
  };


  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/logs', (req, res) => {
    res.json(JSON.parse(fs.readFileSync('./logs.json', 'utf-8')));
  });

  const upload = multer({ storage: multer.memoryStorage() });
  const commerceMLParser = new CommerceMLParser();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Обрабатываем /api/1c/exchange как сырые данные (raw), чтобы принимать и XML, и бинарные файлы
  app.use('/api/1c/exchange', express.raw({ type: '*/*', limit: '50mb' }));

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

  // ================= UPLOAD API =================
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }
      
      let folder = req.body.folder || 'general';
      const validFolders = ['banners', 'products', 'categories', 'general'];
      if (!validFolders.includes(folder)) folder = 'general';

      const fileUrl = await uploadToS3(req.file, folder);
      
      res.json({ url: fileUrl });
    } catch (e) {
      console.error('Upload Error:', e);
      res.status(500).json({ error: (e as Error).message });
    }
  });


  // ================= API 1C EXCHANGE =================
  // 1С часто использует GET для проверки соединения и инициализации
  app.all('/api/1c/exchange', async (req, res) => {
    try {
      const { type, mode, filename } = req.query;

      const debugInfo = `Method: ${req.method}, Query: ${JSON.stringify(req.query)}, Body size: ${req.body?.length || 0}`;
      logToServer(`1C Exchange request: ${debugInfo}`, '/api/1c/exchange', false);

      if (type === 'catalog' && mode === 'checkauth') {
        return res.send('success\nPHPSESSID\nsecretKey123');
      }
      
      if (type === 'catalog' && mode === 'init') {
        return res.send('zip=no\nfile_limit=5000000');
      }

      // Если 1С отправляет файл (POST), перенаправляем его прямо в S3
      if (type === 'catalog' && mode === 'file' && req.method === 'POST' && filename) {
        try {
          const fileKey = filename;
          
          // Всегда используем application/octet-stream для надежности бинарной передачи
          await uploadRawToS3(req.body, fileKey, 'application/octet-stream');
          
          console.log(`--- FILE UPLOADED TO S3: ${fileKey} ---`);
          return res.send('success');
        } catch (e) {
          console.error('S3 Upload Error:', e);
          return res.status(500).send('failure\nS3 Upload error');
        }
      }

      res.send('success');
    } catch (e) {
      console.error('1C Exchange Error:', e);
      res.status(500).send('failure\n' + (e as Error).message);
    }
  });

  // Helper for 1C raw upload
  async function uploadRawToS3(buffer: Buffer, key: string, contentType: string) {
    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
      region: process.env.S3_REGION || 'ru-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      // Ensure we use path-style addressing if necessary
      forcePathStyle: true, 
    });

    try {
      console.log(`--- S3 UPLOAD ATTEMPT --- Bucket: ${process.env.S3_BUCKET_NAME || 'brusher-s3'}, Key: ${key}, Size: ${buffer.length}`);
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'brusher-s3',
        Key: key,
        Body: buffer
      }));
      console.log(`--- S3 UPLOAD SUCCESS --- Key: ${key}`);
    } catch (err: any) {
      console.error('--- DETAILED S3 UPLOAD ERROR ---');
      console.error('Key:', key);
      console.error('Error Code:', err.code);
      console.error('Error Name:', err.name);
      console.error('Error Message:', err.message);
      
      const errorMsg = `S3 Upload Error for ${key}: ${err.name} - ${err.message}. Code: ${err.code || 'N/A'}`;
      console.error(errorMsg);
      logToServer(errorMsg, '/api/1c/exchange', true);
      throw err; // Пробрасываем ошибку дальше в обработчик
    }
  }

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
        // Find if this is a parent category and get its child category names
        const catRes = await db.query('SELECT name FROM categories WHERE "parentId" = (SELECT id FROM categories WHERE name = $1 LIMIT 1)', [category]);
        if (catRes.rows.length > 0) {
           const subCats = catRes.rows.map(r => r.name);
           const placeholders = subCats.map((_, i) => `$${paramCount + i + 1}`);
           conditions.push(`category IN ($${paramCount}, ${placeholders.join(', ')})`);
           params.push(category, ...subCats);
           paramCount += 1 + subCats.length;
        } else {
           conditions.push(`category = $${paramCount++}`);
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
          
          let productId = p.id;
          if (!productId) {
            const safeSku = (p.sku || '').toString().trim();
            const safeName = (p.name || '').toString().trim();
            productId = safeSku ? `sku-${safeSku}` : `name-${Buffer.from(safeName).toString('base64').substring(0, 32)}`;
          }

          await client.query(`
            INSERT INTO products (id, name, sku, category, price, stock, description, image, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, sku = EXCLUDED.sku, category = EXCLUDED.category, price = EXCLUDED.price, 
            stock = EXCLUDED.stock, description = EXCLUDED.description, image = EXCLUDED.image, "updatedAt" = EXCLUDED."updatedAt"
          `, [
            productId,
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
      const safeName = (c.name || '').toString().trim();
      const id = c.id || `cat-${Buffer.from(safeName).toString('base64').substring(0, 32)}`;
      
      await db.query(`
        INSERT INTO categories (id, name, description, image, "parentId")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image, "parentId" = EXCLUDED."parentId"
      `, [id, c.name, c.description || '', c.image || '', c.parentId || null]);
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
