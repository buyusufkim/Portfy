const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function createIcon(size, filename, text) {
  const image = new Jimp(size, size, '#061A32');
  
  // Try to write the image
  const outPath = path.join(__dirname, 'public', 'icons', filename);
  await image.writeAsync(outPath);
  console.log(`Created ${outPath}`);
}

async function main() {
  const dir = path.join(__dirname, 'public', 'icons');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await createIcon(192, 'icon-192.png', 'P');
  await createIcon(512, 'icon-512.png', 'P');
  await createIcon(192, 'icon-192-maskable.png', 'P');
  await createIcon(512, 'icon-512-maskable.png', 'P');
  await createIcon(180, 'apple-touch-icon.png', 'P');
}

main().catch(console.error);
