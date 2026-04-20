import fs from 'fs';
import path from 'path';

const dir = 'src/pages/admin/views';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    // Change "../../" to "../../../" for the standard imports
    content = content.replace(/from "\.\.\/\.\.\//g, 'from "../../../');
    content = content.replace(/from '\.\.\/\.\.\//g, "from '../../../");
    fs.writeFileSync(fullPath, content);
  }
}
console.log('Fixed imports in frontend views!');
