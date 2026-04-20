
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

async function analyze() {
  const bucket = process.env.S3_BUCKET_NAME || 'brusher-s3';
  const endpoint = process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru';
  
  const s3Client = new S3Client({
    endpoint: endpoint,
    region: process.env.S3_REGION || 'ru-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    },
    forcePathStyle: true
  });

  console.log('--- Listing files in S3 ---');
  try {
    const listRes = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucket
      // Remove Prefix to see everything
    }));

    if (!listRes.Contents) {
      console.log('No files found with prefix "webdata"');
      return;
    }

    console.log(`Found ${listRes.Contents.length} files:`);
    const offersMatching = listRes.Contents.filter(f => f.Key?.toLowerCase().includes('offers') || f.Key?.toLowerCase().includes('price'));
    console.log(`Found ${offersMatching.length} files matching 'offers' or 'price':`);
    for (const file of offersMatching) {
      console.log(` - ${file.Key} (${file.Size} bytes)`);
    }

    const xmlFiles = listRes.Contents.filter(f => f.Key?.toLowerCase().endsWith('.xml'));
    console.log(`Found ${xmlFiles.length} XML files:`);
    for (const file of xmlFiles) {
      console.log(` - ${file.Key} (${file.Size} bytes)`);
    }

    // Look for import.xml or offers.xml
    const importFile = xmlFiles.find(f => f.Key?.endsWith('import.xml'));
    const offersFile = xmlFiles.find(f => f.Key?.endsWith('offers.xml'));

    if (importFile) {
      console.log(`\n--- Reading ${importFile.Key} ---`);
      const getRes = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: importFile.Key
      }));
      const body = await getRes.Body?.transformToString();
      const productCount = (body?.match(/<Товар>/g) || []).length;
      console.log(`Product count in import.xml: ${productCount}`);
      console.log('\n--- Searching for ПакетПредложений ---');
      const packIndex = body?.indexOf('<ПакетПредложений');
      if (packIndex && packIndex !== -1) {
        console.log(`Found ПакетПредложений at index ${packIndex}`);
        console.log(body?.substring(packIndex, packIndex + 5000) + '...');
      } else {
        console.log('ПакетПредложений NOT found in import.xml');
      }
      console.log('\n--- End of file ---');
      console.log('...' + body?.substring(Math.max(0, (body?.length || 0) - 5000)));
    }

    if (offersFile) {
      console.log(`\n--- Reading ${offersFile.Key} ---`);
      const getRes = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: offersFile.Key
      }));
      const body = await getRes.Body?.transformToString();
      console.log(body?.substring(0, 5000) + '...');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

analyze();
