import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const llms = readFileSync(join(process.cwd(), 'llms.txt'), 'utf8');

/**
 * Runs the code examples from llms.txt against the real page.
 *
 * A worked example that does not work is worse than none: the model follows it,
 * hits an error it cannot interpret, and improvises — the exact failure this
 * interface exists to prevent. The examples are the part of the document most
 * likely to be copied verbatim, so they are the part that must be executable.
 */
test.describe('llms.txt examples actually run', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Bildgenerator !== 'undefined');
    page.on('dialog', (dialog) => dialog.accept());
  });

  // Every ```js block in the document.
  const examples = [...llms.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]);

  test('the document contains runnable examples', () => {
    expect(examples.length).toBeGreaterThanOrEqual(3);
  });

  for (const [index, code] of examples.entries()) {
    const firstLine = code.trim().split('\n')[0].slice(0, 60);
    test(`example ${index + 1} runs: ${firstLine}…`, async ({ page }) => {
      const error = await page.evaluate(async (source) => {
        try {
          // The examples are written as top-level await against the page.
          const run = new Function(`return (async () => { ${source} })()`);
          await run();
          return null;
        } catch (e) {
          return e.message;
        }
      }, code);

      expect(error, `example ${index + 1} failed`).toBeNull();
    });
  }
});
