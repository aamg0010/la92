const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const dentryDir = path.join(__dirname, '..', 'dentry');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'dentry');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const images = [
  { input: 'dentry_hero_landing_page.jpeg', output: 'hero.jpg', width: 1200 },
  { input: 'dentry_dashboard_ui_mockup.jpeg', output: 'dashboard-mockup.jpg', width: 1000 },
  { input: 'dentry_instagram_post_1_reveal.png', output: 'feature-1.jpg', width: 600 },
  { input: 'dentry_instagram_post_2_tagline.png', output: 'feature-2.jpg', width: 600 },
  { input: 'dentry_instagram_post_3_lifestyle.png', output: 'feature-3.jpg', width: 600 },
  { input: 'dentry_instagram_post_5_feature_historial.jpeg', output: 'feature-historial.jpg', width: 600 },
  { input: 'dentry_instagram_post_6_cta.png', output: 'cta.jpg', width: 800 },
];

async function optimizeImages() {
  for (const img of images) {
    const inputPath = path.join(dentryDir, img.input);
    const outputPath = path.join(outputDir, img.output);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${img.input} - not found`);
      continue;
    }

    try {
      const info = await sharp(inputPath)
        .resize(img.width, null, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      console.log(`✓ ${img.output} - ${Math.round(info.size / 1024)}KB`);
    } catch (error) {
      console.error(`✗ ${img.input}: ${error.message}`);
    }
  }
  console.log('\nDone!');
}

optimizeImages();
