const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'dentry', 'dentry_logo_wordmark_fondo_oscuro.png');
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'logo-dentry-dark.png');

async function optimizeLogo() {
  try {
    const info = await sharp(inputPath)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);

    console.log('Logo optimized:', info);
    console.log(`Output: ${outputPath}`);
  } catch (error) {
    console.error('Error optimizing logo:', error);
    process.exit(1);
  }
}

optimizeLogo();
