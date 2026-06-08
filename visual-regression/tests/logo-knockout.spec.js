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

async function selectRegionLogo(page, preferred) {
  return page.evaluate((pref) => {
    const $select = jQuery('#logo-selection');
    const searchableSelect = $select.data('searchable-select');
    if (!searchableSelect) return { success: false, error: 'SearchableSelect not initialized' };
    const options = Array.from($select[0].options).map((o) => o.value).filter((v) => v);
    let target = options.find((o) => o.toUpperCase() === pref);
    if (!target) target = options.find((o) => o.length > 0 && o.length <= 16 && !o.includes('%'));
    if (!target) return { success: false, error: 'No suitable option' };
    searchableSelect.selectOption(target);
    return { success: true, value: target };
  }, preferred);
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
  // The logo sits centred near the bottom; the bar is roughly the lower third.
  const y0 = Math.floor(height * 0.60);
  const y1 = Math.floor(height * 0.95);
  const x0 = Math.floor(width * 0.20);
  const x1 = Math.floor(width * 0.80);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      if (r > 235 && g > 235 && b > 235) white++;
      else if (r > 150 && g < 110 && b > 60 && b < 160) magenta++; // #E6007E-ish
      else if (g > 90 && r < 110 && b < 110) green++;              // green canvas / old fill
    }
  }
  return { white, magenta, green };
}

test.describe('Visual Regression - Logo region-name knockout (#40)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => console.log('Page error:', error.message));
    await setupTestEnvironment(page);
  });

  test('Region name shows the background PHOTO through the letters (core acceptance)', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');

    // Re-enable the logo (setupBasicTemplate disables it) and pick a short region.
    await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      if (toggle && !toggle.checked) toggle.click();
    });
    await page.waitForTimeout(500);

    // Go back to step 1 to select the logo, then forward to upload a background.
    // setupBasicTemplate left us on step 2; ensure the logo selection is applied.
    const sel = await selectRegionLogo(page, 'WIEN');
    expect(sel.success).toBe(true);
    await page.waitForTimeout(2000);

    // Upload a vivid magenta "photo" as the background, exactly like a user upload.
    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 4, height: 4 });
    }, magentaDataUrl());
    await page.waitForTimeout(2000);

    // Sanity: a logo group and a background image must both exist.
    const state = await page.evaluate(() => ({
      hasLogo: typeof logo !== 'undefined' && logo !== null,
      hasText: typeof logoName !== 'undefined' && logoName !== null,
      compositeOp: (typeof logoName !== 'undefined' && logoName) ? logoName.globalCompositeOperation : null,
      hasBackground: typeof contentImage !== 'undefined' && contentImage !== null,
    }));
    expect(state.hasLogo).toBe(true);
    expect(state.hasText).toBe(true);
    expect(state.hasBackground).toBe(true);
    // The text must be a destination-out knockout, never a solid fill.
    expect(state.compositeOp).toBe('destination-out');

    const png = await exportPng(page, 'photo');
    const bar = classifyBarBand(png);
    console.log('Knockout-over-photo bar band classification:', bar);

    // The white bar must survive (not be fully erased)…
    expect(bar.white).toBeGreaterThan(200);
    // …and the magenta background MUST show through the letter holes. If the region
    // name were still painted (green or any solid fill), there would be no magenta
    // inside the bar band.
    expect(bar.magenta).toBeGreaterThan(50);
  });

  test('Region name over the green canvas keeps the logo looking unchanged', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');
    await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      if (toggle && !toggle.checked) toggle.click();
    });
    await page.waitForTimeout(500);

    const sel = await selectRegionLogo(page, 'WIEN');
    expect(sel.success).toBe(true);
    await page.waitForTimeout(2000);

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
  });

  test('Long (two-line) region name knockout over a photo', async ({ page }) => {
    await setupBasicTemplate(page, 'feed_post_45');
    await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      if (toggle && !toggle.checked) toggle.click();
    });
    await page.waitForTimeout(500);

    // Pick a two-line (percent-broken) region to exercise the long-bar path.
    const sel = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) return { success: false };
      const options = Array.from($select[0].options).map((o) => o.value).filter((v) => v);
      let target = options.find((o) => o.includes('BEZIRK') && o.includes('%'));
      if (!target) target = options.find((o) => o.includes('%'));
      if (!target) return { success: false };
      searchableSelect.selectOption(target);
      return { success: true, value: target };
    });
    expect(sel.success).toBe(true);
    await page.waitForTimeout(2000);

    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 4, height: 4 });
    }, magentaDataUrl());
    await page.waitForTimeout(2000);

    const twoLine = await page.evaluate(() => ({
      hasLineBreak: typeof logoName !== 'undefined' && logoName ? logoName.text.includes('\n') : false,
      compositeOp: typeof logoName !== 'undefined' && logoName ? logoName.globalCompositeOperation : null,
    }));
    expect(twoLine.hasLineBreak).toBe(true);
    expect(twoLine.compositeOp).toBe('destination-out');

    const png = await exportPng(page, 'photo-twoline');
    const bar = classifyBarBand(png);
    console.log('Two-line knockout-over-photo bar band classification:', bar);
    expect(bar.white).toBeGreaterThan(200);
    expect(bar.magenta).toBeGreaterThan(50);
  });
});
