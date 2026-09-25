import { test, expect } from '@playwright/test';

/**
 * The design capabilities the external review found missing: stacking order
 * backwards, the obligatory credit line, and repeating an element without
 * fetching it again.
 */
test.describe('Design patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('an element can be sent back behind another', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      // Two elements of the same kind, so nothing else reorders them behind
      // our back — the Störer handler brings text objects to the front by
      // itself, which would hide what this test is about.
      await B.addShape('cross');
      const first = B.lastAdded();
      await B.addShape('panel');
      const second = B.lastAdded();

      const indexOf = (o) => canvas.getObjects().indexOf(o);
      const before = { first: indexOf(first), second: indexOf(second) };

      await B.sendBackwards();          // moves `second` one step back
      const stepped = { first: indexOf(first), second: indexOf(second) };

      await B.sendToBack();
      return {
        before,
        stepped,
        secondIndex: indexOf(second),
        surfaceIndex: canvas.getObjects().indexOf(contentRect),
      };
    });

    // Added last, so it started on top.
    expect(result.before.second).toBeGreaterThan(result.before.first);
    // One step back puts it under the other.
    expect(result.stepped.second).toBeLessThan(result.stepped.first);
    // ...but never behind the canvas surface, which would hide it entirely.
    expect(result.secondIndex).toBeGreaterThan(result.surfaceIndex);
  });

  test('sendToBack keeps the background photo behind everything', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      await B.setBackground(png);
      await B.addShape('cross');
      await B.sendToBack();

      const objects = B.objects();
      return {
        cross: objects.find((o) => o.type === 'image' && o.role !== 'background').index,
        background: objects.find((o) => o.role === 'background').index,
      };
    }, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC');

    expect(result.cross).toBeGreaterThan(result.background);
  });

  test('the credit line is small and sits inside the margin', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Eine Schlagzeile');
      const headline = B.objects().find((o) => o.type === 'text');

      await B.addCredit('Symbolfoto — KI-generiert');
      const credit = B.objects().filter((o) => o.type === 'text').pop();
      return { headline, credit, shortEdge: Math.min(canvas.width, canvas.height) };
    });

    // A credit as large as a headline is not a credit. Fixed relative size,
    // not the automatic 80 % fit every other text gets.
    expect(result.credit.height).toBeLessThan(result.headline.height / 3);
    expect(result.credit.height / result.shortEdge).toBeLessThan(0.05);
    expect(result.credit.insideMargin).toBe(true);
  });

  test('duplicate repeats an element without fetching it again', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);

      // Count image requests so we can prove there is only one decode.
      let fetches = 0;
      const realFetch = window.fetch;
      window.fetch = function (...args) { fetches++; return realFetch.apply(this, args); };

      const c = document.createElement('canvas');
      c.width = 40; c.height = 40;
      const x = c.getContext('2d');
      x.fillStyle = '#E6007E'; x.beginPath(); x.arc(20, 20, 18, 0, 7); x.fill();

      await B.addImage(c.toDataURL());
      const clones = await B.duplicate({ count: 5 });
      window.fetch = realFetch;

      const images = B.objects().filter((o) => o.type === 'image').length;
      return { fetches, clones: clones.length, images };
    });

    // One fetch for the original, none for the five copies.
    expect(result.fetches).toBe(1);
    expect(result.clones).toBe(5);
    expect(result.images).toBe(6);
  });

  test('a row of repeated icons can be laid out — the Radbörse case', async ({ page }) => {
    const positions = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);

      const c = document.createElement('canvas');
      c.width = 40; c.height = 40;
      const x = c.getContext('2d');
      x.fillStyle = '#FFED00'; x.fillRect(0, 0, 40, 40);

      await B.addImage(c.toDataURL());
      await B.resize(0.25);
      const clones = await B.duplicate({ count: 3 });

      const all = [B.lastAdded(), ...clones];
      all.forEach((o, i) => {
        o.set({ left: 100 + i * 200, top: 400 });
        o.setCoords();
      });
      return all.map((o) => Math.round(o.left));
    });

    expect(positions).toEqual([100, 300, 500, 700]);
  });
});
