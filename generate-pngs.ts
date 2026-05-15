import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#061A32" />
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#14B8A6" font-family="sans-serif" font-size="300" font-weight="bold">P</text>
</svg>`;

const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#061A32" />
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#14B8A6" font-family="sans-serif" font-size="240" font-weight="bold">P</text>
</svg>`;

async function main() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Save base SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

  // Generate PNGs
  const buffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(maskableSvgContent);

  await sharp(buffer).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  await sharp(buffer).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(iconsDir, 'maskable-icon-512.png'));
  console.log('Created maskable-icon-512.png');

  await sharp(buffer).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');
}

main().catch(console.error);
