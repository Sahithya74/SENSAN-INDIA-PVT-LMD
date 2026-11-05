#!/usr/bin/env node
/**
 * Renders single stills of the hero scene from a running dev server — for
 * tuning the scene, and for exporting section imagery.
 *
 *   node scripts/render-still.mjs --p 0,0.5,1 [--orient portrait] [--size 1200x1500]
 *   node scripts/render-still.mjs --p 0.7 --orient portrait --size 1600x2000 --export viaduct-dawn
 *
 * Output: qa-output/stills/<orient>-<p>.png, or with --export
 *         public/images/renders/<name>-960|1600.avif|webp (used by <RenderImage>).
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const url = opt('url', 'http://127.0.0.1:5173/');
const orient = opt('orient', 'landscape');
const stops = opt('p', '1').split(',').map(Number);
const exportName = opt('export', null);
const [w, h] = opt('size', orient === 'portrait' ? '720x1480' : '1600x900').split('x').map(Number);
const dir = path.resolve('qa-output', 'stills');
const renders = path.resolve('public', 'images', 'renders');
await mkdir(dir, { recursive: true });
if (exportName) await mkdir(renders, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', (err) => console.error(err.message));
page.on('console', (msg) => msg.type() === 'error' && console.error(msg.text().slice(0, 300)));
await page.goto(`${url}?render=1&orient=${orient}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__hero, null, { timeout: 60000 });
await page.evaluate(() => window.__hero.ready);
for (const p of stops) {
  await page.evaluate((progress) => window.__hero.render(progress), p);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ type: 'png' });
  if (exportName) {
    for (const width of [960, 1600]) {
      const base = path.join(renders, `${exportName}-${width}`);
      await sharp(png).resize({ width }).avif({ quality: 62, effort: 5 }).toFile(`${base}.avif`);
      await sharp(png).resize({ width }).webp({ quality: 82 }).toFile(`${base}.webp`);
      console.log(`${base}.avif|webp`);
    }
  } else {
    const file = path.join(dir, `${orient}-${String(Math.round(p * 1000)).padStart(4, '0')}.png`);
    await sharp(png).toFile(file);
    console.log(file);
  }
}
await browser.close();
