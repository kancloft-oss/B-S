import express from 'express';
import { db } from '../db.js';

export const usersRouter = express.Router();

usersRouter.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

usersRouter.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
