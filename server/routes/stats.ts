import express from 'express';
import { db } from '../db.js';

export const statsRouter = express.Router();

// ================= API STATS =================
  statsRouter.get('/', async (req, res) => {
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