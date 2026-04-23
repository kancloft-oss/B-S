import express from 'express';
import { db } from '../db.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      const search = req.query.search as string;
      const ids = req.query.ids as string;
      
      let query = 'SELECT * FROM products';
      const params: any[] = [];
      const conditions: string[] = [];
      let paramCount = 1;

      if (ids) {
        const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
        if (idList.length > 0) {
           const placeholders = idList.map((_, i) => `$${paramCount + i}`);
           conditions.push(`id IN (${placeholders.join(', ')})`);
           params.push(...idList);
           paramCount += idList.length;
        }
      }

      if (category) {
        // Find the requested category by name to get its exact ID
        const targetRes = await db.query('SELECT id FROM categories WHERE name = $1 LIMIT 1', [category]);
        if (targetRes.rows.length > 0) {
            const targetId = targetRes.rows[0].id;
            // Get all children categories IDs (if any)
            const subRes = await db.query('SELECT id FROM categories WHERE "parentId" = $1', [targetId]);
            const subCatIds = subRes.rows.map(r => r.id);
            const allIds = [targetId, ...subCatIds];
            
            const placeholders = allIds.map((_, i) => `$${paramCount + i}`);
            conditions.push(`"categoryId" IN (${placeholders.join(', ')})`);
            params.push(...allIds);
            paramCount += allIds.length;
        } else {
            // Fallback if category name isn't found in DB (might happen with hardcoded links before sync)
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

  productsRouter.get('/:id/complements', async (req, res) => {
    try {
      const result = await db.query('SELECT name, "categoryId" FROM products WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.json([]);
      const product = result.rows[0];
      const pName = (product.name || '').toLowerCase();
      
      const rules = [
        { triggers: ['масл', 'маслян'], targets: ['холст', 'кист', 'разбавител', 'льнян', 'мастихин', 'палитра', 'масленка', 'мольберт', 'фартук', 'лак'] },
        { triggers: ['акварел'], targets: ['бумаг', 'кист', 'белк', 'колонок', 'палитра', 'стакан', 'маскирующ', 'скотч', 'планшет'] },
        { triggers: ['акрил'], targets: ['холст', 'картон', 'кист', 'палитра', 'замедлител', 'лак', 'мастихин', 'паст', 'грунт'] },
        { triggers: ['гуашь'], targets: ['бумаг', 'картон', 'кист', 'пони', 'щетина', 'палитра', 'стакан'] },
        { triggers: ['графит', 'чернографит'], targets: ['ластик', 'клячк', 'точилк', 'скетчбук', 'бумаг', 'пенал', 'тубус'] },
        { triggers: ['цветн', 'акварельн', 'карандаш'], targets: ['скетчбук', 'бумаг', 'точилк', 'ластик', 'пенал', 'блендер', 'кист'] },
        { triggers: ['маркер', 'фломастер', 'брашпен'], targets: ['скетчбук', 'маркерн', 'линер', 'ручк', 'пенал'] },
        { triggers: ['линер', 'капиллярн'], targets: ['скетчбук', 'маркер', 'карандаш', 'ластик'] },
        { triggers: ['пастель', 'мелок', 'мелки', 'сангин', 'соус', 'уголь', 'сепия'], targets: ['бумаг', 'растушевк', 'клячк', 'фиксатив', 'лак', 'держател'] },
        { triggers: ['холст'], targets: ['масл', 'акрил', 'кист', 'разбавител', 'мастихин', 'мольберт', 'грунт', 'лак'] },
        { triggers: ['скетчбук', 'блокнот', 'альбом'], targets: ['карандаш', 'линер', 'маркер', 'ластик', 'точилк', 'брашпен'] },
        { triggers: ['кист'], targets: ['акварель', 'акрил', 'масл', 'гуашь', 'палитр', 'стакан', 'пенал', 'мыло', 'холст', 'бумаг', 'мастихин'] },
        { triggers: ['мастихин'], targets: ['масл', 'акрил', 'холст', 'паст', 'палитр', 'грунт', 'масленк', 'мольберт', 'кист'] },
        { triggers: ['мольберт', 'этюдник', 'треног'], targets: ['холст', 'планшет', 'масл', 'акрил', 'масленк', 'пенал', 'стул', 'сумка', 'палитр'] },
        { triggers: ['планшет'], targets: ['бумаг', 'кнопк', 'зажим', 'скотч', 'карандаш', 'акварель', 'кист'] },
        { triggers: ['разбавител', 'лак', 'пинен', 'масло льнян'], targets: ['масл', 'масленк', 'кист', 'мастихин', 'холст', 'акрил'] },
        { triggers: ['масленк'], targets: ['разбавител', 'масл', 'льнян', 'палитр', 'мастихин', 'кист', 'мольберт'] },
        { triggers: ['палитр'], targets: ['масл', 'мастихин', 'масленк', 'разбавител', 'акварель', 'гуашь', 'акрил', 'кист', 'холст'] },
        { triggers: ['паст', 'гель', 'текстурн'], targets: ['акрил', 'мастихин', 'холст', 'трафарет', 'грунт'] },
        { triggers: ['ластик', 'клячк'], targets: ['карандаш', 'пастель', 'уголь', 'бумаг', 'точилк', 'скетчбук'] },
        { triggers: ['точилк'], targets: ['карандаш', 'ластик', 'пенал', 'скетчбук', 'цветн'] },
        { triggers: ['глина', 'пластилин', 'скульптур'], targets: ['стек', 'доск', 'проволок', 'инструмент', 'лак'] },
        { triggers: ['стек', 'скульптурн'], targets: ['глин', 'пластилин', 'масс', 'доск'] },
        { triggers: ['пенал', 'скрутк'], targets: ['карандаш', 'маркер', 'кист', 'линер', 'ластик', 'ручк'] },
        { triggers: ['тубус', 'папк'], targets: ['бумаг', 'ватман', 'карандаш', 'линейк', 'планшет', 'скетчбук'] },
        { triggers: ['фартук', 'нарукавник'], targets: ['краск', 'масл', 'акрил', 'гуашь', 'глин', 'мольберт'] },
        { triggers: ['тушь', 'перья', 'каллиграф'], targets: ['бумаг', 'держател', 'кист', 'брашпен', 'баночк', 'линер'] },
        { triggers: ['скотч', 'зажим', 'кнопк'], targets: ['бумаг', 'планшет', 'акварель', 'кист', 'мольберт'] },
        { triggers: ['смол', 'эпоксидн'], targets: ['красител', 'молд', 'формочк', 'глиттер', 'перчатк', 'стакан'] },
        { triggers: ['скрапбукинг', 'декупаж'], targets: ['клей', 'салфетк', 'заготовк', 'ножниц', 'нож', 'коврик'] }
      ];

      let matchedTargets: string[] = [];
      for (const rule of rules) {
        if (rule.triggers.some(t => pName.includes(t))) {
          matchedTargets = matchedTargets.concat(rule.targets);
        }
      }
      
      let complements: any[] = [];
      
      if (matchedTargets.length > 0) {
        // Unique targets
        matchedTargets = [...new Set(matchedTargets)];
        
        let targetConditions = matchedTargets.map((_, i) => `name ILIKE $${i + 2}`).join(' OR ');
        
        const queryParams = [product.categoryId || 'null_cat', ...matchedTargets.map(t => `%${t}%`)];
        const complementQuery = `
          SELECT * FROM products 
          WHERE ("categoryId" != $1 OR "categoryId" IS NULL) 
          AND (${targetConditions})
          LIMIT 20
        `;
        const compRes = await db.query(complementQuery, queryParams);
        
        // Take at most 1-2 per target type to ensure variety
        const variety: any[] = [];
        for (const target of matchedTargets) {
            const matchesForTarget = compRes.rows.filter((r: any) => (r.name || '').toLowerCase().includes(target));
            variety.push(...matchesForTarget.slice(0, 2));
        }
        complements = variety;
      }
      
      // Fallback
      if (complements.length < 4) {
         try {
           const fallbackRes = await db.query(`SELECT * FROM products WHERE id != $1 ORDER BY RANDOM() LIMIT 8`, [req.params.id]);
           complements = [...complements, ...fallbackRes.rows];
         } catch(e) {} // ignore fallback error
      }
      
      // Deduplicate by ID and slice to max 8 items
      const uniqueComps = Array.from(new Map(complements.map(item => [item.id, item])).values()).slice(0, 8);
      
      const safeComps = uniqueComps.map(row => {
          const { purchasePrice, ...clientProduct } = row;
          return clientProduct;
      });

      res.json(safeComps);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
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