import { test, expect } from '@playwright/test';

/**
 * Drives window.Bildgenerator exactly the way an outside caller does — an AI
 * assistant in a browser sandbox, or any headless script: load the page, call
 * the facade, take the dataURL. Nothing here reaches into the wizard, because
 * the whole point of the facade is that callers do not have to.
 *
 * If the wizard changes in a way that breaks remote callers, this test is where
 * it surfaces. That is the reason it exists: without it, the breakage would
 * first show up as somebody's wrong image.
 */
test.describe('Bildgenerator facade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    // The copyright dialog would block the export click.
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('exposes the templates and logos a caller can choose from', async ({ page }) => {
    const { templates, logos, version } = await page.evaluate(() => ({
      templates: window.Bildgenerator.templates(),
      logos: window.Bildgenerator.logos(),
      version: window.Bildgenerator.VERSION,
    }));

    expect(version).toBe(1);
    expect(templates).toContain('artikel_23');
    expect(templates).toContain('feed_post_45');
    expect(logos.length).toBeGreaterThan(0);
  });

  test('renders a 2:3 article image in one call', async ({ page }) => {
    const result = await page.evaluate(async () => {
      return window.Bildgenerator.render({
        template: 'artikel_23',
        text: 'Rückenwind',
        dpi: 72,
      });
    });

    // 1080x1620 at 72 DPI means no scaling: the export is the canvas.
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1620);
    expect(result.width / result.height).toBeCloseTo(2 / 3, 3);
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.dataURL.length).toBeGreaterThan(1000);
  });

  test('honours the template dimensions for every template', async ({ page }) => {
    for (const name of ['feed_post_45', 'story', 'facebook_header']) {
      const result = await page.evaluate(async (template) => {
        const expected = window.TemplateConstants.getTemplate(template);
        const out = await window.Bildgenerator.render({ template, dpi: 72 });
        return { out, expected };
      }, name);

      expect(result.out.width, `${name} width`).toBe(result.expected.width);
      expect(result.out.height, `${name} height`).toBe(result.expected.height);
    }
  });

  test('leaves exactly one logo on the canvas, however often it is set', async ({ page }) => {
    const counts = await page.evaluate(async () => {
      const name = window.Bildgenerator.logos()[0];
      await window.Bildgenerator.setTemplate('feed_post_45');
      const images = () => canvas.getObjects().filter((o) => o.type === 'image').length;

      await window.Bildgenerator.setLogo(name);
      const afterFirst = images();
      await window.Bildgenerator.setLogo(name);
      const afterSecond = images();
      return { afterFirst, afterSecond };
    });

    // With no background photo the logo is the only image on the canvas.
    // Setting it must replace, never stack: addLogo() is two async hops deep,
    // so a caller that continued before it settled used to end up with two
    // logos pixel-on-pixel — invisible on screen, twice as heavy in the export.
    expect(counts.afterFirst).toBe(1);
    expect(counts.afterSecond).toBe(1);
  });

  test('adds text without the caller expanding the collapsed section', async ({ page }) => {
    const added = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().length;
      await window.Bildgenerator.addText('Testtext');
      return canvas.getObjects().length - before;
    });

    expect(added).toBe(1);
  });

  test('accepts a background image as a data URL', async ({ page }) => {
    // 2x2 red PNG — enough to prove the image reaches the canvas without
    // depending on any file being served.
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

    const result = await page.evaluate(async (dataUrl) => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().filter((o) => o.type === 'image').length;
      await window.Bildgenerator.setBackground(dataUrl);
      return {
        before,
        after: canvas.getObjects().filter((o) => o.type === 'image').length,
        hasContentImage: !!window.contentImage,
      };
    }, png);

    expect(result.after).toBe(result.before + 1);
    expect(result.hasContentImage).toBe(true);
  });

  test('rejects an unknown template by name and lists the valid ones', async ({ page }) => {
    const message = await page.evaluate(async () => {
      try {
        await window.Bildgenerator.render({ template: 'gibt_es_nicht' });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain('gibt_es_nicht');
    expect(message).toContain('artikel_23');
  });
});
