// One-off helper: drive the built app like a user and export two example
// canvas PNGs (standard font headline, accent serif quote) for schriften.html.
// Run against the build served on http://localhost:8000 (npm run serve:build).
//
//   node scripts/build.js
//   (cd build && python3 -m http.server 8000) &
//   node scripts/generate-example-images.mjs
//
// Outputs resources/images/examples/{standard-headline,accent-quote}.png
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'resources/images/examples';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

async function addTextAndDownload(page, { fontOption, text, file }) {
  // Reload to a clean canvas for each export.
  await page.goto(BASE_URL + '/');
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Step 1: pick template, disable logo, advance.
  await page.selectOption('#canvas-template', 'feed_post_45');
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    const t = document.getElementById('logo-toggle');
    if (t && t.checked) t.click();
  });
  await page.waitForSelector('#step-1-next:visible', { timeout: 10000 });
  await page.click('#step-1-next');
  await page.waitForTimeout(1000);

  // Step 2 -> 3.
  await page.click('#step-2-next');
  await page.waitForTimeout(1000);

  // Open text section, choose font, add text.
  await page.click('button[onclick="toggleSection(\'text-section\')"]');
  await page.waitForTimeout(500);
  await page.selectOption('#font-style-select', fontOption);
  await page.fill('#text', text);
  await page.click('#add-text');
  await page.waitForTimeout(2500);

  // Navigate to download step and export.
  for (const step of [3]) {
    await page.click(`#step-${step}-next`);
    await page.waitForTimeout(800);
  }
  await page.waitForSelector('#generate-meme:visible', { timeout: 10000 });
  const downloadPromise = page.waitForEvent('download');
  await page.click('#generate-meme');
  const download = await downloadPromise;
  await download.saveAs(path.join(OUT_DIR, file));
  console.log('saved', path.join(OUT_DIR, file));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    args: ['--force-device-scale-factor=1', '--disable-gpu', '--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('dialog', d => d.accept());
  await addTextAndDownload(page, {
    fontOption: 'standard',
    text: 'GEMEINSAM\nFÜR MORGEN',
    file: 'standard-headline.png',
  });
  await addTextAndDownload(page, {
    fontOption: 'accent',
    text: 'Veränderung\nbeginnt hier',
    file: 'accent-quote.png',
  });
  await browser.close();
})();
