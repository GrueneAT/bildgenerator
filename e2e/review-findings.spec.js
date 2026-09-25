import { test, expect } from '@playwright/test';

/**
 * Regression tests for the findings of the external review (Claude Opus 5,
 * GPT-5.6, Antigravity). Each test pins one defect they found, so it cannot
 * come back quietly.
 */

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

test.describe('Review findings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('insideMargin checks all four edges, not just the origin', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Ein bewusst sehr langer Text der nicht hineinpasst');
      await B.resize(3);          // far wider than the canvas
      await B.place('top-left');  // origin is AT the margin
      const wide = B.objects().find((o) => o.type === 'text');

      await B.resize(0.3);
      await B.place('center');
      const fitting = B.objects().find((o) => o.type === 'text');
      return { wide, fitting, canvasWidth: canvas.width };
    });

    // Origin sits on the margin, so a left/top-only check called this "inside".
    expect(result.wide.left).toBeLessThanOrEqual(result.wide.width);
    expect(result.wide.width).toBeGreaterThan(result.canvasWidth);
    expect(result.wide.insideMargin).toBe(false);
    expect(result.fitting.insideMargin).toBe(true);
  });

  test('place, resize and rotate accept an index from objects()', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      await B.addText('Erster');
      await B.addShape('cross');

      // The first text is no longer the tracked element.
      const text = B.objects().find((o) => o.type === 'text');
      // Position LAST: fabric rotates around the centre by default
      // (centeredRotation), so rotating after placing moves the element.
      await B.rotate(10, { target: text.index });
      await B.resize(0.5, { target: text.index });
      await B.place('top-left', { target: text.index });

      const after = B.objects().find((o) => o.type === 'text');
      return { angle: after.angle, left: after.left, margin: B.protectiveMargin() };
    });

    // llms.txt documents { target: index }; before the fix a number was used
    // as the object itself and silently did nothing useful.
    expect(result.angle).toBe(10);
    expect(result.left).toBeCloseTo(result.margin, 0);
  });

  test('the logo, background and canvas surface cannot be moved or restyled', async ({ page }) => {
    const errors = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setBackground(png);
      await B.setLogo('HERZOGENBURG');

      const out = {};
      for (const role of ['logo', 'background', 'canvas']) {
        const item = B.objects().find((o) => o.role === role);
        out[role] = {};
        for (const method of ['place', 'resize', 'rotate', 'bringToFront', 'update']) {
          try {
            if (method === 'place') await B.place('top-left', { target: item.index });
            else if (method === 'resize') await B.resize(2, { target: item.index });
            else if (method === 'rotate') await B.rotate(45, { target: item.index });
            else if (method === 'bringToFront') await B.bringToFront(item.index);
            else await B.update({ color: '#FFED00' }, { target: item.index });
            out[role][method] = null;
          } catch (e) {
            out[role][method] = e.message;
          }
        }
      }
      return out;
    }, TINY_PNG);

    // objects() advertises these as editable:false; every mutating method
    // must honour that, not just remove().
    for (const role of ['logo', 'background', 'canvas']) {
      for (const method of ['place', 'resize', 'rotate', 'bringToFront', 'update']) {
        expect(errors[role][method], `${method}() on ${role}`).toBeTruthy();
      }
    }
  });

  test('export uses the DPI of the template, as the download button does', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      const out = {};
      for (const name of ['facebook_header', 'a6']) {
        await B.setTemplate(name);
        // No organisation wanted here — export() now refuses an image whose
        // logo bar would be blank, exactly as the download button does.
        await B.setLogoEnabled(false);
        const exported = await B.export();
        const template = window.TemplateConstants.getTemplate(name);
        out[name] = { got: exported.dpi, expected: template.dpi };
      }
      return out;
    });

    // Templates do not all use 200; hardcoding it produced a different
    // resolution than the same template gives a person.
    expect(result.facebook_header.got).toBe(result.facebook_header.expected);
    expect(result.a6.got).toBe(result.a6.expected);
  });

  test('text and shapes stay behind the organisation logo', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogo('HERZOGENBURG');

      const order = [];
      await B.addText('Text');
      order.push(B.objects().map((o) => o.role).pop());
      await B.addShape('pinkCircle');
      order.push(B.objects().map((o) => o.role).pop());
      await B.addShape('cross');
      order.push(B.objects().map((o) => o.role).pop());
      return order;
    });

    // bringLogoToFront() was wired for images and QR codes but not for text,
    // the Störer or the Wahlkreuz — those rendered over the logo.
    expect(result).toEqual(['logo', 'logo', 'logo']);
  });

  test('export refuses an image whose logo bar would be blank', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      // Logo feature on, but no organisation picked — the app draws the white
      // bar anyway and only the region name is missing.
      LogoState.setLogoEnabled(true);
      jQuery('#logo-selection').val('').trigger('change');

      let refused = null;
      try {
        await B.export();
      } catch (e) {
        refused = e.message;
      }

      await B.setLogo('HERZOGENBURG');
      const afterChoosing = await B.export({ dpi: 72 });
      return { refused, ok: afterChoosing.dataURL.length > 0 };
    });

    // The download button applies this gate; the facade skipped it, so a
    // blank logo bar shipped without anything looking broken.
    expect(result.refused).toContain('Logo');
    expect(result.ok).toBe(true);
  });

  test('setBackground waits for the NEW photo, not merely for any photo', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      const make = (colour) => {
        const c = document.createElement('canvas');
        c.width = 40; c.height = 40;
        const x = c.getContext('2d');
        x.fillStyle = colour; x.fillRect(0, 0, 40, 40);
        return c.toDataURL();
      };

      await B.setTemplate('feed_post_45');
      await B.setBackground(make('#ff0000'));
      const first = contentImage;

      // A template change disposes the canvas but never clears contentImage,
      // so the old latch was still truthy here and a replacement returned
      // before the new photo had loaded.
      await B.setTemplate('story');
      await B.setBackground(make('#0000ff'));
      return { replaced: contentImage !== first, present: !!contentImage };
    });

    expect(result.present).toBe(true);
    expect(result.replaced).toBe(true);
  });

  test('the same render spec produces the same text, whatever came before', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      const spec = { template: 'feed_post_45', text: 'Gleich', dpi: 72 };

      // A first call that sets colour, alignment and shadow explicitly.
      await B.render({
        ...spec,
        text: 'Vorher',
        textColor: '#FFED00',
        align: 'right',
        shadow: 20,
        lineHeight: '1.35',
      });

      await B.render(spec);
      const a = B.objects().find((o) => o.type === 'text');

      await B.reset();
      await B.render(spec);
      const b = B.objects().find((o) => o.type === 'text');
      return { a, b };
    });

    // addText() read every control, so omitted fields inherited the previous
    // call: one yellow right-aligned text and every later one was too.
    expect(result.a.color).toBe(result.b.color);
    expect(result.a.width).toBe(result.b.width);
    expect(result.a.height).toBe(result.b.height);
  });

  test('quiescence notices a change that leaves the object count untouched', async ({ page }) => {
    const signatures = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      await B.addShape('pinkCircle');
      const before = B._canvasSignature();
      await B.place('top-left');
      return { before, after: B._canvasSignature() };
    });

    // Counting objects cannot see a move or a replacement; the signature can.
    expect(signatures.after).not.toBe(signatures.before);
  });
});
