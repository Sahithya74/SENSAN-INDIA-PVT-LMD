#!/usr/bin/env node
/**
 * Director portraits → web-ready, consistently graded images.
 *
 *   npm run images
 *
 * Reads   src/assets/directors/<slug>.(jpg|jpeg|png|webp)
 * Writes  public/images/directors/<slug>-<width>.avif|webp (+ .jpg fallback)
 *         src/content/generated/portraits.json (read by the Leadership section)
 *         qa-output/portraits/<slug>-compare.jpg (before | after, for review)
 *
 * Settings per portrait: scripts/portraits.config.mjs. The treatment is
 * photographic only — crop, exposure, white balance, contrast, edge falloff,
 * sharpening. It never alters a face.
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './portraits.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src', 'assets', 'directors');
const outDir = path.join(root, 'public', 'images', 'directors');
const qaDir = path.join(root, 'qa-output', 'portraits');
const manifestPath = path.join(root, 'src', 'content', 'generated', 'portraits.json');
const WIDTHS = [800, 1200, 1600];
const RATIO = 4 / 5;
const GRAPHITE = { r: 32, g: 34, b: 38 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function cropBox(width, height, [fx, fy], zoom) {
  let w = width;
  let h = Math.round(w / RATIO);
  if (h > height) {
    h = height;
    w = Math.round(h * RATIO);
  }
  w = Math.round(w / zoom);
  h = Math.round(h / zoom);
  // Keep the face slightly above centre — the classic portrait eye line.
  const left = clamp(Math.round(fx * width - w / 2), 0, width - w);
  const top = clamp(Math.round(fy * height - h * 0.42), 0, height - h);
  return { left, top, width: w, height: h };
}

/** Edge falloff toward graphite: the subject stays untouched, the surround recedes. */
function falloffSvg(w, h, strength) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="v" cx="50%" cy="42%" r="75%">
      <stop offset="0.55" stop-color="rgb(${GRAPHITE.r},${GRAPHITE.g},${GRAPHITE.b})" stop-opacity="0"/>
      <stop offset="1" stop-color="rgb(${GRAPHITE.r},${GRAPHITE.g},${GRAPHITE.b})" stop-opacity="${strength}"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#v)"/></svg>`);
}

/**
 * White outside the subject, black inside — alpha for the softened background.
 * A tall ellipse protects the whole head-and-shoulders column; only the sides
 * and upper corners soften.
 */
function edgeMaskSvg(w, h) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="m" cx="0.5" cy="0.55" r="0.5"
        gradientTransform="translate(0.5 0.55) scale(1 1.7) translate(-0.5 -0.55)">
      <stop offset="0.66" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#m)"/></svg>`);
}

async function grade(input, settings) {
  const { data, info } = await sharp(input).rotate().toColourspace('srgb').toBuffer({ resolveWithObject: true });
  const box = cropBox(info.width, info.height, settings.focus ?? [0.5, 0.4], settings.zoom ?? 1);
  let image = sharp(data).extract(box);

  if (settings.retouch === 'professional') {
    // Neutralise colour casts from indoor light (half-strength grey-world, capped at ±7 %).
    const { channels } = await sharp(await image.clone().toBuffer()).stats();
    const means = channels.slice(0, 3).map((c) => c.mean);
    const grey = (means[0] + means[1] + means[2]) / 3;
    const gains = means.map((m) => clamp(1 + (grey / m - 1) * 0.5, 0.93, 1.07));
    image = image.linear(gains, [0, 0, 0]);
  }

  image = image.normalise({ lower: 0.5, upper: 99.5 });
  if (settings.retouch === 'professional') {
    image = image.linear(1.05, -6).modulate({ saturation: 0.96 });
  }
  image = image.sharpen({ sigma: 0.7, m1: 0.5, m2: 1.1 });
  let graded = await image.toBuffer();

  if (settings.retouch === 'professional') {
    const softened = await sharp(graded).blur(5).toBuffer();
    const mask = await sharp(edgeMaskSvg(box.width, box.height)).greyscale().toBuffer();
    const softEdges = await sharp(softened).removeAlpha().joinChannel(mask).png().toBuffer();
    graded = await sharp(graded)
      .composite([{ input: softEdges }, { input: falloffSvg(box.width, box.height, settings.falloff ?? 0.55) }])
      .toBuffer();
  } else {
    graded = await sharp(graded).composite([{ input: falloffSvg(box.width, box.height, settings.falloff ?? 0.3) }]).toBuffer();
  }
  return { graded, box, original: data, originalInfo: info };
}

/** `--test <image>`: run the professional treatment on any image into qa-output only. */
async function selfTest(file) {
  await mkdir(qaDir, { recursive: true });
  const { graded, box, original } = await grade(file, { retouch: 'professional', focus: [0.5, 0.4], zoom: 1 });
  const before = await sharp(original).extract(box).resize({ height: 600 }).toBuffer();
  const after = await sharp(graded).resize({ height: 600 }).toBuffer();
  const { width } = await sharp(before).metadata();
  const out = path.join(qaDir, 'selftest-compare.jpg');
  await sharp({ create: { width: width * 2 + 16, height: 600, channels: 3, background: '#090a0c' } })
    .composite([{ input: before, left: 0, top: 0 }, { input: after, left: width + 16, top: 0 }])
    .jpeg({ quality: 85 })
    .toFile(out);
  console.log(`Self-test written: ${path.relative(root, out)}`);
}

async function main() {
  const testIndex = process.argv.indexOf('--test');
  if (testIndex > 0) return selfTest(process.argv[testIndex + 1]);

  await mkdir(outDir, { recursive: true });
  await mkdir(qaDir, { recursive: true });
  const files = await readdir(srcDir).catch(() => []);
  const manifest = {};

  for (const [slug, settings] of Object.entries(config)) {
    const file = files.find((f) => f.replace(/\.(jpe?g|png|webp)$/i, '') === slug);
    if (!file) {
      console.log(`· ${slug}: no photo yet (expected src/assets/directors/${slug}.jpg)`);
      continue;
    }
    const { graded, box, original, originalInfo } = await grade(path.join(srcDir, file), settings);
    const widths = WIDTHS.filter((w) => w <= box.width);
    // Always offer the full resolution too, when it is meaningfully larger.
    if (!widths.length || box.width > widths[widths.length - 1] + 100) widths.push(box.width);

    for (const w of widths) {
      const resized = sharp(graded).resize({ width: w });
      await Promise.all([
        resized.clone().avif({ quality: 62, effort: 5 }).toFile(path.join(outDir, `${slug}-${w}.avif`)),
        resized.clone().webp({ quality: 82 }).toFile(path.join(outDir, `${slug}-${w}.webp`)),
      ]);
    }
    const fallbackWidth = widths[Math.min(1, widths.length - 1)];
    await sharp(graded).resize({ width: fallbackWidth }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(outDir, `${slug}.jpg`));

    const srcset = (ext) => widths.map((w) => `/images/directors/${slug}-${w}.${ext} ${w}w`).join(', ');
    manifest[slug] = {
      alt: settings.alt,
      width: box.width,
      height: box.height,
      avif: srcset('avif'),
      webp: srcset('webp'),
      fallback: `/images/directors/${slug}.jpg`,
    };

    // Before | after, same crop, for sign-off.
    const before = await sharp(original).extract(box).resize({ height: 900 }).toBuffer();
    const after = await sharp(graded).resize({ height: 900 }).toBuffer();
    const { width: bw } = await sharp(before).metadata();
    await sharp({ create: { width: bw * 2 + 24, height: 900, channels: 3, background: '#090a0c' } })
      .composite([{ input: before, left: 0, top: 0 }, { input: after, left: bw + 24, top: 0 }])
      .jpeg({ quality: 88 })
      .toFile(path.join(qaDir, `${slug}-compare.jpg`));

    console.log(`✓ ${slug}: ${settings.retouch}, ${originalInfo.width}×${originalInfo.height} → ${box.width}×${box.height}`);
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Manifest: ${path.relative(root, manifestPath)}`);
}

await main();
