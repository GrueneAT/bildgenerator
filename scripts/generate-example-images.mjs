// Drive the built app like a real user and export a gallery of fully-composed
// example sharepics. Each example walks the wizard end to end: pick a format
// and a real Grüne logo, upload an AI-generated photo background (the
// "Symbolfoto — KI-generiert" watermarked JPGs under
// resources/images/examples/backgrounds/), add a headline in the standard or
// accent serif font, and — where the occasion calls for it — drop a round
// Störer and/or a QR code on top. The exported canvas PNGs feed both the
// in-app "Beispiele ansehen" modal and the standalone schriften.html page.
//
//   node scripts/build.js
//   (cd build && python3 -m http.server 8000) &
//   node scripts/generate-example-images.mjs
//
// The six examples span Story, Feed-Post 4:5 and Event-Header formats and
// exercise every element the app offers: logo, background image, text in both
// fonts (Gelb / Weiß), a shape/Störer and a QR code. The AI backgrounds are
// generated separately with the codex image tool — see
// scripts/example-backgrounds/manifest.yml.
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'resources/images/examples';
const BG_DIR = 'resources/images/examples/backgrounds';
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

// Each example composes the real app's elements on top of an AI photo:
//   file        output PNG under resources/images/examples/
//   template    a TemplateConstants.TEMPLATES id (format)
//   logo        a #logo-selection option value (real Grüne logo + org text)
//   background  a JPG filename under resources/images/examples/backgrounds/
//   fontOption  'standard' | 'accent' (descriptive picker, no brand names)
//   color       hex matching a #text-color <option> value (Gelb / Weiß)
//   text        headline / quote text (\n = line break)
//   stoerer     true -> add the round pink Störer
//   qr          { text } -> add a QR code, else omitted
const EXAMPLES = [
  {
    file: 'radboerse-feed.png',
    template: 'feed_post_45',
    logo: 'WIEN',
    background: 'radboerse-feed-bg.jpg',
    fontOption: 'standard',
    color: YELLOW,
    text: 'RADBÖRSE\nAM HAUPTPLATZ',
    stoerer: true,
    occasion: 'Radbörse',
    caption: 'Feed-Post · Radbörse · Standardschrift',
    alt: 'Beispiel-Sharepic Feed-Post Radbörse am Hauptplatz mit Logo, Foto-Hintergrund, Schlagzeile in der Standardschrift und rundem Störer',
  },
  {
    file: 'openair-kino-story.png',
    template: 'story',
    logo: 'STEIERMARK',
    background: 'openair-kino-story-bg.jpg',
    fontOption: 'standard',
    color: WHITE,
    text: 'OPEN-AIR\nKINO',
    qr: { text: 'https://gruene.at/programm' },
    occasion: 'Open-Air-Kino',
    caption: 'Story · Open-Air-Kino · Standardschrift',
    alt: 'Beispiel-Sharepic Story Open-Air-Kino mit Logo, Foto-Hintergrund, Schlagzeile in der Standardschrift und QR-Code',
  },
  {
    file: 'klima-stammtisch-feed.png',
    template: 'feed_post_45',
    logo: 'TIROL',
    background: 'klima-stammtisch-feed-bg.jpg',
    fontOption: 'accent',
    color: YELLOW,
    text: 'Klima-\nStammtisch',
    occasion: 'Klima-Stammtisch',
    caption: 'Feed-Post · Klima-Stammtisch · Serifenschrift',
    alt: 'Beispiel-Sharepic Feed-Post Klima-Stammtisch mit Logo, Foto-Hintergrund und Schlagzeile mit betonter Serifenschrift als Akzent',
  },
  {
    file: 'klima-demo-event.png',
    template: 'event',
    logo: 'SALZBURG',
    background: 'klima-demo-event-bg.jpg',
    fontOption: 'standard',
    color: WHITE,
    text: 'KLIMA-DEMO',
    stoerer: true,
    qr: { text: 'https://gruene.at/demo' },
    occasion: 'Klima-Demo',
    caption: 'Event · Klima-Demo · Standardschrift',
    alt: 'Beispiel-Sharepic Event-Header Klima-Demo mit Logo, Foto-Hintergrund, Schlagzeile in der Standardschrift, QR-Code und rundem Störer',
  },
  {
    file: 'zitat-kandidatin-feed.png',
    template: 'feed_post_45',
    logo: 'VORARLBERG',
    background: 'kandidatin-portrait-feed-bg.jpg',
    fontOption: 'accent',
    color: WHITE,
    text: '„Veränderung\nbeginnt hier."',
    occasion: 'Zitat',
    caption: 'Feed-Post · Zitat · Serifenschrift',
    alt: 'Beispiel-Sharepic Feed-Post Zitat einer Kandidatin mit Logo, Porträt-Hintergrund und Zitat in der betonten Serifenschrift',
  },
  {
    file: 'infostand-natur-story.png',
    template: 'story',
    logo: 'KÄRNTEN',
    background: 'infostand-natur-story-bg.jpg',
    fontOption: 'accent',
    color: YELLOW,
    text: 'Infostand\nim Grünen',
    occasion: 'Infostand',
    caption: 'Story · Infostand · Serifenschrift',
    alt: 'Beispiel-Sharepic Story Infostand im Grünen mit Logo, Foto-Hintergrund und Schlagzeile mit betonter Serifenschrift als Akzent',
  },
];

async function selectLogo(page, logo) {
  // The native #logo-selection is wrapped by the searchable-select component,
  // which hides the raw <select>. Drive the component's own selectOption() —
  // the exact code path a user's click on a result row triggers — so the
  // logo renders on the canvas. The dropdown is populated asynchronously from
  // the logo index, so wait for the option to exist first.
  await page.waitForFunction(
    (value) => {
      const sel = document.getElementById('logo-selection');
      return sel && Array.from(sel.options).some((o) => o.value === value);
    },
    logo,
    { timeout: 15000 }
  );
  const picked = await page.evaluate((value) => {
    const $sel = window.jQuery('#logo-selection');
    const comp = $sel.data('searchable-select');
    if (!comp) return false;
    comp.selectOption(value);
    return $sel.val() === value;
  }, logo);
  if (!picked) throw new Error('could not select logo: ' + logo);
  await page.waitForTimeout(1500);
}

async function composeExample(page, ex) {
  await page.goto(BASE_URL + '/');
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Step 1: format + real Grüne logo (kept enabled).
  await page.selectOption('#canvas-template', ex.template);
  await page.waitForTimeout(2000);
  await selectLogo(page, ex.logo);
  await page.waitForSelector('#step-1-next:visible', { timeout: 10000 });
  await page.click('#step-1-next');
  await page.waitForTimeout(1000);

  // Step 2: upload the AI photo background via the file input.
  const bgPath = path.resolve(BG_DIR, ex.background);
  if (!fs.existsSync(bgPath)) {
    throw new Error('missing background: ' + bgPath);
  }
  await page.setInputFiles('#meme-input', bgPath);
  await page.waitForTimeout(2500);
  await page.click('#step-2-next');
  await page.waitForTimeout(1000);

  // Step 3: text — open the section, pick font + colour, add the headline.
  await page.click('button[onclick="toggleSection(\'text-section\')"]');
  await page.waitForTimeout(500);
  await page.selectOption('#font-style-select', ex.fontOption);
  await page.selectOption('#text-color', ex.color);
  await page.fill('#text', ex.text);
  await page.click('#add-text');
  await page.waitForTimeout(2000);

  // Elements: round Störer and/or QR code where the example calls for them.
  if (ex.stoerer || ex.qr) {
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
  }
  if (ex.stoerer) {
    await page.click('#add-pink-circle');
    await page.waitForTimeout(1500);
  }
  if (ex.qr) {
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    await page.fill('#qr-text', ex.qr.text);
    await page.click('#add-qr-code');
    await page.waitForTimeout(2000);
  }

  // Step 4: export the canvas and downscale to a thumbnail.
  await page.click('#step-3-next');
  await page.waitForTimeout(800);
  await page.waitForSelector('#generate-meme:visible', { timeout: 10000 });
  const downloadPromise = page.waitForEvent('download');
  await page.click('#generate-meme');
  const download = await downloadPromise;
  const outPath = path.join(OUT_DIR, ex.file);
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
  page.on('dialog', (d) => d.accept());
  for (const example of EXAMPLES) {
    await composeExample(page, example);
  }
  await browser.close();
})();
