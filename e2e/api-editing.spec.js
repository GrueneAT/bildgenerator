import { test, expect } from '@playwright/test';

/**
 * Everything to do with elements that are ALREADY on the canvas: looking at
 * them, selecting, changing, deleting, reordering.
 *
 * The wizard can do all of this by clicking an object and touching a control.
 * Without it a caller is blind — it can add elements but never check what it
 * built, and to change a colour it would have to start over.
 */
test.describe('Bildgenerator facade — inspecting and editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('objects() reports what is on the canvas and what each thing is', async ({ page }) => {
    const objects = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogo('HERZOGENBURG');
      await B.addText('Hallo');
      return B.objects();
    });

    const roles = objects.map((o) => o.role);
    expect(roles).toContain('canvas');
    expect(roles).toContain('logo');

    const text = objects.find((o) => o.type === 'text');
    expect(text.text).toBe('Hallo');
    expect(text.editable).toBe(true);

    // The logo must be marked as off-limits, or a caller will try to move it.
    expect(objects.find((o) => o.role === 'logo').editable).toBe(false);
  });

  test('update() changes a text that is already placed', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.addText('Alt', { color: '#FFFFFF' });
      const before = { ...B.objects().find((o) => o.type === 'text') };

      await B.update({ text: 'Neu', color: '#FFED00', align: 'right' });
      const after = B.objects().find((o) => o.type === 'text');
      return { before, after, textAlign: B.lastAdded().textAlign };
    });

    expect(result.before.text).toBe('Alt');
    expect(result.after.text).toBe('Neu');
    expect(result.after.color).toBe('#FFED00');
    expect(result.textAlign).toBe('right');
  });

  test('update() re-measures the text instead of keeping stale dimensions', async ({ page }) => {
    const sizes = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.addText('Kurz');
      const before = B.lastAdded().width;
      await B.update({ text: 'Ein deutlich laengerer Text' });
      return { before, after: B.lastAdded().width };
    });

    // Fabric caches char metrics; without initDimensions() the box stays the
    // old size and the new text overflows it.
    expect(sizes.after).toBeGreaterThan(sizes.before);
  });

  test('select() addresses an element by its index', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogoEnabled(false);
      await B.addText('Eins');
      await B.place('top');
      await B.addText('Zwei');
      await B.place('bottom');

      const first = B.objects().find((o) => o.text === 'Eins');
      B.select(first.index);
      await B.update({ color: '#FFED00' });
      return B.objects().filter((o) => o.type === 'text').map((o) => ({ t: o.text, c: o.color }));
    });

    expect(result.find((o) => o.t === 'Eins').c).toBe('#FFED00');
    expect(result.find((o) => o.t === 'Zwei').c).not.toBe('#FFED00');
  });

  test('remove() deletes an element', async ({ page }) => {
    const counts = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.addShape('cross');
      const before = B.objects().length;
      await B.remove();
      return { before, after: B.objects().length };
    });

    expect(counts.after).toBe(counts.before - 1);
  });

  test('remove() refuses the logo and the background, as the UI does', async ({ page }) => {
    const messages = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';
      await B.setTemplate('feed_post_45');
      await B.setBackground(png);
      await B.setLogo('HERZOGENBURG');

      const out = {};
      for (const role of ['logo', 'background']) {
        const item = B.objects().find((o) => o.role === role);
        try {
          await B.remove(item.index);
          out[role] = null;
        } catch (e) {
          out[role] = e.message;
        }
      }
      return out;
    });

    expect(messages.logo).toContain('logo');
    expect(messages.background).toContain('background');
  });

  test('bringToFront() reorders but keeps the logo on top', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('feed_post_45');
      await B.setLogo('HERZOGENBURG');
      await B.addText('Hinten');
      await B.addShape('pinkCircle');

      const text = B.objects().find((o) => o.type === 'text');
      await B.bringToFront(text.index);

      const after = B.objects();
      return {
        lastRole: after[after.length - 1].role,
        textIndex: after.find((o) => o.type === 'text').index,
        circleIndex: after.find((o) => o.type === 'circle').index,
      };
    });

    expect(result.textIndex).toBeGreaterThan(result.circleIndex);
    expect(result.lastRole).toBe('logo');
  });

  test('builds QR payloads for all four content types', async ({ page }) => {
    const payloads = await page.evaluate(() => {
      const B = window.Bildgenerator;
      return {
        text: B.qrPayload({ type: 'text', text: 'Hallo' }),
        url: B.qrPayload({ type: 'url', url: 'gruene.at' }),
        email: B.qrPayload({ type: 'email', email: 'a@gruene.at', subject: 'Hallo Welt' }),
        vcard: B.qrPayload({ type: 'vcard', firstname: 'Anna', lastname: 'Muster', email: 'a@gruene.at' }),
      };
    });

    expect(payloads.text).toBe('Hallo');
    expect(payloads.url).toContain('gruene.at');
    expect(payloads.email.startsWith('mailto:a@gruene.at')).toBe(true);
    expect(payloads.email).toContain('subject=Hallo%20Welt');
    expect(payloads.vcard).toContain('BEGIN:VCARD');
    expect(payloads.vcard).toContain('Anna');
  });

  test('renderQRCode() takes a typed spec, not just a raw string', async ({ page }) => {
    const result = await page.evaluate(async () =>
      window.Bildgenerator.renderQRCode({
        type: 'email',
        email: 'buero@gruene.at',
        subject: 'Anfrage',
        color: '#257639',
      })
    );

    expect(result.dataURL.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.width).toBeGreaterThan(0);
  });
});
