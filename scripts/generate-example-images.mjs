// Drive the built app like a user and export a small gallery of example canvas
// PNGs that demonstrate the two text fonts in real materials. The images feed
// both the in-app "Beispiele ansehen" modal and the standalone schriften.html
// fallback page.
//
//   node scripts/build.js
//   (cd build && python3 -m http.server 8000) &
//   node scripts/generate-example-images.mjs
//
// Each entry below maps to one PNG under resources/images/examples/. The set
// spans several formats (Story, Feed-Post 4:5, Event-Header) and Grüne themes
// (Klima, Soziales, Verkehr) plus event types (Demo, Stammtisch, Infostand,
// Vortrag). Most use the standard font; two use the accent serif for a quote /
// emphasis. Colours alternate Gelb / Weiß so the gallery reads like real work.
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'resources/images/examples';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

// The app exports full-resolution canvases (up to ~5000px). For a gallery of
// thumbnails that's needlessly heavy, so each export is downscaled to at most
// THUMB_MAX px on its long edge before it lands on disk. Keeps the committed
// PNGs small (tens of KB each) while staying crisp in the modal grid.
const THUMB_MAX = 900;

function downscalePng(file) {
  const src = PNG.sync.read(fs.readFileSync(file));
  const scale = Math.min(1, THUMB_MAX / Math.max(src.width, src.height));
  if (scale >= 1) return;
  const dw = Math.round(src.width * scale);
  const dh = Math.round(src.height * scale);
  const dst = new PNG({ width: dw, height: dh });
  // Box-average downscale: each destination pixel averages the source block it
  // covers. Good enough for thumbnails and dependency-free.
  for (let y = 0; y < dh; y++) {
    const sy0 = Math.floor((y * src.height) / dh);
    const sy1 = Math.max(sy0 + 1, Math.floor(((y + 1) * src.height) / dh));
    for (let x = 0; x < dw; x++) {
      const sx0 = Math.floor((x * src.width) / dw);
      const sx1 = Math.max(sx0 + 1, Math.floor(((x + 1) * src.width) / dw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const si = (src.width * sy + sx) << 2;
          r += src.data[si];
          g += src.data[si + 1];
          b += src.data[si + 2];
          a += src.data[si + 3];
          n++;
        }
      }
      const di = (dw * y + x) << 2;
      dst.data[di] = Math.round(r / n);
      dst.data[di + 1] = Math.round(g / n);
      dst.data[di + 2] = Math.round(b / n);
      dst.data[di + 3] = Math.round(a / n);
    }
  }
  fs.writeFileSync(file, PNG.sync.write(dst));
}

const YELLOW = '#FFED00';
const WHITE = '#FFFFFF';

// fontOption: 'standard' | 'accent'
// color: hex matching one of the #text-color <option> values
// template: a TemplateConstants.TEMPLATES id
const EXAMPLES = [
  // --- Standard font, themes ---
  {
    file: 'klima-story.png',
    template: 'story',
    fontOption: 'standard',
    color: YELLOW,
    text: 'KLIMASCHUTZ\nJETZT',
  },
  {
    file: 'soziales-feed.png',
    template: 'feed_post_45',
    fontOption: 'standard',
    color: WHITE,
    text: 'LEISTBARES\nWOHNEN',
  },
  {
    file: 'verkehr-feed.png',
    template: 'feed_post_45',
    fontOption: 'standard',
    color: YELLOW,
    text: 'SICHER\nMIT DEM RAD',
  },
  // --- Standard font, event types ---
  {
    file: 'demo-event.png',
    template: 'event',
    fontOption: 'standard',
    color: WHITE,
    text: 'KLIMA-DEMO\nAM HAUPTPLATZ',
  },
  {
    file: 'stammtisch-story.png',
    template: 'story',
    fontOption: 'standard',
    color: YELLOW,
    text: 'GRÜNER\nSTAMMTISCH',
  },
  {
    file: 'infostand-feed.png',
    template: 'feed_post_45',
    fontOption: 'standard',
    color: WHITE,
    text: 'INFOSTAND\nAM MARKT',
  },
  {
    file: 'vortrag-event.png',
    template: 'event',
    fontOption: 'standard',
    color: YELLOW,
    text: 'VORTRAG &\nDISKUSSION',
  },
  // --- Accent serif, quote / emphasis ---
  {
    file: 'zitat-accent-feed.png',
    template: 'feed_post_45',
    fontOption: 'accent',
    color: WHITE,
    text: 'Veränderung\nbeginnt hier',
  },
  {
    file: 'akzent-accent-story.png',
    template: 'story',
    fontOption: 'accent',
    color: YELLOW,
    text: 'Gemeinsam\nfür morgen',
  },
];

async function addTextAndDownload(page, { template, fontOption, color, text, file }) {
  // Reload to a clean canvas for each export.
  await page.goto(BASE_URL + '/');
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Step 1: pick template, disable logo, advance.
  await page.selectOption('#canvas-template', template);
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

  // Open text section, choose font + colour, add text.
  await page.click('button[onclick="toggleSection(\'text-section\')"]');
  await page.waitForTimeout(500);
  await page.selectOption('#font-style-select', fontOption);
  await page.selectOption('#text-color', color);
  await page.fill('#text', text);
  await page.click('#add-text');
  await page.waitForTimeout(2500);

  // Navigate to download step and export.
  await page.click('#step-3-next');
  await page.waitForTimeout(800);
  await page.waitForSelector('#generate-meme:visible', { timeout: 10000 });
  const downloadPromise = page.waitForEvent('download');
  await page.click('#generate-meme');
  const download = await downloadPromise;
  const outPath = path.join(OUT_DIR, file);
  await download.saveAs(outPath);
  downscalePng(outPath);
  console.log('saved', outPath);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    args: ['--force-device-scale-factor=1', '--disable-gpu', '--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('dialog', d => d.accept());
  for (const example of EXAMPLES) {
    await addTextAndDownload(page, example);
  }
  await browser.close();
})();
