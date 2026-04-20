import { downloadFromS3 } from './src/services/s3Service.js';
import { CommerceMLParser } from './src/services/commerceMLParser.js';

async function analyze1C() {
  console.log('--- STARTING DEEP ANALYSIS OF 1C FILES ---');
  try {
    const parser = new CommerceMLParser();
    
    // 1. Download and Parse import.xml
    console.log('Fetching 1C/import.xml...');
    const importXml = await downloadFromS3('1C/import.xml');
    console.log(`import.xml downloaded: ${importXml.length} bytes.`);
    
    console.log('Parsing import.xml...');
    const importData = parser.parse(importXml);
    
    const catalog = importData?.КоммерческаяИнформация?.Каталог;
    if (!catalog) {
       console.log('ERROR: Could not find КоммерческаяИнформация.Каталог in import.xml');
    } else {
        const products = Array.isArray(catalog.Товары?.Товар) ? catalog.Товары.Товар : (catalog.Товары?.Товар ? [catalog.Товары.Товар] : []);
        console.log(`\nFound ${products.length} products in import.xml`);
        
        if (products.length > 0) {
            console.log('\n--- SAMPLE PRODUCT STRUCTURE ---');
            console.log(JSON.stringify(products[0], null, 2));
        }

        const groups = Array.isArray(importData.КоммерческаяИнформация.Классификатор?.Группы?.Группа) ? importData.КоммерческаяИнформация.Классификатор.Группы.Группа : (importData.КоммерческаяИнформация.Классификатор?.Группы?.Группа ? [importData.КоммерческаяИнформация.Классификатор.Группы.Группа] : []);
        console.log(`\nFound ${groups.length} root categories.`);
        if (groups.length > 0) {
            console.log('\n--- SAMPLE CATEGORY STRUCTURE ---');
            console.log(JSON.stringify(groups[0], null, 2));
        }
        
        const properties = Array.isArray(importData.КоммерческаяИнформация.Классификатор?.Свойства?.Свойство) ? importData.КоммерческаяИнформация.Классификатор.Свойства.Свойство : (importData.КоммерческаяИнформация.Классификатор?.Свойства?.Свойство ? [importData.КоммерческаяИнформация.Классификатор.Свойства.Свойство] : []);
        console.log(`\nFound ${properties.length} properties.`);
        if (properties.length > 0) {
             console.log('\n--- SAMPLE PROPERTY STRUCTURE ---');
             console.log(JSON.stringify(properties[0], null, 2));
        }
    }

    // 2. Download and Parse offers.xml
    console.log('\n----------------------------------------\nFetching 1C/offers.xml...');
    const offersXml = await downloadFromS3('1C/offers.xml');
    console.log(`offers.xml downloaded: ${offersXml.length} bytes.`);
    
    console.log('Parsing offers.xml...');
    const offersData = parser.parse(offersXml);
    
    const packageOffers = offersData?.КоммерческаяИнформация?.ПакетПредложений;
    if (!packageOffers) {
       console.log('ERROR: Could not find КоммерческаяИнформация.ПакетПредложений in offers.xml');
    } else {
        const offers = Array.isArray(packageOffers.Предложения?.Предложение) ? packageOffers.Предложения.Предложение : (packageOffers.Предложения?.Предложение ? [packageOffers.Предложения.Предложение] : []);
        console.log(`\nFound ${offers.length} offers in offers.xml`);
        
        if (offers.length > 0) {
            console.log('\n--- SAMPLE OFFER STRUCTURE ---');
            console.log(JSON.stringify(offers[0], null, 2));
        }
        
        const priceTypes = Array.isArray(packageOffers.ТипыЦен?.ТипЦены) ? packageOffers.ТипыЦен.ТипЦены : (packageOffers.ТипыЦен?.ТипЦены ? [packageOffers.ТипыЦен.ТипЦены] : []);
        console.log(`\nFound ${priceTypes.length} price types.`);
        if (priceTypes.length > 0) {
            console.log('\n--- SAMPLE PRICE TYPE ---');
            console.log(JSON.stringify(priceTypes[0], null, 2));
        }
    }
  } catch (e) {
    console.error('Analysis Error:', e);
  }
}

analyze1C();
