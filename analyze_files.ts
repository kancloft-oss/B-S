
import { downloadFromS3 } from './src/services/s3Service';

async function analyze() {
  try {
    console.log('--- FETCHING import.xml ---');
    const importXml = await downloadFromS3('import.xml');
    console.log('import.xml (first 500 chars):');
    console.log(importXml.substring(0, 500));
    
    console.log('\n--- FETCHING offers.xml ---');
    const offersXml = await downloadFromS3('offers.xml');
    console.log('offers.xml (first 500 chars):');
    console.log(offersXml.substring(0, 500));
    
  } catch (e) {
    console.error('Error fetching files:', e);
  }
}

analyze();
