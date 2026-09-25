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
