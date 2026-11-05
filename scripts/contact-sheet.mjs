#!/usr/bin/env node
/**
 * Tiles QA screenshots (qa-output/<folder>/hero-XXX.png) into one labelled
 * contact sheet, for reviewing the whole hero sequence at a glance.
 *
 *   node scripts/contact-sheet.mjs <folder> [--cols 4] [--width 480]
 *
 * Output: qa-output/<folder>-sheet.jpg
 */
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const folder = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const cols = opt('cols', 4);
const tileWidth = opt('width', 480);
const dir = path.resolve('qa-output', folder);

const STAGES = [
  [0, 'Origin'],
  [0.08, 'Foundation'],
  [0.25, 'Structure'],
  [0.45, 'Assembly'],
  [0.62, 'Alignment'],
  [0.75, 'Completion'],
  [0.88, 'Identity'],
];
const stageAt = (p) => STAGES.filter(([start]) => p >= start).pop()[1];

const files = (await readdir(dir)).filter((f) => /^hero-\d{3}\.png$/.test(f)).sort();
const first = await sharp(path.join(dir, files[0])).metadata();
const tileHeight = Math.round((first.height / first.width) * tileWidth);
const labelHeight = 28;
const gap = 8;
const rows = Math.ceil(files.length / cols);

const tiles = await Promise.all(
  files.map(async (file, i) => {
    const p = Number(file.slice(5, 8)) / 100;
    const image = await sharp(path.join(dir, file)).resize({ width: tileWidth }).toBuffer();
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${labelHeight}">
      <text x="2" y="19" font-family="Consolas, monospace" font-size="13" fill="#aeb3b8" letter-spacing="1.5">${p.toFixed(2)} · ${stageAt(p).toUpperCase()}</text></svg>`);
    const left = (i % cols) * (tileWidth + gap);
    const top = Math.floor(i / cols) * (tileHeight + labelHeight + gap);
    return [
      { input: label, left, top },
      { input: image, left, top: top + labelHeight },
    ];
  }),
);

const out = path.resolve('qa-output', `${folder}-sheet.jpg`);
await sharp({
  create: {
    width: cols * tileWidth + (cols - 1) * gap,
    height: rows * (tileHeight + labelHeight + gap) - gap,
    channels: 3,
    background: '#090a0c',
  },
})
  .composite(tiles.flat())
  .jpeg({ quality: 86 })
  .toFile(out);
console.log(out);
