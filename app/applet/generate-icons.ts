import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

async function createIcon(size: number, filename: string) {
  // @ts-ignore
  const image = await Jimp.create(size, size, '#061A32');
  
  const outPath = path.join(process.cwd(), 'public', 'icons', filename);
  await image.write(outPath);
  console.log(`Created ${outPath}`);
}

async function main() {
  const dir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await createIcon(192, 'icon-192.png');
  await createIcon(512, 'icon-512.png');
  await createIcon(192, 'icon-192-maskable.png');
  await createIcon(512, 'icon-512-maskable.png');
  await createIcon(180, 'apple-touch-icon.png');
}

main().catch(console.error);
