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

// Each example composes the real app's elements on top of an AI photo into a
// COMPLETE, finished sharepic — the kind a Grüne group would actually post.
// Beyond the headline, every example carries the supporting copy you expect on
// such a graphic: date, time, place, names/roles, a call-to-action label.
//
//   file        output PNG under resources/images/examples/
//   template    a TemplateConstants.TEMPLATES id (format)
//   logo        a #logo-selection option value (real Grüne logo + org text)
//   background  a JPG filename under resources/images/examples/backgrounds/
//   blocks      ordered list of text blocks to compose (see placeText):
//                 text       the copy (\n = manual line break)
//                 fontOption 'standard' | 'accent'
//                 color      hex matching a #text-color <option> (Gelb / Weiß)
//                 widthRatio target text width as a fraction of the content rect
//                 band       vertical center as a fraction of the content rect
//                 align      'left' | 'center' | 'right' (default center)
//                 lineHeight '0.8' | '0.9' | '1.1' (default 0.9)
//   stoerer     { date, corner } -> round pink Störer with the date as a text
//               badge centered over it (the shape itself can't hold text)
//   qr          { text, label, corner } -> QR code + a small label above it
//
// Names, dates and places are realistic but clearly fictional.
const EXAMPLES = [
  {
    // Radbörse — Feed-Post. Headline + date/time/place line + a corner Störer
    // that CARRIES the date (badge text over the circle), top-right, clear of
    // the headline.
    file: 'radboerse-feed.png',
    template: 'feed_post_45',
    logo: 'WIEN',
    background: 'radboerse-feed-bg.jpg',
    blocks: [
      { text: 'RADBÖRSE\nAM HAUPTPLATZ', fontOption: 'standard', color: YELLOW, widthRatio: 0.86, band: 0.46, lineHeight: '0.8' },
      { text: 'Sa 13. Juni · 9–14 Uhr · Hauptplatz', fontOption: 'standard', color: WHITE, widthRatio: 0.82, band: 0.62 },
    ],
    stoerer: { date: '13.\nJUNI', corner: 'top-right' },
    occasion: 'Radbörse',
    caption: 'Feed-Post · Radbörse · Standardschrift',
    alt: 'Beispiel-Sharepic Feed-Post Radbörse am Hauptplatz mit Logo, Foto-Hintergrund, Schlagzeile, Datum-Zeit-Ort-Zeile und rundem Störer mit Datum oben rechts',
  },
  {
    // Open-Air-Kino — Story. Headline + screening details + a QR labelled
    // "Programm" in a bottom corner.
    file: 'openair-kino-story.png',
    template: 'story',
    logo: 'STEIERMARK',
    background: 'openair-kino-story-bg.jpg',
    blocks: [
      { text: 'OPEN-AIR\nKINO', fontOption: 'standard', color: WHITE, widthRatio: 0.84, band: 0.40, lineHeight: '0.8' },
      { text: 'Fr 20. Juni · ab 21 Uhr\nStadtpark', fontOption: 'standard', color: YELLOW, widthRatio: 0.78, band: 0.56 },
    ],
    qr: { text: 'https://gruene.at/programm', label: 'Programm', corner: 'bottom-right' },
    occasion: 'Open-Air-Kino',
    caption: 'Story · Open-Air-Kino · Standardschrift',
    alt: 'Beispiel-Sharepic Story Open-Air-Kino mit Logo, Foto-Hintergrund, Schlagzeile, Termin-Details und QR-Code mit Beschriftung Programm unten rechts',
  },
  {
    // Klima-Stammtisch — Feed-Post. Vollkorn accent word "Klima" + standard
    // "Stammtisch" + the recurring meeting details.
    file: 'klima-stammtisch-feed.png',
    template: 'feed_post_45',
    logo: 'TIROL',
    background: 'klima-stammtisch-feed-bg.jpg',
    blocks: [
      { text: 'Klima', fontOption: 'accent', color: YELLOW, widthRatio: 0.6, band: 0.36 },
      { text: 'STAMMTISCH', fontOption: 'standard', color: WHITE, widthRatio: 0.86, band: 0.50 },
      { text: 'Jeden 1. Mittwoch · 19 Uhr\nCafé Central', fontOption: 'standard', color: WHITE, widthRatio: 0.78, band: 0.66 },
    ],
    occasion: 'Klima-Stammtisch',
    caption: 'Feed-Post · Klima-Stammtisch · Serifenschrift',
    alt: 'Beispiel-Sharepic Feed-Post Klima-Stammtisch mit Logo, Foto-Hintergrund, Akzentwort in Serifenschrift, Schlagzeile und Termin-Details',
  },
  {
    // Klima-Demo — Event-Header (landscape). Headline left, demo date/place
    // clear of it, QR + Störer-with-date in the corners.
    file: 'klima-demo-event.png',
    template: 'event',
    logo: 'SALZBURG',
    background: 'klima-demo-event-bg.jpg',
    blocks: [
      { text: 'KLIMA-DEMO', fontOption: 'standard', color: YELLOW, widthRatio: 0.5, band: 0.38, align: 'left', xRatio: 0.3 },
      { text: 'Fr 27. Juni · 15 Uhr · Rathausplatz', fontOption: 'standard', color: WHITE, widthRatio: 0.46, band: 0.62, align: 'left', xRatio: 0.3 },
    ],
    stoerer: { date: '27.\nJUNI', corner: 'top-right' },
    qr: { text: 'https://gruene.at/demo', label: 'Mehr Infos', corner: 'bottom-right' },
    occasion: 'Klima-Demo',
    caption: 'Event · Klima-Demo · Standardschrift',
    alt: 'Beispiel-Sharepic Event-Header Klima-Demo mit Logo, Foto-Hintergrund, Schlagzeile, Demo-Datum und -Ort, QR-Code und rundem Störer mit Datum',
  },
  {
    // Zitat — Feed-Post. Vollkorn quote with an attribution: name + role.
    file: 'zitat-kandidatin-feed.png',
    template: 'feed_post_45',
    logo: 'VORARLBERG',
    background: 'kandidatin-portrait-feed-bg.jpg',
    blocks: [
      { text: '„Veränderung\nbeginnt hier."', fontOption: 'accent', color: WHITE, widthRatio: 0.84, band: 0.42, lineHeight: '0.9' },
      { text: 'Mag.ª Lena Berger', fontOption: 'standard', color: YELLOW, widthRatio: 0.7, band: 0.61 },
      { text: 'Spitzenkandidatin', fontOption: 'standard', color: WHITE, widthRatio: 0.46, band: 0.69 },
    ],
    occasion: 'Zitat',
    caption: 'Feed-Post · Zitat · Serifenschrift',
    alt: 'Beispiel-Sharepic Feed-Post Zitat einer Kandidatin mit Logo, Porträt-Hintergrund, Zitat in Serifenschrift und Namens-Attribution Mag.ª Lena Berger, Spitzenkandidatin',
  },
  {
    // Infostand — Story. Headline + recurring weekly market details.
    file: 'infostand-natur-story.png',
    template: 'story',
    logo: 'KÄRNTEN',
    background: 'infostand-natur-story-bg.jpg',
    blocks: [
      { text: 'INFOSTAND\nAM MARKT', fontOption: 'standard', color: YELLOW, widthRatio: 0.84, band: 0.42, lineHeight: '0.8' },
      { text: 'Jeden Samstag · 9–12 Uhr\nWochenmarkt', fontOption: 'standard', color: WHITE, widthRatio: 0.78, band: 0.58 },
    ],
    occasion: 'Infostand',
    caption: 'Story · Infostand · Standardschrift',
    alt: 'Beispiel-Sharepic Story Infostand am Markt mit Logo, Foto-Hintergrund, Schlagzeile und wöchentlichen Termin-Details',
  },
];

// Move the currently-active canvas object into a corner, the same way a user
// would drag it there. The app keeps the freshly-added Störer / QR code
// selected, exposes the Fabric canvas as window.canvas, and lets the user drag
// any element freely (Fabric's default object movement). We reproduce the
// end-state of that drag: read the object's scaled bounding box, then set its
// top-left origin so the box sits in the requested corner with a margin, and
// commit with setCoords()/renderAll() — exactly what Fabric does after a drag.
// No element is hand-drawn; we only reposition an element the app placed.
//
// `kind` tells the helper which element to grab when the app did not leave it
// pre-selected — the same element a user would click on before dragging:
//   'active'  -> whatever is currently selected (QR: stays selected on add)
//   'circle'  -> the most recently added Störer (a Fabric circle); selecting it
//                first is exactly the click-to-select a user performs.
//
//   corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
//   marginRatio: gap from the canvas edge, as a fraction of the long edge
async function positionInCorner(page, corner, kind = 'active', marginRatio = 0.05) {
  const moved = await page.evaluate(
    ({ corner, kind, marginRatio }) => {
      const canvas = window.canvas;
      if (!canvas || typeof canvas.getActiveObject !== 'function') return 'no-canvas';
      let obj = canvas.getActiveObject();
      if (kind === 'circle') {
        // Select the Störer the way a user click would: the last circle added.
        const circles = canvas.getObjects().filter((o) => o.type === 'circle');
        obj = circles[circles.length - 1];
        if (obj) canvas.setActiveObject(obj);
      }
      if (!obj) return 'no-target-object';

      const margin = Math.round(Math.max(canvas.width, canvas.height) * marginRatio);
      const w = obj.getScaledWidth();
      const h = obj.getScaledHeight();

      const left = corner.endsWith('right')
        ? canvas.width - w - margin
        : margin;
      const top = corner.startsWith('bottom')
        ? canvas.height - h - margin
        : margin;

      obj.set({ left, top });
      obj.setCoords();
      canvas.renderAll();
      return 'ok';
    },
    { corner, kind, marginRatio }
  );
  if (moved !== 'ok') {
    throw new Error('could not reposition element (' + corner + '): ' + moved);
  }
  await page.waitForTimeout(500);
}

// Place the currently-active object so its CENTER lands at a target point given
// as fractions of the content rect, the same end-state a user's drag produces.
// We read the object's scaled bounding box and set its top-left so the center
// hits (xRatio, band) inside the content rect, then commit with setCoords().
async function centerActiveAt(page, xRatio, band) {
  const ok = await page.evaluate(
    ({ xRatio, band }) => {
      const canvas = window.canvas;
      const rect = window.contentRect;
      const obj = canvas && canvas.getActiveObject ? canvas.getActiveObject() : null;
      if (!obj || !rect) return false;
      const w = obj.getScaledWidth();
      const h = obj.getScaledHeight();
      const cx = rect.left + rect.width * xRatio;
      const cy = rect.top + rect.height * band;
      obj.set({ left: cx - w / 2, top: cy - h / 2 });
      obj.setCoords();
      canvas.renderAll();
      return true;
    },
    { xRatio, band }
  );
  if (!ok) throw new Error('could not center active object');
  await page.waitForTimeout(150);
}

// Resize the currently-active object via the #scale slider — the exact control a
// user drags to size an element — so the object's scaled width matches a target
// fraction of the content rect. Returns silently if there is no active object.
async function scaleActiveToWidth(page, widthRatio) {
  await page.evaluate((widthRatio) => {
    const canvas = window.canvas;
    const rect = window.contentRect;
    const obj = canvas && canvas.getActiveObject ? canvas.getActiveObject() : null;
    if (!obj || !rect) return;
    const targetWidth = rect.width * widthRatio;
    const targetScale = targetWidth / obj.width;
    const slider = document.getElementById('scale');
    if (slider) {
      // Drive the slider's input handler the way a user drag does.
      slider.value = String(targetScale);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      obj.scale(targetScale).setCoords();
      canvas.renderAll();
    }
  }, widthRatio);
  await page.waitForTimeout(200);
}

// Add one text block through the real text controls (font, colour, alignment,
// line-height, #add-text), then size and place it. Each block is an ordinary
// "add a text element" the app supports; multiple blocks are how a user builds
// a full layout. The newly added text stays selected, so size/position act on
// it directly.
async function placeText(page, block) {
  await deselect(page);
  await page.selectOption('#font-style-select', block.fontOption);
  await page.selectOption('#text-color', block.color);
  await page.selectOption('#line-height', block.lineHeight || '0.9');
  const align = block.align || 'center';
  await setAlign(page, align);
  await page.fill('#text', block.text);
  await page.click('#add-text');
  await page.waitForTimeout(1200);
  if (block.widthRatio) await scaleActiveToWidth(page, block.widthRatio);
  await centerActiveAt(page, block.xRatio != null ? block.xRatio : 0.5, block.band != null ? block.band : 0.5);
  await page.waitForTimeout(150);
}

// After the Störer circle is dropped in a corner, lay the date over it as a
// small white text badge centered on the circle — the shape itself can't hold
// text, so the date rides on top. Adds a normal text element, then positions it
// on the circle's center (read from the circle's bounding box).
async function addStoererDateBadge(page, dateText) {
  // Add the date as a centered standard-font text block in white for contrast
  // against the pink Störer.
  await deselect(page);
  await page.selectOption('#font-style-select', 'standard');
  await page.selectOption('#text-color', '#FFFFFF');
  await page.selectOption('#line-height', '0.8');
  await setAlign(page, 'center');
  await page.fill('#text', dateText);
  await page.click('#add-text');
  await page.waitForTimeout(1000);
  // Size the badge to a fraction of the circle, then center it on the circle.
  const placed = await page.evaluate(() => {
    const canvas = window.canvas;
    const text = canvas.getActiveObject();
    const circles = canvas.getObjects().filter((o) => o.type === 'circle');
    const circle = circles[circles.length - 1];
    if (!text || !circle) return false;
    const cw = circle.getScaledWidth();
    const ch = circle.getScaledHeight();
    const cx = circle.left + cw / 2;
    const cy = circle.top + ch / 2;
    // Fit the date inside ~70% of the circle width.
    const targetScale = (cw * 0.7) / text.width;
    text.scale(targetScale);
    text.set({ left: cx - text.getScaledWidth() / 2, top: cy - text.getScaledHeight() / 2 });
    text.setCoords();
    canvas.bringToFront(text);
    canvas.renderAll();
    return true;
  });
  if (!placed) throw new Error('could not place Störer date badge');
  await page.waitForTimeout(200);
}

// Add a small label above the QR code (e.g. "Programm") so the call-to-action
// reads clearly. Placed just above the QR's bounding box, same corner.
async function addQrLabel(page, labelText) {
  await deselect(page);
  await page.selectOption('#font-style-select', 'standard');
  await page.selectOption('#text-color', '#FFFFFF');
  await page.selectOption('#line-height', '0.9');
  await setAlign(page, 'center');
  await page.fill('#text', labelText);
  await page.click('#add-text');
  await page.waitForTimeout(1000);
  const placed = await page.evaluate(() => {
    const canvas = window.canvas;
    const text = canvas.getActiveObject();
    // The QR is the most recently added image that isn't the background/logo.
    const images = canvas.getObjects().filter((o) => o.type === 'image' && o !== window.contentImage);
    const qr = images[images.length - 1];
    if (!text || !qr) return false;
    const qw = qr.getScaledWidth();
    const targetScale = (qw * 0.9) / text.width;
    text.scale(targetScale);
    const cx = qr.left + qw / 2;
    text.set({ left: cx - text.getScaledWidth() / 2, top: qr.top - text.getScaledHeight() - qw * 0.06 });
    text.setCoords();
    canvas.bringToFront(text);
    canvas.renderAll();
    return true;
  });
  if (!placed) throw new Error('could not place QR label');
  await page.waitForTimeout(200);
}

// Open a collapsible section only if it is currently closed. toggleSection is a
// plain toggle (not an accordion), so blindly clicking it can CLOSE an already
// open section. We check visibility first and click only when needed — exactly
// what a user does (they don't re-click an open section).
async function ensureSectionOpen(page, sectionId) {
  const visible = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return !!el && !el.classList.contains('hidden') && el.style.display !== 'none';
  }, sectionId);
  if (!visible) {
    await page.click(`button[onclick="toggleSection('${sectionId}')"]`);
    await page.waitForTimeout(400);
  }
}

// Deselect any active object — the same as a user clicking empty canvas. This
// matters before typing a NEW text block: the #text input live-binds to the
// active object (setValue("text", …)), so without deselecting first, typing the
// next block's copy would overwrite the previously-placed text instead of
// starting a fresh element.
async function deselect(page) {
  await page.evaluate(() => {
    const canvas = window.canvas;
    if (canvas && canvas.discardActiveObject) {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  });
  await page.waitForTimeout(100);
}

// Set text alignment the way a user does: the radio inputs are sr-only and sit
// inside styled <label> buttons, so we click the label (which checks the radio
// and fires its change handler). Default 'center' is pre-checked.
async function setAlign(page, align) {
  await page.evaluate((align) => {
    const input = document.getElementById(align);
    const label = input ? input.closest('label') : null;
    if (label) label.click();
    else if (input) input.click();
  }, align);
  await page.waitForTimeout(150);
}

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

  // Step 3: text — open the section and compose every text block in order
  // (headline, then supporting date/place/name lines), each sized and placed
  // to build a complete, finished layout. The text section stays open for the
  // rest of composition so the Störer-date and QR-label badges can reuse the
  // same text controls.
  await ensureSectionOpen(page, 'text-section');
  for (const block of ex.blocks) {
    await placeText(page, block);
  }

  // Elements: a round Störer (carrying the date as a badge) and/or a QR code
  // (with a call-to-action label) where the example calls for them.
  if (ex.stoerer || ex.qr) {
    await ensureSectionOpen(page, 'elements-section');
  }
  if (ex.stoerer) {
    await page.click('#add-pink-circle');
    await page.waitForTimeout(1500);
    // The Störer is added centered and stays selected; drag it into a corner
    // so it sits clear of the headline, then lay the date on top of it.
    await positionInCorner(page, ex.stoerer.corner || 'top-right', 'circle');
    if (ex.stoerer.date) {
      await addStoererDateBadge(page, ex.stoerer.date);
    }
  }
  if (ex.qr) {
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    await page.fill('#qr-text', ex.qr.text);
    await page.click('#add-qr-code');
    await page.waitForTimeout(2000);
    // The QR is added centered and stays selected; drag it into a corner,
    // clear of both the headline and the centre-bottom logo.
    await positionInCorner(page, ex.qr.corner || 'bottom-right', 'active');
    if (ex.qr.label) {
      await addQrLabel(page, ex.qr.label);
    }
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
