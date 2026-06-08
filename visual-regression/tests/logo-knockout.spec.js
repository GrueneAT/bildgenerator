import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference, COMPARISON_DIR } from './test-utils.js';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

/**
 * Logo region-name KNOCKOUT visual regression.
 *
 * Issue #40: the logo's region name (e.g. "WIEN") used to render as solid GREEN
 * text painted onto the white bar. Over an uploaded background photo this looked
 * wrong — green letters instead of the photo showing through. The fix composes the
 * white logo image and the region text (in `destination-out`) into a single cached
 * fabric.Group, so the letters are punched out of the bar and whatever is BEHIND the
 * logo (green canvas or photo) shows through them.
 *
 * The core acceptance check below is functional, not just a reference diff: it
 * exports the canvas to PNG (the real download path) and inspects the pixels inside
 * the logo bar to prove the background shows through the letter holes while the bar
 * itself stays white.
 */

// A vivid, easily-detectable "photo": a 4x4 PNG of pure magenta (#E6007E).
// Magenta is neither white (the bar) nor green (the canvas / old fill), so any
// magenta found inside the bar can only be the background showing through a hole.
// 4x4 magenta, generated with pngjs at build-spec authoring time.
function magentaDataUrl() {
  const png = new PNG({ width: 4, height: 4 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0xe6;     // R
    png.data[i + 1] = 0x00; // G
    png.data[i + 2] = 0x7e; // B
    png.data[i + 3] = 0xff; // A
  }
  const buf = PNG.sync.write(png);
  return 'data:image/png;base64,' + buf.toString('base64');
}

// Enable the logo and select a region the way the app reacts to a real user
// change: the #logo-selection 'change' handler (event-handlers.js) calls
// addLogo() only while the logo feature is enabled, and addLogo() loads the
// logo image ASYNCHRONOUSLY. So we (1) ensure the toggle is on, (2) set the
// value and dispatch a native bubbling 'change' (which the jQuery delegated
// handler catches), then the caller polls waitForLogo() until the async
// fabric.Image has actually landed.
async function selectRegionLogo(page, mode) {
  return page.evaluate((m) => {
    const toggle = document.getElementById('logo-toggle');
    if (toggle && !toggle.checked) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const select = document.getElementById('logo-selection');
    if (!select) return { success: false, error: 'logo-selection missing' };
    const options = Array.from(select.options).map((o) => o.value).filter((v) => v);
    let target;
    if (m === 'twoline') {
      target = options.find((o) => o.includes('BEZIRK') && o.includes('%'))
            || options.find((o) => o.includes('%'));
    } else {
      target = options.find((o) => o.toUpperCase() === 'WIEN')
            || options.find((o) => o.length > 0 && o.length <= 16 && !o.includes('%'));
    }
    if (!target) return { success: false, error: 'no suitable option' };
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true, value: target };
  }, mode);
}

// Poll until addLogo()'s async logo image has landed on the canvas. The
// production bundle does NOT expose `logo`/`logoName` as globals, but
// `window.canvas` is exposed. The region-name knockout is BAKED into a single
// flattened logo image (real transparent letter-holes) — there is no live
// destination-out object — so detect the logo as the non-selectable image
// (the uploaded background image is selectable; the logo is not).
function logoProbe() {
  const objs = (window.canvas && window.canvas.getObjects()) || [];
  const img = objs.find((o) => o.type === 'image' && o.selectable === false);
  return img ? { hasLogo: true } : null;
}

async function waitForLogo(page) {
  await page.waitForFunction(
    `(${logoProbe.toString()})() !== null`,
    null,
    { timeout: 15000 }
  );
}

// Export the current canvas via the real download button and return the decoded PNG.
async function exportPng(page, label) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));
  });

  const isStep4Visible = await page.isVisible('#step-4:not(.hidden)');
  if (!isStep4Visible) {
    // Walk forward to the download step the same way a user would.
    for (let step = 1; step <= 3; step++) {
      const next = `#step-${step}-next`;
      if (await page.isVisible(next)) {
        await page.click(next);
        await page.waitForTimeout(500);
      }
    }
  }

  page.on('dialog', (dialog) => dialog.accept());
  const downloadPromise = page.waitForEvent('download');
  await page.click('#generate-meme');
  const download = await downloadPromise;
  const out = path.join(COMPARISON_DIR, `knockout-${label}.png`);
  await download.saveAs(out);
  return PNG.sync.read(fs.readFileSync(out));
}

// Scan the lower-centre band of the export (where the logo bar sits) and classify
// pixels. Returns counts of white-bar pixels and magenta show-through pixels.
function classifyBarBand(png) {
  const { width, height, data } = png;
  let white = 0;
  let magenta = 0;
  let green = 0;
  let black = 0;
  // The logo sits centred near the bottom; the bar is roughly the lower third.
  const y0 = Math.floor(height * 0.60);
  const y1 = Math.floor(height * 0.97);
  const x0 = Math.floor(width * 0.18);
  const x1 = Math.floor(width * 0.82);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      if (r > 235 && g > 235 && b > 235) white++;
      else if (r < 45 && g < 45 && b < 45) black++;               // the regression: a black hole
      else if (r > 150 && g < 110 && b > 60 && b < 160) magenta++; // #E6007E-ish
      else if (g > 90 && r < 110 && b < 110) green++;              // green canvas show-through
    }
  }
  return { white, magenta, green, black };
}

test.describe('Visual Regression - Logo region-name knockout (#40)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => console.log('Page error:', error.message));
    await setupTestEnvironment(page);
  });

  test('Region name shows the background PHOTO through the letters (core acceptance)', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');

    // Enable the logo + select a short region; wait for the async logo image.
    const sel = await selectRegionLogo(page, 'short');
    expect(sel.success).toBe(true);
    await waitForLogo(page);

    // Upload a vivid magenta "photo" as the background, exactly like a user upload.
    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 4, height: 4 });
    }, magentaDataUrl());
    await page.waitForTimeout(2000);

    // Export via the real download path (high-DPI multiplier) — this is exactly
    // where the old live destination-out leaked the knockout to solid BLACK.
    const png = await exportPng(page, 'photo');
    const bar = classifyBarBand(png);
    console.log('Knockout-over-photo bar band classification:', bar);

    // The white bar must survive (not be fully erased)…
    expect(bar.white).toBeGreaterThan(200);
    // …and the magenta background MUST show through the letter holes. If the region
    // name were still painted (green or any solid fill), there would be no magenta.
    expect(bar.magenta).toBeGreaterThan(50);
    // …and there must be NO black hole in the logo (the regression this fixes).
    expect(bar.black).toBeLessThan(50);
  });

  test('Region name over the green canvas keeps the logo looking unchanged', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');

    const sel = await selectRegionLogo(page, 'short');
    expect(sel.success).toBe(true);
    await waitForLogo(page);

    // No background uploaded: the canvas is the solid green brand colour, so the
    // knockout letters reveal that green — visually the same as before the fix.
    const png = await exportPng(page, 'green');
    const bar = classifyBarBand(png);
    console.log('Knockout-over-green bar band classification:', bar);

    // The white bar stays white and the letters reveal the green canvas.
    expect(bar.white).toBeGreaterThan(200);
    expect(bar.green).toBeGreaterThan(50);
    // No magenta anywhere — there is no photo here.
    expect(bar.magenta).toBe(0);
    // And no black hole.
    expect(bar.black).toBeLessThan(50);
  });

  test('Long (two-line) region name knockout over a photo', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');

    // Enable the logo + pick a two-line (percent-broken) region; wait for it.
    const sel = await selectRegionLogo(page, 'twoline');
    expect(sel.success).toBe(true);
    await waitForLogo(page);

    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 4, height: 4 });
    }, magentaDataUrl());
    await page.waitForTimeout(2000);

    const png = await exportPng(page, 'photo-twoline');
    const bar = classifyBarBand(png);
    console.log('Two-line knockout-over-photo bar band classification:', bar);
    expect(bar.white).toBeGreaterThan(200);
    expect(bar.magenta).toBeGreaterThan(50);
    expect(bar.black).toBeLessThan(50);
  });
});
