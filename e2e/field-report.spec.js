import { test, expect } from '@playwright/test';

/**
 * Findings from the first production use of the interface, written up in
 * wordpress-herzogenburg/content/bildgenerator-befund.md after eight article
 * images were built against llms.txt alone.
 *
 * The worst of them was silent: a background given as an absolute URL was
 * accepted, reported success, and simply did not appear. Three images shipped
 * as blank green surfaces and nothing said so.
 */
test.describe('Field report findings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('a background that cannot be loaded throws instead of staying silent', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);

      let message = null;
      try {
        // Cross-origin and not CORS-enabled — the case from the report.
        await B.setBackground('https://noe.gruene.at/app/uploads/sites/13/2026/09/gang.jpg');
      } catch (e) {
        message = e.message;
      }
      return { message, hasBackground: !!contentImage };
    });

    // Reporting success while dropping the image is the failure this whole
    // interface exists to prevent — applied to photos instead of fonts.
    expect(result.message).toBeTruthy();
    expect(result.message).toMatch(/CORS|geladen|data:/);
  });

  test('a same-origin URL still works and really lands on the canvas', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      // Served by the app itself, so the fetch is allowed.
      await B.setBackground('resources/images/logos/Logo-einzeilig_blanko.png');
      return {
        width: contentImage ? contentImage.width : 0,
        role: B.objects().some((o) => o.role === 'background'),
      };
    });

    // The fix must not break the case that did work.
    expect(result.width).toBeGreaterThan(0);
    expect(result.role).toBe(true);
  });

  test('a data URL background is unaffected', async ({ page }) => {
    const ok = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.setBackground('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC');
      return !!contentImage && contentImage.width > 0;
    });

    expect(ok).toBe(true);
  });

  test('a long single-line headline is flagged', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Warum wir gegen die verbindliche Bürgerbefragung zur Windkraft stimmten');
      const long = B.check().findings.map((f) => f.rule);

      await B.reset();
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Warum wir gegen die\nBürgerbefragung\nstimmten');
      const wrapped = B.check().findings.map((f) => f.rule);
      return { long, wrapped };
    });

    // 76 characters render around 62 px on a 3000 px wide image — body copy,
    // not a headline. Broken into three lines it is fine.
    expect(result.long).toContain('headlineLength');
    expect(result.wrapped).not.toContain('headlineLength');
  });

  test('a fact tile is buildable — big number, small caption', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('9 Windräder');
      await B.place('center');
      const number = B.lastAdded().getScaledHeight();

      await B.addText('seit 11. August in Prüfung');
      await B.resize(0.35);
      await B.place('bottom');
      const caption = B.lastAdded().getScaledHeight();
      return { ratio: number / caption };
    });

    // The report found this impossible at VERSION 2 — there was no way to set
    // a size. resize() closed it.
    expect(result.ratio).toBeGreaterThan(3);
  });
});
