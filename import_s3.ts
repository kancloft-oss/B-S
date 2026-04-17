
import { downloadFromS3 } from './src/services/s3Service.js';
import { CommerceMLParser } from './src/services/commerceMLParser.js';
import { db } from './server/db.js';

async function importFromS3() {
  console.log('--- STARTING IMPORT FROM S3 ---');
  try {
    const parser = new CommerceMLParser();
    
    // 1. Download and Parse import.xml
    const importXml = await downloadFromS3('import.xml');
    const importData = parser.parse(importXml);
    const products = Array.isArray(importData.КоммерческаяИнформация.Каталог.Товары.Товар) 
        ? importData.КоммерческаяИнформация.Каталог.Товары.Товар 
        : [importData.КоммерческаяИнформация.Каталог.Товары.Товар];

    // 2. Download and Parse offers.xml
    const offersXml = await downloadFromS3('offers.xml');
    const offersData = parser.parse(offersXml);
    const offers = Array.isArray(offersData.КоммерческаяИнформация.ПакетПредложений.Предложения.Предложение)
        ? offersData.КоммерческаяИнформация.ПакетПредложений.Предложения.Предложение
        : [offersData.КоммерческаяИнформация.ПакетПредложений.Предложения.Предложение];

    // 3. Map offers for quick lookup (by product ID)
    const offersMap = new Map(offers.map(o => [o.Ид, o]));

    // 4. Save to Database
    console.log(`Processing ${products.length} products...`);
    
    for (const p of products) {
        const offer = offersMap.get(p.Ид);
        const price = offer?.Цены?.Цена?.ЦенаЗаЕдиницу || 0;
        const stock = offer?.Количество || 0;

        await db.query(`
            INSERT INTO products (id, name, sku, price, stock, description, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, price = EXCLUDED.price, stock = EXCLUDED.stock, "updatedAt" = EXCLUDED."updatedAt"
        `, [p.Ид, p.Наименование, p.Артикул || '', price, stock, p.Описание || '', new Date().toISOString(), new Date().toISOString()]);
    }
    
    console.log('Import successful (data saved to DB)');
    
  } catch (e) {
    console.error('Import Error:', e);
  }
}

importFromS3();
