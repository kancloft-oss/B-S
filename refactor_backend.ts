import fs from 'fs';

const source = fs.readFileSync('server.ts', 'utf-8');

function extract(startStr, endStr) {
    const s = source.indexOf(startStr);
    if (s === -1) return '';
    const e = endStr ? source.indexOf(endStr, s) : source.length;
    if (e === -1) return source.substring(s);
    return source.substring(s, e).trim();
}

const header = `import express from 'express';
import { db } from '../db.js';
import multer from 'multer';
import { uploadToS3 } from '../../src/services/s3Service.js';
`;

fs.mkdirSync('server/routes', { recursive: true });

// 1. Upload Route
let uploadMatch = extract("  // ================= UPLOAD API =================", "  // ================= API 1C EXCHANGE =================");
if (uploadMatch) {
    let code = `import express from 'express';\nimport multer from 'multer';\nimport { uploadToS3 } from '../../src/services/s3Service.js';\n\nexport const uploadRouter = express.Router();\nconst upload = multer({ storage: multer.memoryStorage() });\n\n` +
               uploadMatch.replace(/app\.post\('/g, "uploadRouter.post('/").replace(/'\/api\/upload'/g, "'/'");
    fs.writeFileSync('server/routes/upload.ts', code);
}

// 2. Orders Route
let ordersMatch = extract("  // ================= API ORDERS =================", "  // ================= API STATS =================");
if (ordersMatch) {
    let code = `import express from 'express';\nimport { db } from '../db.js';\n\nexport const ordersRouter = express.Router();\n\n` +
               ordersMatch.replace(/app\.(get|post|put|delete)\('\/api\/orders/g, "ordersRouter.$1('");
    fs.writeFileSync('server/routes/orders.ts', code);
}

// 3. Categories Route
let catMatch = extract("  // ================= API CATEGORIES =================", "  // ================= API ORDERS =================");
if (catMatch) {
    let code = `import express from 'express';\nimport { db } from '../db.js';\n\nexport const categoriesRouter = express.Router();\n\n` +
               catMatch.replace(/app\.(get|post|put|delete)\('\/api\/categories/g, "categoriesRouter.$1('");
    fs.writeFileSync('server/routes/categories.ts', code);
}

// 4. Products Route
let prodMatch = extract("  app.get('/api/products'", "  // ================= API CATEGORIES =================");
if (prodMatch) {
    let code = `import express from 'express';\nimport { db } from '../db.js';\n\nexport const productsRouter = express.Router();\n\n` +
               `productsRouter.get('/'` + prodMatch.substring(prodMatch.indexOf(',')).replace(/app\.(get|post|put|delete)\('\/api\/products/g, "productsRouter.$1('");
    fs.writeFileSync('server/routes/products.ts', code);
}

// 5. 1C Exchange Route (this one has helper functions)
let excMatch = extract("  // ================= API 1C EXCHANGE =================", "  app.get('/api/products'");
if (excMatch) {
    let code = `import express from 'express';\nimport { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';\nimport fs from 'fs';\nimport path from 'path';\n\nexport const exchangeRouter = express.Router();\n\n` +
               excMatch.replace(/app\.all\('\/api\/1c\/exchange'/g, "exchangeRouter.all('/'");
               // We need logToServer in exchangeRouter as well or just a dummy
               code = code.replace(/logToServer\(/g, "console.log("); 
    fs.writeFileSync('server/routes/exchange.ts', code);
}

// 6. Stats Route
let statsMatch = extract("  // ================= API STATS =================", "  // Middleware Vite");
if (statsMatch) {
    let code = `import express from 'express';\nimport { db } from '../db.js';\n\nexport const statsRouter = express.Router();\n\n` +
               statsMatch.replace(/app\.get\('\/api\/stats'/g, "statsRouter.get('/'");
    fs.writeFileSync('server/routes/stats.ts', code);
}

// rewrite server.ts manually to just stitch these things together
console.log('Backend routes extracted');
