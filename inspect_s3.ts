import { downloadFromS3 } from './src/services/s3Service.js';
import 'dotenv/config';

const config = {
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  bucket: 'brusher-s3',
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || ''
};

async function downloadAndInspect() {
  console.log('--- START INSPECTION ---');
  try {
    const importXml = await downloadFromS3('import.xml', config);
    console.log('--- IMPORT.XML SUMMARY ---');
    console.log('Length:', importXml.length);
    console.log('First 500 chars:', importXml.substring(0, 500));
    console.log('--- OFFERS.XML SUMMARY ---');
    const offersXml = await downloadFromS3('offers.xml', config);
    console.log('Length:', offersXml.length);
    console.log('First 500 chars:', offersXml.substring(0, 500));
  } catch(e) {
    console.error('Inspection error:', e);
  }
}

downloadAndInspect();
