import express from 'express';
import multer from 'multer';
import { uploadToS3 } from '../../src/services/s3Service.js';

export const uploadRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ================= UPLOAD API =================
  uploadRouter.post('//api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }
      
      let folder = req.body.folder || 'general';
      const validFolders = ['banners', 'products', 'categories', 'general'];
      if (!validFolders.includes(folder)) folder = 'general';

      const fileUrl = await uploadToS3(req.file, folder);
      
      res.json({ url: fileUrl });
    } catch (e) {
      console.error('Upload Error:', e);
      res.status(500).json({ error: (e as Error).message });
    }
  });