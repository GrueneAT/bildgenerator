import { test, expect } from '@playwright/test';

/**
 * Drives window.Bildgenerator exactly the way an outside caller does — an AI
 * assistant in a browser sandbox, or any headless script: load the page, call
 * the facade, take the dataURL. Nothing here reaches into the wizard, because
 * the whole point of the facade is that callers do not have to.
 *
 * If the wizard changes in a way that breaks remote callers, this is where it
 * surfaces. Without it, the breakage would first show up as somebody's wrong
 * image.
 */

// 2x2 red PNG — enough to prove an image reaches the canvas without depending
// on any file being served.
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

test.describe('Bildgenerator facade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    // The copyright dialog would block the export click.
    page.on('dialog', (dialog) => dialog.accept());
  });

  // ------------------------------------------------------------------ lookup

  test('exposes every choice a caller has to make', async ({ page }) => {
    const { templates, logos, options, version } = await page.evaluate(() => ({
      templates: window.Bildgenerator.templates(),
      logos: window.Bildgenerator.logos(),
      options: window.Bildgenerator.options(),
      version: window.Bildgenerator.VERSION,
    }));

    expect(version).toBe(2);
    expect(templates).toContain('artikel_23');
    expect(templates).toContain('feed_post_45');
    expect(logos).toContain('HERZOGENBURG');

    // Every list has to be discoverable, otherwise a caller is guessing.
    for (const key of [
      'textColors', 'fontStyles', 'lineHeights', 'alignments', 'shapes',
      'clipSizes', 'qrColorsOnImage', 'qrColors', 'qrBackgrounds', 'formats',
    ]) {
      expect(options[key], `options().${key}`).toBeTruthy();
      expect(options[key].length, `options().${key} is empty`).toBeGreaterThan(0);
    }
    expect(options.fontStyles).toContain('standard');
    expect(options.qrBackgrounds).toContain('transparent');
  });

  // ------------------------------------------------------------------ format

  test('renders a 2:3 article image in one call', async ({ page }) => {
    const result = await page.evaluate(async () =>
      window.Bildgenerator.render({
        template: 'artikel_23',
        text: 'Rückenwind',
        dpi: 72,
      })
    );

    // 1080x1620 at 72 DPI means no scaling: the export is the canvas.
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1620);
    expect(result.width / result.height).toBeCloseTo(2 / 3, 3);
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true);
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

  test('exports jpeg when asked', async ({ page }) => {
    const result = await page.evaluate(async () =>
      window.Bildgenerator.render({ template: 'feed_post_45', format: 'jpeg', quality: 0.5, dpi: 72 })
    );
    expect(result.dataURL.startsWith('data:image/jpeg')).toBe(true);
  });

  // -------------------------------------------------------------------- logo

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

  test('can render without the organisation logo', async ({ page }) => {
    const images = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogoEnabled(false);
      return canvas.getObjects().filter((o) => o.type === 'image').length;
    });
    expect(images).toBe(0);
  });

  // ------------------------------------------------------------------ design

  test('accepts a background image as a data URL', async ({ page }) => {
    const result = await page.evaluate(async (dataUrl) => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().filter((o) => o.type === 'image').length;
      await window.Bildgenerator.setBackground(dataUrl);
      return {
        before,
        after: canvas.getObjects().filter((o) => o.type === 'image').length,
        hasContentImage: !!window.contentImage,
      };
    }, TINY_PNG);

    expect(result.after).toBe(result.before + 1);
    expect(result.hasContentImage).toBe(true);
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

  test('adds both decorative elements', async ({ page }) => {
    const counts = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().length;
      await window.Bildgenerator.addShape('pinkCircle');
      const afterCircle = canvas.getObjects().length;
      await window.Bildgenerator.addShape('cross');
      return { before, afterCircle, afterCross: canvas.getObjects().length };
    });

    expect(counts.afterCircle).toBe(counts.before + 1);
    expect(counts.afterCross).toBe(counts.afterCircle + 1);
  });

  test('adds a free-standing image on top of the design', async ({ page }) => {
    const added = await page.evaluate(async (dataUrl) => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().length;
      await window.Bildgenerator.addImage(dataUrl);
      return canvas.getObjects().length - before;
    }, TINY_PNG);
    expect(added).toBe(1);
  });

  // -------------------------------------------------------------------- QR

  test('places a QR code on the image', async ({ page }) => {
    const added = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      const before = canvas.getObjects().length;
      await window.Bildgenerator.addQRCode({ text: 'https://gruene.at' });
      return canvas.getObjects().length - before;
    });
    expect(added).toBe(1);
  });

  test('renders a standalone QR code without touching the canvas', async ({ page }) => {
    const result = await page.evaluate(async () =>
      window.Bildgenerator.renderQRCode({
        data: 'https://gruene.at',
        color: '#257639',
        background: '#FFFFFF',
      })
    );

    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBe(result.width);
  });

  test('renders a QR code on a transparent background', async ({ page }) => {
    const result = await page.evaluate(async () =>
      window.Bildgenerator.renderQRCode({ data: 'test', background: 'transparent' })
    );
    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true);
  });

  // ------------------------------------------------------------- everything

  test('combines background, logo, elements, QR and text in one render', async ({ page }) => {
    const result = await page.evaluate(async (dataUrl) => {
      const out = await window.Bildgenerator.render({
        template: 'artikel_23',
        background: dataUrl,
        logo: 'HERZOGENBURG',
        shapes: ['pinkCircle'],
        qr: { text: 'https://noe.gruene.at/gemeinden/herzogenburg/' },
        text: 'Rückenwind',
        textColor: '#FFED00',
        align: 'center',
        dpi: 72,
      });
      return { out, objects: canvas.getObjects().length };
    }, TINY_PNG);

    expect(result.out.width).toBe(1080);
    expect(result.out.height).toBe(1620);
    // Background photo, logo, pink circle, QR, text — five, not six: the plain
    // green rect the canvas starts with is REPLACED by the background photo
    // rather than covered by it.
    expect(result.objects).toBe(5);
  });

  // --------------------------------------------------------------- failures

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

  test('rejects an unknown shape and lists the valid ones', async ({ page }) => {
    const message = await page.evaluate(async () => {
      try {
        await window.Bildgenerator.addShape('dreieck');
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain('dreieck');
    expect(message).toContain('pinkCircle');
  });
});
