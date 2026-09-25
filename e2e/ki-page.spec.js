import { test, expect } from '@playwright/test';

/**
 * The page exists to get someone from "I need a picture" to a working prompt
 * in as few steps as possible. These tests guard that path: the copy block has
 * to be near the top, it has to carry the pointer to llms.txt, and the copy
 * button has to do something visible even where the clipboard API is blocked.
 */
test.describe('KI page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ki.html', { waitUntil: 'networkidle' });
  });

  test('the copy block is reachable without hunting for it', async ({ page }) => {
    const box = await page.locator('#ki-copy-text').boundingBox();
    const height = await page.evaluate(() => document.documentElement.scrollHeight);

    // Not necessarily above the fold, but in the first third of the page —
    // the earlier version buried it in the fifth section.
    expect(box.y / height).toBeLessThan(0.34);
  });

  test('the prompt points the model at llms.txt and forbids improvising', async ({ page }) => {
    const prompt = await page.locator('#ki-copy-text').innerText();
    expect(prompt).toContain('bildgenerator.gruene.at/llms.txt');
    expect(prompt).toContain('window.Bildgenerator');
    // The rule the whole interface exists for.
    expect(prompt.toLowerCase()).toContain('substitute font');
  });

  test('the copy button copies the prompt', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('#ki-copy-button');

    await expect(page.locator('#ki-copy-button')).toHaveText('Kopiert');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('llms.txt');
  });

  test('the button says something even when the clipboard is unavailable', async ({ page }) => {
    // Older browsers and insecure contexts have no clipboard API. Silently
    // doing nothing would leave the reader stuck at step two.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.click('#ki-copy-button');

    const label = await page.locator('#ki-copy-button').innerText();
    expect(label).not.toBe('Kopieren');
  });

  test('links to llms.txt, the fonts page and the generator', async ({ page }) => {
    for (const href of ['llms.txt', 'schriften.html', 'index.html']) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test('links are visually distinguishable from the text around them', async ({ page }) => {
    // The design system deliberately ships no tag defaults, so a bare <a>
    // inherits body colour and loses its underline — indistinguishable from
    // prose, which is both a usability and an accessibility failure.
    const result = await page.evaluate(() => {
      const link = document.querySelector('.ki-list a');
      const linkStyle = getComputedStyle(link);
      const bodyStyle = getComputedStyle(document.body);
      return {
        differentColour: linkStyle.color !== bodyStyle.color,
        underlined: linkStyle.textDecorationLine.includes('underline'),
      };
    });

    expect(result.differentColour || result.underlined).toBe(true);
  });

  test('loads without console errors or failed requests', async ({ page }) => {
    const problems = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
    await page.reload({ waitUntil: 'networkidle' });
    expect(problems).toEqual([]);
  });
});
