import { test, expect } from '@playwright/test';

/**
 * check() turns "this looks wrong" into something measurable.
 *
 * Each test builds a design with exactly one defect and asserts that the
 * checker names it — and, just as important, that a clean design produces no
 * findings. A checker that fires on everything is as useless as one that
 * fires on nothing.
 */

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';

const rules = (result) => result.findings.map((f) => f.rule);

test.describe('Quality check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  test('a clean design produces no findings at all', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.render({
        template: 'artikel_23',
        logo: 'HERZOGENBURG',
        text: 'Windpark kommt',
        dpi: 72,
      });
      return B.check();
    });

    expect(result.findings, JSON.stringify(result.findings)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test('an element breaking the protective margin is an error', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addShape('cross');
      // Straight into the corner, past the margin.
      B.lastAdded().set({ left: 2, top: 2 });
      B.lastAdded().setCoords();
      return B.check();
    });

    expect(rules(result)).toContain('margin');
    expect(result.ok).toBe(false);
  });

  test('two texts on top of each other is an error', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Eins');
      await B.resize(0.4);
      await B.place('center');
      await B.addText('Zwei');
      await B.resize(0.4);
      await B.place('center');   // deliberately the same spot
      return B.check();
    });

    expect(rules(result)).toContain('overlap');
  });

  test('text on a photo without a green panel is an error', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.setBackground(png);
      await B.addText('Ohne Fläche');
      await B.resize(0.5);
      await B.place('center');
      return B.check();
    }, PNG);

    // The central brand rule, and the one the tool cannot enforce by itself.
    expect(rules(result)).toContain('typeOnGreen');
    expect(result.ok).toBe(false);
  });

  test('the same text WITH a green panel passes', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.setBackground(png);
      await B.addText('Mit Fläche', { panel: true });
      await B.resize(0.5);
      await B.place('center');
      return B.check();
    }, PNG);

    expect(rules(result)).not.toContain('typeOnGreen');
  });

  test('two Störer are an error, one is not', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);

      await B.addShape('pinkCircle');
      await B.resize(0.5);
      await B.place('top-left');
      const withOne = B.check().findings.map((f) => f.rule);

      await B.addShape('pinkCircle');
      await B.resize(0.5);
      await B.place('top-right');
      return { withOne, withTwo: B.check().findings.map((f) => f.rule) };
    });

    expect(result.withOne).not.toContain('accents');
    // "Mehrere Störer heben sich gegenseitig auf" — our own documented rule.
    expect(result.withTwo).toContain('accents');
  });

  test('a lopsided composition is a warning, not an error', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addText('Ganz links');
      await B.resize(0.3);
      await B.place('left');
      return B.check();
    });

    const balance = result.findings.filter((f) => f.rule === 'balance');
    if (balance.length) {
      expect(balance[0].severity).toBe('warning');
      expect(result.errors.filter((e) => e.rule === 'balance')).toEqual([]);
    }
  });

  test('export reports the findings alongside the image', async ({ page }) => {
    const result = await page.evaluate(async (png) => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.setBackground(png);
      await B.addText('Ohne Fläche');
      await B.resize(0.5);
      await B.place('center');

      const withCheck = await B.export({ dpi: 72 });
      const without = await B.export({ dpi: 72, check: false });
      return {
        rules: withCheck.quality.findings.map((f) => f.rule),
        image: withCheck.dataURL.length > 0,
        suppressed: without.quality,
      };
    }, PNG);

    // The image is still delivered — only the caller knows whether an overlap
    // is a mistake. Staying silent would make the checker pointless.
    expect(result.image).toBe(true);
    expect(result.rules).toContain('typeOnGreen');
    expect(result.suppressed).toBeNull();
  });

  test('every finding names a rule, a severity and something readable', async ({ page }) => {
    const findings = await page.evaluate(async () => {
      const B = window.Bildgenerator;
      await B.setTemplate('artikel_23');
      await B.setLogoEnabled(false);
      await B.addShape('cross');
      B.lastAdded().set({ left: 2, top: 2 });
      B.lastAdded().setCoords();
      return B.check().findings;
    });

    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(['error', 'warning']).toContain(f.severity);
      expect(typeof f.rule).toBe('string');
      expect(f.message.length).toBeGreaterThan(10);
    }
  });
});
