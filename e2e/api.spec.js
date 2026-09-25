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

    expect(version).toBe(4);
    expect(templates).toContain('artikel_23');
    expect(templates).toContain('feed_post_45');
    expect(logos).toContain('HERZOGENBURG');

    // Every list has to be discoverable, otherwise a caller is guessing.
    for (const key of [
      'textColors', 'fontStyles', 'lineHeights', 'alignments', 'shapes',
      'clipSizes', 'qrColorsOnImage', 'qrColors', 'qrBackgrounds', 'formats',
      'positions',
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

  // ------------------------------------------------------------- placement

  test('place() moves an element out of the centre and respects the margin', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('artikel_23');
      await window.Bildgenerator.setLogoEnabled(false);
      await window.Bildgenerator.addShape('pinkCircle');

      const shape = window.Bildgenerator.lastAdded();
      const centred = { left: shape.left, top: shape.top };

      await window.Bildgenerator.place('top-left');
      return {
        centred,
        placed: { left: shape.left, top: shape.top },
        margin: window.Bildgenerator.protectiveMargin(),
      };
    });

    // M = 0.06 x short edge; for 1080x1620 that is 64.8.
    expect(result.margin).toBeCloseTo(64.8, 1);
    expect(result.placed.left).toBeCloseTo(result.margin, 1);
    expect(result.placed.top).toBeCloseTo(result.margin, 1);
    expect(result.placed.left).toBeLessThan(result.centred.left);
  });

  test('no element is placed inside the protective margin', async ({ page }) => {
    const violations = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogoEnabled(false);
      const margin = window.Bildgenerator.protectiveMargin();
      const bad = [];

      for (const position of window.Bildgenerator.options().positions) {
        await window.Bildgenerator.addShape('pinkCircle');
        await window.Bildgenerator.place(position);
        const o = window.Bildgenerator.lastAdded();
        const right = o.left + o.getScaledWidth();
        const bottom = o.top + o.getScaledHeight();
        if (o.left < margin - 0.5 || o.top < margin - 0.5 ||
            right > canvas.width - margin + 0.5 || bottom > canvas.height - margin + 0.5) {
          bad.push(position);
        }
      }
      return bad;
    });

    expect(violations).toEqual([]);
  });

  test('bottom placement keeps clear of the organisation logo', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogo('HERZOGENBURG');
      const logoTop = canvas.getObjects().filter((o) => o.type === 'image').pop().top;

      await window.Bildgenerator.addQRCode({ text: 'https://gruene.at' });
      await window.Bildgenerator.place('bottom-right');
      // NOT getObjects()[length-1]: bringLogoToFront() puts the logo there.
      const qr = window.Bildgenerator.lastAdded();
      return { logoTop, qrBottom: qr.top + qr.getScaledHeight() };
    });

    // Overlapping the logo is the one thing bottom placement must never do.
    expect(result.qrBottom).toBeLessThanOrEqual(result.logoTop);
  });

  test('render() places text and QR where asked', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.render({
        template: 'artikel_23',
        text: 'Kurz',
        textPosition: 'top',
        qr: { text: 'https://gruene.at', position: 'bottom-left' },
        dpi: 72,
      });
      const objects = canvas.getObjects();
      const text = objects.find((o) => o.type === 'text');
      const margin = window.Bildgenerator.protectiveMargin();
      return { textTop: text.top, margin, canvasHeight: canvas.height };
    });

    // "top" means at the margin, not floating in the middle.
    expect(result.textTop).toBeCloseTo(result.margin, 0);
  });

  test('place() never moves the organisation logo', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogo('HERZOGENBURG');
      const logo = canvas.getObjects().filter((o) => o.type === 'image').pop();
      const before = { left: logo.left, top: logo.top };

      await window.Bildgenerator.addShape('cross');
      await window.Bildgenerator.place('top-left');
      return { before, after: { left: logo.left, top: logo.top } };
    });

    // bringLogoToFront() makes the logo the LAST object, so a naive
    // "move the last object" would drag the logo into the corner.
    expect(result.after).toEqual(result.before);
  });

  test('rejects free coordinates outside the canvas', async ({ page }) => {
    const message = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.addShape('cross');
      try {
        await window.Bildgenerator.place({ x: 1.5, y: 0 });
        return null;
      } catch (error) {
        return error.message;
      }
    });

    // llms.txt promises these are rejected; silently clamping would make the
    // document a lie and put elements somewhere the caller did not ask for.
    expect(message).toContain('between 0 and 1');
  });

  test('rejects an unknown position and lists the valid ones', async ({ page }) => {
    const message = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.addShape('cross');
      try {
        await window.Bildgenerator.place('oben-links');
        return null;
      } catch (error) {
        return error.message;
      }
    });

    expect(message).toContain('oben-links');
    expect(message).toContain('top-left');
  });

  // -------------------------------------------------- several texts, sizing

  test('renders several texts with their own colour, size and position', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.render({
        template: 'artikel_23',
        logoEnabled: false,
        texts: [
          { text: 'Windpark', color: '#FFED00', position: 'top' },
          { text: 'kommt', color: '#FFFFFF', size: 0.5, position: 'bottom' },
        ],
        dpi: 72,
      });
      const texts = canvas.getObjects().filter((o) => o.type === 'text');
      return texts.map((t) => ({
        text: t.text,
        fill: t.fill,
        scale: Math.round(t.scaleX * 100) / 100,
        top: Math.round(t.top),
      }));
    });

    expect(result).toHaveLength(2);
    expect(result[0].fill).toBe('#FFED00');
    expect(result[1].fill).toBe('#FFFFFF');
    // Two texts must not end up stacked on the same spot.
    expect(result[0].top).not.toBe(result[1].top);
    expect(result[1].top).toBeGreaterThan(result[0].top);
  });

  test('resize() changes an element without moving it off the canvas', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.addText('Test');
      const before = window.Bildgenerator.lastAdded().getScaledWidth();
      await window.Bildgenerator.resize(0.4);
      const after = window.Bildgenerator.lastAdded().getScaledWidth();
      return { before, after };
    });

    expect(result.after).toBeLessThan(result.before);
  });

  test('place() accepts free coordinates and still honours the margin', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogoEnabled(false);
      await window.Bildgenerator.addShape('pinkCircle');
      await window.Bildgenerator.place({ x: 0, y: 0 });
      const atOrigin = { ...window.Bildgenerator.lastAdded() };
      const o = window.Bildgenerator.lastAdded();
      const topLeft = { left: o.left, top: o.top };

      await window.Bildgenerator.place({ x: 1, y: 1 });
      const bottomRight = {
        right: o.left + o.getScaledWidth(),
        bottom: o.top + o.getScaledHeight(),
      };
      return {
        topLeft,
        bottomRight,
        margin: window.Bildgenerator.protectiveMargin(),
        canvas: { w: canvas.width, h: canvas.height },
      };
    });

    expect(result.topLeft.left).toBeCloseTo(result.margin, 1);
    expect(result.topLeft.top).toBeCloseTo(result.margin, 1);
    expect(result.bottomRight.right).toBeCloseTo(result.canvas.w - result.margin, 1);
    expect(result.bottomRight.bottom).toBeCloseTo(result.canvas.h - result.margin, 1);
  });

  test('text alignment and block placement are different things', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.Bildgenerator.setTemplate('feed_post_45');
      await window.Bildgenerator.setLogoEnabled(false);
      await window.Bildgenerator.addText('Zeile eins\nZeile zwei', { align: 'right' });
      const text = window.Bildgenerator.lastAdded();
      const centred = text.left;
      await window.Bildgenerator.place('left');
      return { textAlign: text.textAlign, centred, placed: text.left };
    });

    // align='right' sets the lines inside the block; the block itself only
    // moves through place(). Confusing the two is the most common mistake.
    expect(result.textAlign).toBe('right');
    expect(result.placed).toBeLessThan(result.centred);
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
