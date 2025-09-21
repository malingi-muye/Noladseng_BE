import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple blue square PNG (base64 encoded)
const simplePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create simple PNG icons
iconSizes.forEach(size => {
  const iconPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`);
  
  // Write the base64 PNG data
  const buffer = Buffer.from(simplePNG, 'base64');
  fs.writeFileSync(iconPath, buffer);
  console.log(`Created icon-${size}x${size}.png`);
});

console.log('Simple PNG icons created successfully!');
