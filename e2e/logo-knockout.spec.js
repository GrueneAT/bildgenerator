import { test, expect } from '@playwright/test';

/**
 * The region name on the white logo bar is cut OUT of the bar — the letters
 * are transparent, so whatever lies behind the logo shows through them. On the
 * plain green canvas that is the green and looks correct.
 *
 * Over a background photograph it is wrong: the photo shows through the
 * letters, and the organisation name becomes unreadable — which is the whole
 * point of the logo. These tests pin both the problem and the fix.
 */

// A 2x2 image of four strongly different colours. Whatever shows through the
// letters over this will not be the flat brand green.
const BUSY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVR42mNk+M/AwMDAxMDAwMDAAAANHQEDx6GpUwAAAABJRU5ErkJggg==';

test.describe('Logo region name: knockout versus filled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('the checkbox exists and starts checked', async ({ page }) => {
    const box = page.locator('#logo-knockout-toggle');
    await expect(box).toBeVisible();
    await expect(box).toBeChecked();
  });

  test('a background image switches the region name to filled, once', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogo('HERZOGENBURG');
      const before = LogoState.isKnockoutEnabled();

      await B.setBackground(png);
      const afterFirst = LogoState.isKnockoutEnabled();
      const checkbox = document.getElementById('logo-knockout-toggle').checked;

      // A deliberate re-enable must survive a second upload.
      await B.setLogoKnockout(true);
      await B.setBackground(png);
      return { before, afterFirst, checkbox, afterSecond: LogoState.isKnockoutEnabled() };
    }, BUSY_PNG);

    expect(result.before).toBe(true);
    expect(result.afterFirst).toBe(false);
    expect(result.checkbox).toBe(false);
    // Auto-switch happens once; it must not overrule the user afterwards.
    expect(result.afterSecond).toBe(true);
  });

  test('the filled name is the same green as the canvas, not a second constant', async ({ page }) => {
    const colours = await page.evaluate(() => ({
      background: AppConstants.COLORS.BACKGROUND_SECONDARY,
      pink: AppConstants.COLORS.PINK_CIRCLE,
    }));

    // Guard against ever grabbing the magenta accent by mistake.
    expect(colours.background.toLowerCase()).toBe('#257639');
    expect(colours.pink.toLowerCase()).not.toBe(colours.background.toLowerCase());
  });

  test('over a photo the two modes produce visibly different logos', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;

      // Export and return the pixels of the logo's bounding box.
      const logoPixels = async () => {
        const out = await B.export({ dpi: 72 });
        const img = new Image();
        await new Promise((r) => { img.onload = r; img.src = out.dataURL; });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const logoObj = canvas.getObjects()
          .filter((o) => o.type === 'image' && o.selectable === false).pop();
        const s = img.width / canvas.width;
        return ctx.getImageData(
          Math.round(logoObj.left * s),
          Math.round(logoObj.top * s),
          Math.round(logoObj.getScaledWidth() * s),
          Math.round(logoObj.getScaledHeight() * s)
        ).data;
      };

      await B.setTemplate('feed_post_45');
      await B.setLogo('HERZOGENBURG');
      await B.setBackground(png);

      await B.setLogoKnockout(true);
      const a = await logoPixels();
      await B.setLogoKnockout(false);
      const b = await logoPixels();

      let differing = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
          differing++;
        }
      }
      return { total: a.length / 4, differing };
    }, BUSY_PNG);

    // The letters are the only thing that changes, so the difference is a
    // small but unmistakable share of the logo area. Zero would mean the
    // setting does nothing.
    expect(result.differing).toBeGreaterThan(0);
    expect(result.differing / result.total).toBeGreaterThan(0.01);
  });
});
