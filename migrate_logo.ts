import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToS3 } from './src/services/s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadLogo() {
  const logoPath = path.join(__dirname, 'src', 'logo.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error('Logo file not found at:', logoPath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(logoPath);
  
  // Create a mock file object as required by s3Service
  const file = {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: fileBuffer,
    size: fileBuffer.length,
    stream: null as any,
    destination: '',
    filename: 'logo.png',
    path: logoPath
  };

  try {
    const url = await uploadToS3(file, 'banners');
    console.log('SUCCESS_URL:', url);
  } catch (error) {
    console.error('Error uploading logo:', error);
    process.exit(1);
  }
}

uploadLogo();
