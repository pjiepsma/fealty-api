import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy and rename payload-types.ts to payload.ts in fealty
const sourceFile = path.join(__dirname, '../src/payload-types.ts');
const destFile = path.join(__dirname, '../../fealty/types/payload.ts');

// Ensure destination directory exists
const destDir = path.dirname(destFile);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile);
  console.log(`✅ Copied ${sourceFile} to ${destFile}`);
} else {
  console.error(`❌ Source file not found: ${sourceFile}`);
  process.exit(1);
}

