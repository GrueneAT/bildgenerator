import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

// Drives the font picker like a user: open the text section, choose a font
// option, type, and add the text. No direct canvas manipulation — the picker
// and #add-text button do all the work, exactly as a user would.
test.describe('Visual Regression - Font Picker', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Standard font - default text renders in the standard font', async ({ page }) => {
    console.log('Testing standard (default) font...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);

    // Leave the picker at its default (standard) selection.
    await page.fill('#text', 'STANDARD\nSCHRIFT');
    await page.click('#add-text');
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'text-font-standard');
  });

  test('Accent serif font - selecting accent renders Vollkorn (serif, not fallback)', async ({ page }) => {
    console.log('Testing accent serif font...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);

    // Pick the accent serif option before adding the text.
    await page.selectOption('#font-style-select', 'accent');
    await page.fill('#text', 'Akzent\nSerifenschrift');
    await page.click('#add-text');
    // Generous wait so the FontFaceObserver gate settles and Vollkorn is
    // actually painted (otherwise the serif would fall back to sans).
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'text-font-accent');
  });
});
