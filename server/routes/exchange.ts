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
          // Заменяем слеши на подчеркивания, чтобы избежать ошибки создания папок
          const fileKey = filename.replace(/\//g, '_');
          
          // Передаем поток (req) напрямую в S3
          await uploadRawToS3(req, fileKey, 'application/octet-stream');
          
          console.log(`--- FILE UPLOADED TO S3: ${fileKey} ---`);
          return res.send('success');
        } catch (e) {
          console.error('S3 Upload Error:', e);
          return res.status(500).send('failure\nS3 Upload error');
        }
      }

      res.send('success');
    } catch (e) {
      console.error('1C Exchange Error:', e);
      res.status(500).send('failure\n' + (e as Error).message);
    }
  });

  // Helper for 1C raw upload
  // Helper for 1C raw streaming upload
  async function uploadRawToS3(stream: import('stream').Readable, key: string, contentType: string) {
    const bucket = process.env.S3_BUCKET_NAME || 'brusher-s3';
    const endpoint = process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru';
    
    const s3Client = new S3Client({
      endpoint: endpoint,
      region: process.env.S3_REGION || 'ru-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: true // Возвращаем обязательно
    });

    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        ContentLength: parseInt(req.headers['content-length'] || '0') || undefined
      }));
      console.log(`--- S3 UPLOAD SUCCESS --- Key: ${key}`);
    } catch (err: any) {
      console.error('--- S3 STREAMING UPLOAD ERROR ---', err);
      throw err; // Пробрасываем для обработки в API-эндпоинте
    }
  }