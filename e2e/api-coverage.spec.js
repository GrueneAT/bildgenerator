import { test, expect } from '@playwright/test';

/**
 * The facade's promise is "everything the page can do". This test holds it to
 * that literally: it walks the interactive controls of the wizard and asserts
 * that each one has a counterpart on window.Bildgenerator.
 *
 * Without it the promise decays silently — a new button in the UI is simply
 * unreachable for callers, and nobody notices until someone asks for it.
 */
test.describe('facade covers the whole UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
  });

  // Every control a person can operate, and the call that replaces it.
  const CONTROLS = {
    'canvas-template': 'setTemplate',
    'logo-selection': 'setLogo',
    'logo-toggle': 'setLogoEnabled',
    'meme-input': 'setBackground',
    text: 'addText',
    'text-color': 'addText',
    'font-style-select': 'addText',
    'line-height': 'addText',
    'shadow-depth': 'addText',
    'add-text': 'addText',
    'add-pink-circle': 'addShape',
    'add-cross': 'addShape',
    'add-image': 'addImage',
    'add-circle': 'clipToCircle',
    'circle-radius': 'clipToCircle',
    'qr-text': 'addQRCode',
    'qr-color': 'addQRCode',
    'add-qr-code': 'addQRCode',
    scale: 'resize',
    'remove-element': 'remove',
    'bring-to-front': 'bringToFront',
    'image-format': 'export',
    'image-quality': 'export',
    'generate-meme': 'export',
    'start-over': 'reset',
  };

  test('every control in the wizard has a counterpart on the facade', async ({ page }) => {
    const result = await page.evaluate((controls) => {
      const missingInUI = [];
      const missingInFacade = [];
      for (const [id, method] of Object.entries(controls)) {
        if (!document.getElementById(id)) missingInUI.push(id);
        if (typeof window.Bildgenerator[method] !== 'function') missingInFacade.push(method);
      }
      return { missingInUI, missingInFacade };
    }, CONTROLS);

    // A control that vanished from the UI means this map is stale.
    expect(result.missingInUI, 'controls named here but gone from the markup').toEqual([]);
    expect(result.missingInFacade, 'controls with no facade counterpart').toEqual([]);
  });

  test('capabilities beyond single controls are reachable too', async ({ page }) => {
    const missing = await page.evaluate(() => {
      // Things a person does by dragging, clicking or looking — no control id.
      const needed = [
        'place',        // dragging an element
        'rotate',       // the rotation handle
        'select',       // clicking an element
        'update',       // editing a placed element
        'objects',      // seeing what is on the canvas
        'lastAdded',
        'protectiveMargin',
        'templates', 'logos', 'options',
        'render', 'renderQRCode', 'qrPayload',
      ];
      return needed.filter((n) => typeof window.Bildgenerator[n] !== 'function');
    });

    expect(missing).toEqual([]);
  });

  test('every selectable value in the UI is offered by options()', async ({ page }) => {
    const result = await page.evaluate(() => {
      const values = (sel) => [...document.querySelectorAll(`${sel} option`)]
        .map((o) => o.value).filter(Boolean);
      const o = window.Bildgenerator.options();
      const compare = (a, b) => a.every((v) => b.includes(v));
      return {
        textColors: compare(values('#text-color'), o.textColors),
        lineHeights: compare(values('#line-height'), o.lineHeights),
        clipSizes: compare(values('#circle-radius'), o.clipSizes),
        qrColorsOnImage: compare(values('#qr-color'), o.qrColorsOnImage),
        qrColors: compare(values('#qr-color-select'), o.qrColors),
        qrBackgrounds: compare(values('#qr-background-select'), o.qrBackgrounds),
      };
    });

    for (const [key, ok] of Object.entries(result)) {
      expect(ok, `options().${key} is missing values the UI offers`).toBe(true);
    }
  });

  test('every QR content type of the wizard can be built', async ({ page }) => {
    const result = await page.evaluate(() => {
      const uiTypes = [...document.querySelectorAll('.app-qr-type-button')]
        .map((b) => b.dataset.type);
      const B = window.Bildgenerator;
      const samples = {
        text: { type: 'text', text: 'x' },
        url: { type: 'url', url: 'gruene.at' },
        email: { type: 'email', email: 'a@gruene.at' },
        vcard: { type: 'vcard', firstname: 'A', lastname: 'B' },
      };
      const unsupported = uiTypes.filter((t) => !samples[t] || !B.qrPayload(samples[t]));
      return { uiTypes, unsupported };
    });

    expect(result.uiTypes.length).toBeGreaterThan(0);
    expect(result.unsupported, 'QR types the wizard offers but the facade cannot build').toEqual([]);
  });
});
