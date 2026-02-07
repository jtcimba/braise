/**
 * Exports braise full logo as PNG in neutral-100 (#F0ECE4) for iOS LaunchScreen.
 * Run: node scripts/export-launch-logo.mjs
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'src/assets/images/braise_full_logo.svg');
const OUTPUT_DIR = path.join(
  ROOT,
  'ios/braise/Images.xcassets/braise-launch-logo.imageset',
);

const NEUTRAL_100 = '#F0ECE4';
const NEUTRAL_800 = '#291E0D';

async function main() {
  let svg = fs.readFileSync(SVG_PATH, 'utf8');
  svg = svg.replace(/#291e0d/gi, NEUTRAL_100);

  const sizes = [
    {scale: '1x', width: 594, height: 982, filename: 'braise-launch-logo.png'},
    {
      scale: '2x',
      width: 1188,
      height: 1964,
      filename: 'braise-launch-logo@2x.png',
    },
    {
      scale: '3x',
      width: 1782,
      height: 2946,
      filename: 'braise-launch-logo@3x.png',
    },
  ];

  fs.mkdirSync(OUTPUT_DIR, {recursive: true});

  const buffer = Buffer.from(svg);

  for (const {width, height, filename} of sizes) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    await sharp(buffer)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    console.log(`Wrote ${outputPath}`);
  }

  const contentsJson = {
    images: sizes.map(({scale, filename}) => ({
      filename,
      idiom: 'universal',
      scale,
    })),
    info: {author: 'xcode', version: 1},
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2),
  );
  console.log('Wrote Contents.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
