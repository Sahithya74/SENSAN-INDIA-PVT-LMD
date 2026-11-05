#!/usr/bin/env node
/**
 * Visual QA: captures the hero at each construction stage (and the page
 * below it) at desktop, tablet and mobile sizes using the locally installed
 * Chrome. Fails on console errors.
 *
 *   npm run qa -- [--url http://127.0.0.1:5173] [--only desktop,mobile]
 *                 [--tier webgl-full] [--stages 0,0.5,1|none] [--sections] [--reduced] [--no-webgl]
 *
 * Output: qa-output/<viewport>/<name>.png
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const url = opt('url', 'http://127.0.0.1:5173/');
const out = path.resolve(opt('out', 'qa-output'));
const tier = opt('tier', null);
const reduced = flag('reduced');
const noWebgl = flag('no-webgl');
const stageList = opt('stages', '0,0.05,0.13,0.2,0.3,0.38,0.5,0.58,0.68,0.8,0.86,0.92,0.96,1');
const stages = stageList === 'none' ? [] : stageList.split(',').map(Number);
/** --sections: also capture every page section (pinned ones at start, middle and end of their travel). */
const sections = flag('sections');
const SECTION_IDS = ['company', 'domains', 'process', 'leadership', 'projects', 'why-sensan', 'contact'];

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 834, height: 1194 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
};
const only = opt('only', Object.keys(VIEWPORTS).join(',')).split(',');

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: noWebgl
    ? ['--disable-3d-apis']
    : ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-unsafe-swiftshader'],
});

let failures = 0;
for (const name of only) {
  const device = VIEWPORTS[name];
  if (!device) continue;
  const dir = path.join(out, name + (tier ? `-${tier}` : '') + (reduced ? '-reduced' : '') + (noWebgl ? '-nowebgl' : ''));
  await mkdir(dir, { recursive: true });

  const context = await browser.newContext({ ...device, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));

  const target = new URL(url);
  if (tier) target.searchParams.set('tier', tier);
  await page.goto(target.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#top')?.dataset.ready === 'true', null, { timeout: 30000 }).catch(() => {
    console.warn(`[${name}] hero never reported ready`);
  });
  const info = await page.evaluate(() => ({
    visual: document.querySelector('#top')?.dataset.visual,
    gpu: (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl ? 'webgl2' : 'none';
    })(),
  }));
  console.log(`[${name}] visual=${info.visual} gpu=${info.gpu}`);

  // Let the opening line assemble.
  await page.waitForTimeout(3600);

  for (const p of stages) {
    await page.evaluate((progress) => {
      const hero = document.querySelector('#top');
      const y = hero.offsetTop + progress * (hero.offsetHeight - window.innerHeight);
      const lenis = window.__lenis;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, p);
    await page.waitForTimeout(1900);
    const file = path.join(dir, `hero-${String(Math.round(p * 100)).padStart(3, '0')}.png`);
    await page.screenshot({ path: file });
  }

  if (sections) {
    for (const id of SECTION_IDS) {
      const stops = await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId);
        if (!el) return [];
        const box = el.closest(".pin-spacer") ?? el;
        const top = box.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(0, box.offsetHeight - window.innerHeight);
        const pinned = box !== el;
        return pinned ? [top, top + travel * 0.5, top + travel] : [top, top + Math.min(travel, window.innerHeight * 0.9)];
      }, id);
      for (const [i, y] of stops.entries()) {
        await page.evaluate((top) => {
          const lenis = window.__lenis;
          if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
          else window.scrollTo(0, top);
        }, y);
        await page.waitForTimeout(2200);
        await page.screenshot({ path: path.join(dir, `section-${id}-${i}.png`) });
      }
    }
  }

  if (errors.length) {
    failures += errors.length;
    console.error(`[${name}] console errors:\n  ${errors.join('\n  ')}`);
  }
  await context.close();
}

await browser.close();
console.log(`Screenshots written to ${out}`);
process.exit(failures ? 1 : 0);
