import express from 'express';
import { db } from '../db.js';

export const categoriesRouter = express.Router();

// ================= API CATEGORIES =================
  categoriesRouter.get('', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM categories');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  categoriesRouter.post('', async (req, res) => {
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