import express from 'express';
import { db } from '../db.js';

export const ordersRouter = express.Router();

// ================= API ORDERS =================
  ordersRouter.get('', async (req, res) => {
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

  ordersRouter.post('', async (req, res) => {
    try {
      const o = req.body;
      const id = o.id || Date.now().toString();
      const now = new Date().toISOString();
      await db.query(`
        INSERT INTO orders (id, "userId", customer, phone, date, total, status, items, "createdAt", address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [id, o.userId || '', o.customer, o.phone, o.date || now, o.total, o.status, JSON.stringify(o.items || []), now, o.address || '']);
      res.json({ id, ...o });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  ordersRouter.put('/:id', async (req, res) => {
    try {
      const { status } = req.body;
      await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });

  ordersRouter.delete('/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: (e as Error).message }); }
  });