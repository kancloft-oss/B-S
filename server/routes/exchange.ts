import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export const exchangeRouter = express.Router();

// ================= API 1C EXCHANGE =================
  // 1С часто использует GET для проверки соединения и инициализации
  exchangeRouter.all('/', async (req, res) => {
    try {
      const { type, mode, filename } = req.query;

      const debugInfo = `Method: ${req.method}, Query: ${JSON.stringify(req.query)}, Body size: ${req.body?.length || 0}`;
      console.log(`1C Exchange request: ${debugInfo}`, '/api/1c/exchange', false);

      if (type === 'catalog' && mode === 'checkauth') {
        return res.send('success\nPHPSESSID\nsecretKey123');
      }
      
      if (type === 'catalog' && mode === 'init') {
        return res.send('zip=no\nfile_limit=5000000');
      }

      // Если 1С отправляет файл (POST), перенаправляем его прямо в S3
      if (type === 'catalog' && mode === 'file' && req.method === 'POST' && filename) {
        try {
          const fileKey = (filename as string);
          
          // Считываем поток в буфер
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          console.log(`--- UPLOADING TO S3: ${fileKey} ---`);
          
          await executeWithLimiter(() => uploadBufferedToS3(buffer, fileKey, 'application/octet-stream'));
          
          console.log(`--- FILE UPLOADED TO S3: ${fileKey} ---`);
          return res.send('success');
        } catch (e) {
          console.error('S3 Upload Error Details:', e);
          return res.status(500).send('failure\n' + (e as Error).stack);
        }
      }

      res.send('success');
    } catch (e) {
      console.error('1C Exchange Error:', e);
      res.status(500).send('failure\n' + (e as Error).message);
    }
  });

  // Helper for 1C raw upload
  // Ограничитель параллельных загрузок (Semaphore)
let concurrentUploads = 0;
const MAX_CONCURRENT_UPLOADS = 100;

async function executeWithLimiter<T>(fn: () => Promise<T>): Promise<T> {
  if (concurrentUploads >= MAX_CONCURRENT_UPLOADS) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return executeWithLimiter(fn);
  }
  concurrentUploads++;
  try {
    return await fn();
  } finally {
    concurrentUploads--;
  }
}

// Helper for 1C raw upload
async function uploadBufferedToS3(buffer: Buffer, key: string, contentType: string) {
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

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length
    }));
    console.log(`--- S3 UPLOAD SUCCESS --- Key: ${key}, Size: ${buffer.length} bytes`);
  } catch (err: any) {
    console.error('--- S3 UPLOAD ERROR ---', err);
    throw err;
  }
}