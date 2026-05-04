const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '..', 'dentry', 'dentry_logo_wordmark_fondo_oscuro.png');
const outputPng = path.join(__dirname, '..', 'public', 'favicon.png');
const outputIco = path.join(__dirname, '..', 'public', 'favicon.ico');

async function generateFavicon() {
  try {
    // Generate 64x64 PNG favicon
    await sharp(inputPath)
      .resize(64, 64, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPng);

    console.log('Generated favicon.png (64x64)');

    // Generate ICO (actually a 32x32 PNG that browsers accept as ico)
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputIco);

    console.log('Generated favicon.ico (32x32)');

    // Also generate a larger version for apple-touch-icon
    const appleTouchPath = path.join(__dirname, '..', 'public', 'apple-touch-icon.png');
    await sharp(inputPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(appleTouchPath);

    console.log('Generated apple-touch-icon.png (180x180)');

  } catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
