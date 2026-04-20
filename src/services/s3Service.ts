import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';

let s3ClientInstance: S3Client | null = null;

function getS3Client() {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
      region: process.env.S3_REGION || 'ru-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: true
    });
  }
  return s3ClientInstance;
}

function getBucketName() {
  return process.env.S3_BUCKET_NAME || 'brusher-s3';
}

/**
 * Downloads a file from Timeweb Cloud S3
 */
export async function downloadFromS3(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  const response = await getS3Client().send(command);
  
  if (!response.Body) {
    throw new Error('S3 Response Body is empty');
  }

  // AWS SDK v3 provides transformToString for Node streams natively
  return await response.Body.transformToString('utf-8');
}

/**
 * Optimizes an image using sharp.
 * Converts to WebP format for fast loading and scales down if necessary.
 */
async function optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer, mimeType: string, extension: string }> {
  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
    
  return { buffer: optimizedBuffer, mimeType: 'image/webp', extension: '.webp' };
}

/**
 * Uploads a file to Timeweb Cloud S3
 */
export async function uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
  const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');
  
  let finalBuffer = file.buffer;
  let finalMimeType = file.mimetype;
  let ext = path.extname(file.originalname);
  
  // Optimize images
  if (isImage) {
    const optimized = await optimizeImage(file.buffer);
    finalBuffer = optimized.buffer;
    finalMimeType = optimized.mimeType;
    ext = optimized.extension;
  }
  
  // Create a unique filename
  const filename = `${uuidv4()}${ext}`;
  const key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: finalBuffer,
    ContentType: finalMimeType,
    // Note: Use public-read if files need to be publicly accessible directly via S3 link
    // However, Timeweb supports ACL if required or relies on bucket policies.
    ACL: 'public-read' 
  });

  await getS3Client().send(command);

  // Return the public URL
  const endpoint = process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru';
  return `${endpoint}/${getBucketName()}/${key}`;
}
