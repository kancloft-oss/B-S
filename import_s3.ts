import { downloadFromS3 } from './src/services/s3Service.js';
import { CommerceMLParser } from './src/services/commerceMLParser.js';
import { db } from './server/db.js';

// Base S3 URL for 1C files (images)
const S3_BASE = `${process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru'}/${process.env.S3_BUCKET_NAME || 'brusher-s3'}/1C`;

async function importFromS3() {
  console.log('--- STARTING IMPORT FROM 1C/S3 ---');
  try {
    const parser = new CommerceMLParser();
    
    // ----------------------------------------------------
    // 1. Download and Parse import.xml
    // ----------------------------------------------------
    console.log('Downloading import.xml...');
    const importXml = await downloadFromS3('1C/import.xml');
    const importData = parser.parse(importXml);
    
    const catalog = importData?.КоммерческаяИнформация?.Каталог;
    if (!catalog) throw new Error('Invalid import.xml format: Missing КоммерческаяИнформация.Каталог');

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
            // Handle subcategories
            if (grp.Группы && grp.Группы.Группа) {
                extractCategories(grp.Группы.Группа, grp.Ид);
            }
        }
    }
    extractCategories(rawGroups);

    console.log(`Found ${categoriesToImport.length} categories.`);
    for (const cat of categoriesToImport) {
        await db.query(`
            INSERT INTO categories (id, "parentId", name) 
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET 
            "parentId" = EXCLUDED."parentId", name = EXCLUDED.name
        `, [cat.id, cat.parentId, cat.name]);
    }

    // Parse Products
    const rawProducts = catalog.Товары?.Товар;
    const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts ? [rawProducts] : []);
    console.log(`Found ${products.length} products.`);

    // ----------------------------------------------------
    // 2. Download and Parse offers.xml
    // ----------------------------------------------------
    console.log('Downloading offers.xml...');
    const offersXml = await downloadFromS3('1C/offers.xml');
    const offersData = parser.parse(offersXml);
    
    const packageOffers = offersData?.КоммерческаяИнформация?.ПакетПредложений;
    
    // Map Price Types to identify Retail vs Purchase
    const rawPriceTypes = packageOffers?.ТипыЦен?.ТипЦены;
    const priceTypes = Array.isArray(rawPriceTypes) ? rawPriceTypes : (rawPriceTypes ? [rawPriceTypes] : []);
    
    let retailPriceTypeId = '';
    let purchasePriceTypeId = '';
    
    for (const pt of priceTypes) {
        const name = (pt.Наименование || '').toLowerCase();
        if (name.includes('розничн')) retailPriceTypeId = pt.Ид;
        if (name.includes('закупочн')) purchasePriceTypeId = pt.Ид;
    }
    // Fallback if exactly these words aren't used
    if (!retailPriceTypeId && priceTypes.length > 0) retailPriceTypeId = priceTypes[0].Ид; 
    
    const rawOffers = packageOffers?.Предложения?.Предложение;
    const offers = Array.isArray(rawOffers) ? rawOffers : (rawOffers ? [rawOffers] : []);
    console.log(`Found ${offers.length} offers.`);

    const offersMap = new Map(offers.map(o => [o.Ид, o]));

    // ----------------------------------------------------
    // 3. Save Products to Database
    // ----------------------------------------------------
    console.log(`Saving products to database...`);
    let saved = 0;

    for (const p of products) {
        const offer = offersMap.get(p.Ид);
        
        let price = 0;
        let purchasePrice = 0;
        
        // Extract Prices
        if (offer && offer.Цены && offer.Цены.Цена) {
            const prices = Array.isArray(offer.Цены.Цена) ? offer.Цены.Цена : [offer.Цены.Цена];
            for (const pr of prices) {
                if (pr.ИдТипаЦены === retailPriceTypeId) price = parseFloat(pr.ЦенаЗаЕдиницу || '0');
                if (pr.ИдТипаЦены === purchasePriceTypeId) purchasePrice = parseFloat(pr.ЦенаЗаЕдиницу || '0');
            }
        }
        
        // Stock 
        const stock = parseFloat(offer?.Количество || '0');
        
        // Category 
        let categoryId = null;
        if (p.Группы && p.Группы.Ид) {
            categoryId = p.Группы.Ид;
        } else if (importData.Категория) {
            // some 1C variants use plain Категория string, usually it's in Группы.Ид
             categoryId = p.Категория;
        }

        // Image URL
        let imageUrl = null;
        if (p.Картинка) {
            const firstImage = Array.isArray(p.Картинка) ? p.Картинка[0] : p.Картинка;
            imageUrl = `${S3_BASE}/${firstImage}`;
        }

        const sku = p.Артикул || '';
        const barcode = p.Штрихкод ? String(p.Штрихкод) : '';
        const name = p.Наименование || 'Без названия';
        const description = typeof p.Описание === 'string' ? p.Описание : '';
        const maxDescription = description.substring(0, 1000); // safety cap

        try {
           await db.query(`
                INSERT INTO products (id, name, sku, barcode, "categoryId", price, "purchasePrice", stock, description, image, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, 
                sku = EXCLUDED.sku,
                barcode = EXCLUDED.barcode,
                "categoryId" = EXCLUDED."categoryId",
                price = EXCLUDED.price, 
                "purchasePrice" = EXCLUDED."purchasePrice",
                stock = EXCLUDED.stock, 
                description = EXCLUDED.description,
                image = EXCLUDED.image,
                "updatedAt" = EXCLUDED."updatedAt"
            `, [
               p.Ид, name, sku, barcode, categoryId, price, purchasePrice, stock, maxDescription, imageUrl, new Date().toISOString(), new Date().toISOString()
            ]);
            saved++;
        } catch (e) {
            console.error(`Failed to save product ${p.Ид}: `, e);
        }
    }
    
    console.log(`Import successful! Saved ${saved} products to DB.`);
    
  } catch (e) {
    console.error('Import Error:', e);
  } finally {
     process.exit(0);
  }
}

importFromS3();
