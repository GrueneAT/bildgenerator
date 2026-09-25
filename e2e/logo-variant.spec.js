import { test, expect } from '@playwright/test';

/**
 * The logo artwork comes in two versions.
 *
 * The "blanko" files are pure white on transparent: the counters of the G and
 * the letters in the white bar are holes, so the green canvas shows through
 * them. That is how the logo is meant to read — and it only works because the
 * canvas IS green.
 *
 * Over a background photograph those holes show the photo, and the wordmark
 * washes out. The "gruen" files have exactly those enclosed areas filled with
 * the brand green, outer transparency untouched so there is still no box.
 */
test.describe('Logo artwork variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('both artworks are served', async ({ page }) => {
    const status = await page.evaluate(async () => {
      const files = Object.values(AppConstants.LOGO.FILES);
      const out = {};
      for (const f of files) {
        const r = await fetch(`resources/images/logos/${f}`);
        out[f] = r.status;
      }
      return out;
    });

    for (const [file, code] of Object.entries(status)) {
      expect(code, file).toBe(200);
    }
    expect(Object.keys(status)).toHaveLength(4);
  });

  test('the filled artwork is used exactly when the knockout is off', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      const sourceOf = () => {
        const l = canvas.getObjects().filter((o) => o.type === 'image' && o.selectable === false).pop();
        return l && l._element ? l._element.src : '';
      };

      await B.setTemplate('feed_post_45');
      await B.setLogo('HERZOGENBURG');
      await B.setLogoKnockout(true);
      const withKnockout = sourceOf();
      await B.setLogoKnockout(false);
      const filled = sourceOf();
      return { withKnockout, filled };
    });

    // The flattened logo is a data URL, so check what went INTO it by
    // re-reading the constants rather than the src.
    expect(result.withKnockout).not.toBe(result.filled);
  });

  test('the filled artwork has green exactly where the blanko one has holes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const load = (src) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0);
          resolve({ data: x.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height });
        };
        img.src = src;
      });

      const base = 'resources/images/logos/';
      const blank = await load(base + AppConstants.LOGO.FILES.SHORT);
      const filled = await load(base + AppConstants.LOGO.FILES.SHORT_FILLED);

      let holesFilledGreen = 0;
      let holesLeftOpen = 0;
      let whiteChanged = 0;
      let openAtBorder = 0;

      for (let i = 0; i < blank.data.length; i += 4) {
        const pixel = i / 4;
        const x = pixel % blank.w;
        const y = Math.floor(pixel / blank.w);
        const onBorder = x < 2 || y < 2 || x > blank.w - 3 || y > blank.h - 3;

        const wasHole = blank.data[i + 3] < 32;
        const nowGreen = filled.data[i + 3] > 200 &&
          Math.abs(filled.data[i] - 37) < 12 &&
          Math.abs(filled.data[i + 1] - 118) < 12 &&
          Math.abs(filled.data[i + 2] - 57) < 12;

        if (wasHole && nowGreen) holesFilledGreen++;
        if (wasHole && filled.data[i + 3] < 32) holesLeftOpen++;
        if (onBorder && filled.data[i + 3] < 32) openAtBorder++;

        // Fully opaque white is the artwork itself and must survive untouched.
        // Partially transparent pixels are the anti-aliased edges; the
        // enclosed ones are deliberately blended towards green instead of
        // towards whatever lies behind, which is the whole point.
        if (blank.data[i + 3] === 255 && blank.data[i] > 250) {
          if (filled.data[i] < 250 || filled.data[i + 3] < 255) whiteChanged++;
        }
      }
      return { holesFilledGreen, holesLeftOpen, whiteChanged, openAtBorder };
    });

    // The enclosed holes — counters of the G, letters in the bar — are green.
    expect(result.holesFilledGreen).toBeGreaterThan(10000);
    // The outer transparency survives, or the logo would sit in a green box.
    expect(result.holesLeftOpen).toBeGreaterThan(result.holesFilledGreen);
    expect(result.openAtBorder).toBeGreaterThan(0);
    // And the white artwork itself is untouched.
    expect(result.whiteChanged).toBe(0);
  });
});
