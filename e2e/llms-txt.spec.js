import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Playwright runs from the project root; package.json has no "type": "module",
// so import.meta is not available here.
const llms = readFileSync(join(process.cwd(), 'llms.txt'), 'utf8');

/**
 * llms.txt is the contract we hand to outside callers. A method that is
 * documented but missing sends an assistant down a dead end, and the assistant
 * will not report back — it will improvise, which is exactly the failure this
 * whole interface exists to prevent. So the document is checked against the
 * running page rather than trusted.
 */
test.describe('llms.txt matches the facade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
  });

  test('every documented method exists on window.Bildgenerator', async ({ page }) => {
    // Only the interface part of the document. The later sections mention
    // browser and DOM APIs (confirm(), exportCanvas()) that are deliberately
    // NOT part of the facade — matching those would assert the opposite of
    // what the document says.
    const spec = llms.split('## Was du nicht selbst machen musst')[0];
    const documented = [...spec.matchAll(/`(?:Bildgenerator\.)?([a-zA-Z]\w*)\(/g)]
      .map((m) => m[1]);

    expect(documented.length).toBeGreaterThan(10);

    const missing = await page.evaluate(
      (names) => names.filter((n) => typeof window.Bildgenerator[n] !== 'function'),
      [...new Set(documented)]
    );

    expect(missing, `documented in llms.txt but not implemented: ${missing.join(', ')}`).toEqual([]);
  });

  test('every key llms.txt promises from options() is really there', async ({ page }) => {
    const listed = llms
      .split('`options()` liefert:')[1]
      .split('.')[0]
      .match(/`(\w+)`/g)
      .map((s) => s.replace(/`/g, ''));

    const actual = await page.evaluate(() => Object.keys(window.Bildgenerator.options()));
    for (const key of listed) {
      expect(actual, `options().${key} promised in llms.txt`).toContain(key);
    }
  });

  test('the documented interface version is the one that ships', async ({ page }) => {
    const documented = Number(llms.match(/Bildgenerator\.VERSION === (\d+)/)[1]);
    const actual = await page.evaluate(() => window.Bildgenerator.VERSION);
    expect(actual).toBe(documented);
  });

  test('every template named in llms.txt exists', async ({ page }) => {
    const table = llms.split('## Formate')[1].split('##')[0];
    const names = [...table.matchAll(/\| `([a-z0-9_]+)`(?: \/ `([a-z0-9_]+)`)? \|/g)]
      .flatMap((m) => [m[1], m[2]])
      .filter(Boolean);

    expect(names.length).toBeGreaterThan(8);
    const actual = await page.evaluate(() => window.Bildgenerator.templates());
    for (const name of names) {
      expect(actual, `template "${name}" named in llms.txt`).toContain(name);
    }
  });
});
