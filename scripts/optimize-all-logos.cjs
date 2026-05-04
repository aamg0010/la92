const sharp = require('sharp');
const path = require('path');

async function optimizeLogo(inputPath, outputPath, maxSize = 400) {
  try {
    const info = await sharp(inputPath)
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`Optimized: ${path.basename(outputPath)} - ${info.size} bytes`);
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error.message);
  }
}

async function main() {
  const assetsDir = path.join(__dirname, '..', 'src', 'assets');

  // Optimize dentry logo in assets/dentry/
  await optimizeLogo(
    path.join(__dirname, '..', 'dentry', 'dentry_logo_wordmark_fondo_oscuro.png'),
    path.join(assetsDir, 'dentry', 'logo-dentry-dark.png')
  );

  console.log('All logos optimized!');
}

main();
