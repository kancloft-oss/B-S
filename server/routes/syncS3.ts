import express from 'express';
import { downloadFromS3 } from '../../src/services/s3Service.js';
import { CommerceMLParser } from '../../src/services/commerceMLParser.js';
import { db } from '../db.js';
import fs from 'fs';
import path from 'path';

export const syncS3Router = express.Router();

const S3_BASE = `${process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru'}/${process.env.S3_BUCKET_NAME || 'brusher-s3'}/1C`;

const addLog = (req: any, msg: string) => {
  console.log(msg);
  try {
     const logPath = path.resolve('./logs.json');
     let logs = [];
     if(fs.existsSync(logPath)){
       const data = fs.readFileSync(logPath, 'utf-8');
       logs = data ? JSON.parse(data) : [];
     }
     logs.unshift({ id: Date.now(), type: 'info', message: msg, time: new Date().toLocaleTimeString(), path: '/api/1c/sync-s3' });
     fs.writeFileSync(logPath, JSON.stringify(logs.slice(0, 50)));
  } catch(e) {}
};

syncS3Router.post('/', async (req, res) => {
  // Run process in background, respond immediately
  res.json({ message: 'Синхронизация запущена в фоновом режиме', success: true });
  
  try {
    addLog(req, '--- СИНХРОНИЗАЦИЯ БАЗЫ ИЗ S3 ХРАНИЛИЩА ЗАПУЩЕНА ---');
    const parser = new CommerceMLParser();
    
    addLog(req, 'Скачивание import.xml из S3...');
    const importXml = await downloadFromS3('1C/import.xml');
    const importData = parser.parse(importXml);
    
    const catalog = importData?.КоммерческаяИнформация?.Каталог;
    if (!catalog) throw new Error('Некорректный формат import.xml: Отсутствует КоммерческаяИнформация.Каталог');

    // Parse Categories
    const classifier = importData?.КоммерческаяИнформация?.Классификатор;
    const rawGroups = classifier?.Группы?.Группа;
    const categoriesToImport: any[] = [];
    
    function extractCategories(groups: any, parentId: string | null = null) {
        if (!groups) return;
        const groupArray = Array.isArray(groups) ? groups : [groups];
        for (const grp of groupArray) {
            categoriesToImport.push({
                id: grp.Ид,
                name: grp.Наименование,
                parentId: parentId
            });
            if (grp.Группы && grp.Группы.Группа) {
                extractCategories(grp.Группы.Группа, grp.Ид);
            }
        }
    }
    extractCategories(rawGroups);

    addLog(req, `Найдено категорий в файле: ${categoriesToImport.length}`);
    for (const cat of categoriesToImport) {
        await db.query(`
            INSERT INTO categories (id, "parentId", name) 
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET 
            "parentId" = EXCLUDED."parentId", name = EXCLUDED.name
        `, [cat.id, cat.parentId, cat.name]);
    }
    addLog(req, `Дерево категорий успешно сохранено.`);

    const rawProducts = catalog.Товары?.Товар;
    const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts ? [rawProducts] : []);
    addLog(req, `Найдено товаров в import.xml: ${products.length}`);

    addLog(req, 'Скачивание offers.xml из S3 (цены и остатки)...');
    let offersMap = new Map();
    let retailPriceTypeId = '';
    let purchasePriceTypeId = '';

    try {
        const offersXml = await downloadFromS3('1C/offers.xml');
        const offersData = parser.parse(offersXml);
        
        const packageOffers = offersData?.КоммерческаяИнформация?.ПакетПредложений;
        const rawPriceTypes = packageOffers?.ТипыЦен?.ТипЦены;
        const priceTypes = Array.isArray(rawPriceTypes) ? rawPriceTypes : (rawPriceTypes ? [rawPriceTypes] : []);
        
        for (const pt of priceTypes) {
            const name = (pt.Наименование || '').toLowerCase();
            if (name.includes('розничн')) retailPriceTypeId = pt.Ид;
            if (name.includes('закупочн')) purchasePriceTypeId = pt.Ид;
        }
        if (!retailPriceTypeId && priceTypes.length > 0) retailPriceTypeId = priceTypes[0].Ид; 
        
        const rawOffers = packageOffers?.Предложения?.Предложение;
        const offers = Array.isArray(rawOffers) ? rawOffers : (rawOffers ? [rawOffers] : []);
        offersMap = new Map(offers.map(o => [o.Ид, o]));
        addLog(req, `Найдено предложений (цен/остатков) в offers.xml: ${offers.length}`);
    } catch (e: any) {
        addLog(req, `Файл offers.xml не найден в S3 или ошибка при чтении. Цены и остатки будут установлены в 0.`);
    }

    addLog(req, `Начинается сохранение товаров в базу данных...`);
    let saved = 0;
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (p: any) => {
            const offer = offersMap.get(p.Ид);
            let price = 0;
            let purchasePrice = 0;
            
            if (offer && offer.Цены && offer.Цены.Цена) {
                const prices = Array.isArray(offer.Цены.Цена) ? offer.Цены.Цена : [offer.Цены.Цена];
                for (const pr of prices) {
                    if (pr.ИдТипаЦены === retailPriceTypeId) price = parseFloat(pr.ЦенаЗаЕдиницу || '0');
                    if (pr.ИдТипаЦены === purchasePriceTypeId) purchasePrice = parseFloat(pr.ЦенаЗаЕдиницу || '0');
                }
            }
            
            const stock = parseFloat(offer?.Количество || '0');
            let categoryId = null;
            if (p.Группы && p.Группы.Ид) {
                categoryId = p.Группы.Ид;
            } else if (importData.Категория) {
                 categoryId = p.Категория;
            }

            let imageUrl = null;
            if (p.Картинка) {
                const firstImage = Array.isArray(p.Картинка) ? p.Картинка[0] : p.Картинка;
                imageUrl = `${S3_BASE}/${firstImage}`;
            }

            const sku = p.Артикул || '';
            const barcode = p.Штрихкод ? String(p.Штрихкод) : '';
            const name = p.Наименование || 'Без названия';
            const description = typeof p.Описание === 'string' ? p.Описание : '';
            const maxDescription = description.substring(0, 1000);

            try {
               await db.query(`
                    INSERT INTO products (id, name, sku, barcode, "categoryId", price, "purchasePrice", stock, description, image, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode, "categoryId" = EXCLUDED."categoryId",
                    price = EXCLUDED.price, "purchasePrice" = EXCLUDED."purchasePrice", stock = EXCLUDED.stock, 
                    description = EXCLUDED.description, image = EXCLUDED.image, "updatedAt" = EXCLUDED."updatedAt"
                `, [
                   p.Ид, name, sku, barcode, categoryId, price, purchasePrice, stock, maxDescription, imageUrl, new Date().toISOString(), new Date().toISOString()
                ]);
                saved++;
            } catch (e) {
                console.error(`Failed to save product ${p.Ид}: `, e);
            }
        }));

        addLog(req, `Сохранено ${saved} товаров из ${products.length}...`);
    }
    
    addLog(req, `СИНХРОНИЗАЦИЯ УСПЕШНО ЗАВЕРШЕНА! Сохранено ${saved} товаров.`);
  } catch (e: any) {
    const errorMsg = e.name === 'UnknownError' && e.$metadata?.httpStatusCode === 404 
      ? 'Файлы не найдены в S3 (404)! Убедитесь, что файлы лежат в папке /1C/ (например, 1C/import.xml).' 
      : `${e.name}: ${e.message} ${e.$metadata ? `(HTTP ${e.$metadata.httpStatusCode})` : ''} - (endpoint: ${process.env.S3_ENDPOINT}, bucket: ${process.env.S3_BUCKET_NAME})`;
    addLog(req, `ОШИБКА СИНХРОНИЗАЦИИ: ${errorMsg}`);
    console.error('Import Error:', e);
  }
});
