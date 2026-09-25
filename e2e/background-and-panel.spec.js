import { test, expect } from '@playwright/test';

/**
 * Background photographs as a design element, and the green surface the brand
 * rule requires under type.
 *
 * Both were gaps the external review named: the photo could only ever be
 * centred, and there was no way at all to put type on green over a photo —
 * which made the brand's central typography rule unachievable with a
 * background image.
 */

// Built in the page rather than pasted as base64, so the test cannot fail on
// a hand-assembled PNG. Wide and short: in a tall frame the width overflows,
// which is exactly the case the focus point exists for.
const WIDE_IMAGE = `(() => {
  const c = document.createElement('canvas');
  c.width = 400; c.height = 100;
  const x = c.getContext('2d');
  x.fillStyle = '#ff0000'; x.fillRect(0, 0, 200, 100);
  x.fillStyle = '#0000ff'; x.fillRect(200, 0, 200, 100);
  return c.toDataURL();
})()`;

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

test.describe('Background focus and green panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('the focus point decides which part of the photo survives the crop', async ({ page }) => {
    const result = await page.evaluate(async (source) => {
      const B = window.Bildgenerator;
      const png = eval(source);
      const positions = {};
      for (const [name, focusX] of [['left', 0], ['centre', 0.5], ['right', 1]]) {
        await B.setTemplate('story');   // tall frame, wide photo: x overflows
        await B.setBackground(png, { focusX });
        positions[name] = Math.round(contentImage.left);
      }
      return positions;
    }, WIDE_IMAGE);

    // focusX 0 pins the left edge of the photo to the frame; 1 pushes it left
    // so the right edge shows. Centre sits between the two.
    expect(result.left).toBeGreaterThan(result.centre);
    expect(result.centre).toBeGreaterThan(result.right);
  });

  test('the default is still centred, exactly as before', async ({ page }) => {
    const result = await page.evaluate(async (source) => {
      const B = window.Bildgenerator;
      const png = eval(source);
      await B.setTemplate('story');
      await B.setBackground(png);
      const withoutOption = Math.round(contentImage.left);
      await B.setBackground(png, { focusX: 0.5 });
      return { withoutOption, explicitCentre: Math.round(contentImage.left) };
    }, WIDE_IMAGE);

    expect(result.withoutOption).toBe(result.explicitCentre);
  });

  test('a focus value outside 0..1 is refused', async ({ page }) => {
    const message = await page.evaluate(async (png) => {
      try {
        await window.Bildgenerator.setBackground(png, { focusY: 1.5 });
        return null;
      } catch (e) {
        return e.message;
      }
    }, TINY_PNG);

    expect(message).toContain('0 to 1');
  });

  test('the green panel exists as a button and in options()', async ({ page }) => {
    const result = await page.evaluate(() => ({
      button: !!document.getElementById('add-panel'),
      shapes: window.Bildgenerator.options().shapes,
    }));

    // The facade drives the same control a person does — no second path.
    expect(result.button).toBe(true);
    expect(result.shapes).toContain('panel');
  });

  test('addPanel puts a green surface on the canvas behind the text', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      await B.addText('Rückenwind');
      await B.addPanel({ width: 0.9, height: 0.3 });

      const objects = B.objects();
      const panel = objects.filter((o) => o.type === 'rect').pop();
      const text = objects.find((o) => o.type === 'text');
      return { panelIndex: panel.index, textIndex: text.index, colour: panel.color };
    });

    expect(result.colour.toLowerCase()).toBe('#257639');
    // Panel behind the text, not over it.
    expect(result.panelIndex).toBeLessThan(result.textIndex);
  });

  test('addText({ panel: true }) sizes the surface to the text and keeps text on top', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Windpark kommt', { panel: true });

      const objects = B.objects();
      const panel = objects.filter((o) => o.type === 'rect').pop();
      const text = objects.find((o) => o.type === 'text');
      return {
        panel, text,
        trackedIsText: B.lastAdded().type,
      };
    });

    // Surface larger than the type on both axes, and centred on it.
    expect(result.panel.width).toBeGreaterThan(result.text.width);
    expect(result.panel.height).toBeGreaterThan(result.text.height);
    expect(result.panel.left + result.panel.width / 2)
      .toBeCloseTo(result.text.left + result.text.width / 2, 0);
    expect(result.panel.index).toBeLessThan(result.text.index);

    // The text remains the tracked element, so a following place() moves the
    // text — which is what a caller writing this would expect.
    expect(result.trackedIsText).toBe('text');
  });

  test('the green surface follows its text when the text is moved or scaled', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Windpark kommt', { panel: true });

      const centre = (o) => ({ x: o.left + o.width / 2, y: o.top + o.height / 2 });
      const read = () => {
        const objects = B.objects();
        return {
          panel: centre(objects.find((o) => o.role === 'panel')),
          text: centre(objects.find((o) => o.type === 'text')),
          panelSize: objects.find((o) => o.role === 'panel'),
          textSize: objects.find((o) => o.type === 'text'),
        };
      };

      await B.place('bottom');
      const moved = read();
      await B.resize(0.5);
      const scaled = read();
      return { moved, scaled };
    });

    // Moving the text used to leave the surface behind, so the text ended up
    // half off its own panel — worse than having no panel at all.
    expect(result.moved.panel.x).toBeCloseTo(result.moved.text.x, 0);
    expect(result.moved.panel.y).toBeCloseTo(result.moved.text.y, 0);

    // And scaling must shrink the surface with the type, not leave a slab.
    expect(result.scaled.panel.x).toBeCloseTo(result.scaled.text.x, 0);
    expect(result.scaled.panelSize.width).toBeLessThan(result.moved.panelSize.width);
    expect(result.scaled.panelSize.width).toBeGreaterThan(result.scaled.textSize.width);
  });

  test('type over a photo can be put on green in one call', async ({ page }) => {
    const objects = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.render({
        template: 'artikel_23',
        background: png,
        logo: 'HERZOGENBURG',
        texts: [{ text: 'Windpark kommt', panel: true, position: 'center' }],
        dpi: 72,
      });
      return B.objects().map((o) => o.role);
    }, TINY_PNG);

    // background photo, green panel, text, logo — the brand rule satisfied
    // with a photograph, which was impossible before.
    expect(objects).toContain('background');
    expect(objects).toContain('logo');
    expect(objects).toContain('panel');
    expect(objects).toContain('text');
  });
});
