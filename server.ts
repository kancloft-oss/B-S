import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { db, initializeDatabase } from './server/db.js';

// --- Import Modular Routes ---
import { uploadRouter } from './server/routes/upload.js';
import { productsRouter } from './server/routes/products.js';
import { categoriesRouter } from './server/routes/categories.js';
import { ordersRouter } from './server/routes/orders.js';
import { exchangeRouter } from './server/routes/exchange.js';
import { statsRouter } from './server/routes/stats.js';
import { syncS3Router } from './server/routes/syncS3.js';

async function startServer() {
  await initializeDatabase();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Raw body for 1C exchange
  app.use('/api/1c/exchange', express.raw({ type: '*/*', limit: '50mb' }));

  app.get('/api/logs', (req, res) => {
    try {
      res.json(JSON.parse(fs.readFileSync('./logs.json', 'utf-8')));
    } catch {
      res.json([]);
    }
  });

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

  // --- Attach Routes ---
  app.use('/api/upload', uploadRouter);
  app.use('/api/1c/exchange', exchangeRouter);
  app.use('/api/1c/sync-s3', syncS3Router);
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/stats', statsRouter);

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
