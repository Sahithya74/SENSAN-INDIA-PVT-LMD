#!/usr/bin/env node
/**
 * Renders the hero frame sequences, posters and OG image from the live
 * Three.js scene (render mode: /?render=1), so phones and non-WebGL devices
 * see exactly the same construction sequence.
 *
 *   npm run render:hero              # all sets
 *   npm run render:hero -- --only portrait --frames 40
 *
 * Output (public/hero/ and public/og.jpg):
 *   frames/<orientation>/000.avif|webp … + manifest.json (with the progress of each frame)
 *   poster-intro-<orientation>.avif|webp, poster-final-<orientation>.avif|webp
 */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdir, rm, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'hero');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const FRAMES = Number(opt('frames', 110));
const only = opt('only', 'landscape,portrait').split(',');

/**
 * Where to sample the timeline. Frames are spent where things move: extra
 * density while members fly in (structure/assembly) and most of all during
 * the wordmark reveal, so the player never cross-fades two very different images.
 */
const motionWeight = (p) => 1 + (p > 0.25 && p < 0.65 ? 1.2 : 0) + (p > 0.86 && p < 0.98 ? 2.8 : 0);

function frameStops(count) {
  const steps = 4000;
  const cumulative = [0];
  for (let i = 1; i <= steps; i++) cumulative.push(cumulative[i - 1] + motionWeight((i - 0.5) / steps));
  const total = cumulative[steps];
  const stops = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    while (j < steps && cumulative[j + 1] < target) j++;
    const span = cumulative[j + 1] - cumulative[j] || 1;
    stops.push(Math.min(1, (j + (target - cumulative[j]) / span) / steps));
  }
  stops[0] = 0;
  stops[count - 1] = 1;
  return stops.map((s) => Math.round(s * 1e5) / 1e5);
}
const STOPS = frameStops(FRAMES);

const SETS = [
  { orientation: 'landscape', width: 1600, height: 900 },
  { orientation: 'portrait', width: 720, height: 1480 }, // ~9:19.5, today's phones
].filter((s) => only.includes(s.orientation));

// No file watching: an edit elsewhere must never reload the page mid-render. HMR stays
// on so the dependency optimiser's one-time reload can complete; own cache dir so it
// never fights a running dev server.
const server = await createServer({
  root,
  logLevel: 'error',
  cacheDir: 'node_modules/.vite-render',
  server: { port: 5199, strictPort: false, watch: null },
});
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-unsafe-swiftshader'],
});

async function openScene(orientation, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', (err) => console.error(`  page error: ${err.message}`));
  await page.goto(`${base}?render=1&orient=${orientation}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__hero, null, { timeout: 180000 });
  await page.evaluate(() => window.__hero.ready);
  return page;
}

async function capture(page, p) {
  await page.evaluate((progress) => window.__hero.render(progress), p);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.screenshot({ type: 'png' });
}

const kb = async (file) => Math.round((await stat(file)).size / 1024);

for (const { orientation, width, height } of SETS) {
  const dir = path.join(out, 'frames', orientation);
  // Open the scene first: if it fails, the previous frames stay in place.
  const page = await openScene(orientation, width, height);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  let total = 0;
  for (let i = 0; i < FRAMES; i++) {
    const png = await capture(page, STOPS[i]);
    const name = String(i).padStart(3, '0');
    const avif = path.join(dir, `${name}.avif`);
    const webp = path.join(dir, `${name}.webp`);
    await Promise.all([
      sharp(png).avif({ quality: 50, effort: 4 }).toFile(avif),
      sharp(png).webp({ quality: 72, effort: 5 }).toFile(webp),
    ]);
    total += await kb(avif);
    process.stdout.write(`\r${orientation}: frame ${i + 1}/${FRAMES}`);
  }
  await writeFile(
    path.join(dir, 'manifest.json'),
    JSON.stringify({ count: FRAMES, width, height, formats: ['avif', 'webp'], pad: 3, stops: STOPS }),
  );
  console.log(`\n${orientation}: ${FRAMES} frames, ${total} KB as AVIF`);

  for (const [which, p] of [
    ['intro', 0],
    ['final', 1],
  ]) {
    const png = await capture(page, p);
    await Promise.all([
      sharp(png).avif({ quality: 60, effort: 5 }).toFile(path.join(out, `poster-${which}-${orientation}.avif`)),
      sharp(png).webp({ quality: 80, effort: 5 }).toFile(path.join(out, `poster-${which}-${orientation}.webp`)),
    ]);
  }
  await page.close();
}

if (only.includes('landscape')) {
  const page = await openScene('landscape', 1200, 630);
  const png = await capture(page, 1);
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(root, 'public', 'og.jpg'));
  await page.close();
  console.log('og.jpg written');
}

await browser.close();
await server.close();
