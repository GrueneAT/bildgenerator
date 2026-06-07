import { test, expect } from '@playwright/test';

// Drives the font-examples feature exactly like a desktop user: walk the
// wizard to the text step, confirm the font picker is full width, then open
// and close the in-app examples modal — all without leaving the page.
test.describe('Font examples modal & picker width', () => {
  async function gotoTextStep(page) {
    await page.goto('/');
    await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.selectOption('#canvas-template', 'feed_post_45');
    await page.waitForTimeout(1500);
    // Disable the logo so the wizard can advance without a logo selection.
    await page.evaluate(() => {
      const t = document.getElementById('logo-toggle');
      if (t && t.checked) t.click();
    });
    await page.waitForSelector('#step-1-next:visible', { timeout: 10000 });
    await page.click('#step-1-next');
    await page.waitForTimeout(800);
    await page.click('#step-2-next');
    await page.waitForTimeout(800);

    // Open the text section so the picker and hint button are visible.
    await page.click("button[onclick=\"toggleSection('text-section')\"]");
    await page.waitForTimeout(500);
  }

  test('font picker is full width on desktop (wider than the half-width controls)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTextStep(page);

    const widths = await page.evaluate(() => {
      const picker = document.getElementById('font-style-select');
      const color = document.getElementById('text-color');
      const lineHeight = document.getElementById('line-height');
      const round = (el) => Math.round(el.getBoundingClientRect().width);
      return { picker: round(picker), color: round(color), lineHeight: round(lineHeight) };
    });

    // The picker should be clearly wider than the half-width controls it used
    // to share a grid cell with — i.e. it spans (close to) the full content
    // width, roughly the sum of the two columns plus the gap.
    expect(widths.picker).toBeGreaterThan(widths.color * 1.5);
    expect(widths.picker).toBeGreaterThan(widths.lineHeight * 1.5);
  });

  test('hint button opens the in-app modal without leaving the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTextStep(page);

    const urlBefore = page.url();
    const modal = page.locator('#fontExamplesModal');

    await expect(modal).toBeHidden();
    await page.click('#font-examples-btn');
    await page.waitForTimeout(300);

    // The native <dialog> is open and the URL has not changed (no navigation).
    await expect(modal).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('fontExamplesModal').open)).toBe(true);
    expect(page.url()).toBe(urlBefore);

    // The gallery shows the six fully-composed example sharepics.
    const imgCount = await page.locator('#font-examples-gallery img').count();
    expect(imgCount).toBe(6);
  });

  test('modal closes via the close button and via Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTextStep(page);

    // Open + close via the close button.
    await page.click('#font-examples-btn');
    await page.waitForTimeout(300);
    await expect(page.locator('#fontExamplesModal')).toBeVisible();
    await page.click('#close-font-examples');
    await page.waitForTimeout(300);
    await expect(page.locator('#fontExamplesModal')).toBeHidden();

    // Open + close via Escape (native <dialog> behaviour).
    await page.click('#font-examples-btn');
    await page.waitForTimeout(300);
    await expect(page.locator('#fontExamplesModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('#fontExamplesModal')).toBeHidden();
  });
});
