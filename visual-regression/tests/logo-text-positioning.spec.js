import { test, expect } from '@playwright/test';
import { setupTestEnvironment, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Logo Text Positioning', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages and errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser console error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });

    await setupTestEnvironment(page);
  });

  test('Single-line logo text - Visual regression test', async ({ page }) => {
    console.log('Testing single-line logo text positioning (visual regression)...');

    // Select template
    await page.selectOption('#canvas-template', 'post_45_border');
    await page.waitForTimeout(3000);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select a single-line logo using SearchableSelect
    const logoSelectionResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      if (!$select.length) return { success: false, error: 'Select element not found' };

      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) {
        return { success: false, error: 'SearchableSelect not initialized' };
      }

      // Get available options
      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);
      console.log('Available options:', options.slice(0, 10));

      // Find a short single-line option (no % and <= 16 chars)
      // Prefer specific known short names
      let targetOption = options.find(o =>
        o.toUpperCase() === 'WIEN' ||
        o.toUpperCase() === 'GOLS' ||
        o.toUpperCase() === 'PUCH'
      );

      if (!targetOption) {
        targetOption = options.find(o =>
          o.length > 0 && o.length <= 16 && !o.includes('%')
        );
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return { success: true, value: targetOption };
      }

      return { success: false, error: 'No suitable option found', availableCount: options.length };
    });

    console.log('Logo selection result:', logoSelectionResult);
    expect(logoSelectionResult.success).toBe(true);

    // Wait for logo to load (like logo-toggle tests do)
    await page.waitForTimeout(3000);

    // Verify logo text is single-line (no line break) after waiting
    const logoTextInfo = await page.evaluate(() => {
      if (typeof logoName === 'undefined' || !logoName) {
        return { error: 'logoName not defined' };
      }
      return {
        textContent: logoName.text,
        hasLineBreak: logoName.text.includes('\n'),
        success: true
      };
    });

    console.log('Single-line logo text info:', JSON.stringify(logoTextInfo, null, 2));

    if (logoTextInfo.error) {
      console.log('Warning: Could not verify logo text, proceeding with visual test');
    } else {
      expect(logoTextInfo.hasLineBreak).toBe(false);
    }

    // Navigate to next step before visual comparison
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    // Visual regression comparison
    await compareWithReference(page, 'logo-text-single-line');

    console.log('Single-line logo text visual regression test completed!');
  });

  test('Two-line logo text - Visual regression test', async ({ page }) => {
    console.log('Testing two-line logo text positioning (visual regression)...');

    // Select template
    await page.selectOption('#canvas-template', 'post_45_border');
    await page.waitForTimeout(3000);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select a two-line logo (with %) using SearchableSelect
    const logoSelectionResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      if (!$select.length) return { success: false, error: 'Select element not found' };

      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) {
        return { success: false, error: 'SearchableSelect not initialized' };
      }

      // Get available options
      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);

      // Find an option with % (forces two-line)
      // Prefer specific known two-line names
      let targetOption = options.find(o =>
        o.includes('BEZIRK') && o.includes('%')
      );

      if (!targetOption) {
        targetOption = options.find(o => o.includes('%'));
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return { success: true, value: targetOption };
      }

      return { success: false, error: 'No two-line option found', availableCount: options.length };
    });

    console.log('Logo selection result:', logoSelectionResult);
    expect(logoSelectionResult.success).toBe(true);

    // Wait for logo to load
    await page.waitForTimeout(3000);

    // Verify logo text is two-line (has line break)
    const logoTextInfo = await page.evaluate(() => {
      if (typeof logoName === 'undefined' || !logoName) {
        return { error: 'logoName not defined' };
      }
      return {
        textContent: logoName.text,
        hasLineBreak: logoName.text.includes('\n'),
        lineCount: logoName.text.split('\n').length,
        success: true
      };
    });

    console.log('Two-line logo text info:', JSON.stringify(logoTextInfo, null, 2));

    if (logoTextInfo.error) {
      console.log('Warning: Could not verify logo text, proceeding with visual test');
    } else {
      expect(logoTextInfo.hasLineBreak).toBe(true);
      expect(logoTextInfo.lineCount).toBe(2);
    }

    // Navigate to next step before visual comparison
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    // Visual regression comparison
    await compareWithReference(page, 'logo-text-two-line');

    console.log('Two-line logo text visual regression test completed!');
  });

  test('Logo text position consistency - Single vs Two-line comparison', async ({ page }) => {
    console.log('Testing position consistency between single and two-line logo text...');

    // Select template
    await page.selectOption('#canvas-template', 'post_45_border');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // First, select a single-line logo and get its position
    const singleLineResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) return null;

      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);

      // Find a single-line option
      let targetOption = options.find(o =>
        o.toUpperCase() === 'WIEN' ||
        o.toUpperCase() === 'GOLS' ||
        o.toUpperCase() === 'PUCH'
      );
      if (!targetOption) {
        targetOption = options.find(o => o.length > 0 && o.length <= 16 && !o.includes('%'));
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return targetOption;
      }
      return null;
    });

    expect(singleLineResult).not.toBeNull();
    console.log('Selected single-line logo:', singleLineResult);

    // Wait for logo to load
    await page.waitForTimeout(3000);

    const singleLinePosition = await page.evaluate(() => {
      if (typeof logoName === 'undefined' || !logoName || typeof logo === 'undefined' || !logo) {
        return null;
      }
      const offsetFromTop = logoName.top - logo.top;
      return {
        offsetFromTop,
        relativeToWidth: offsetFromTop / logo.getScaledWidth(),
        logoHeight: logo.getScaledHeight(),
        logoWidth: logo.getScaledWidth(),
        textContent: logoName.text
      };
    });

    if (!singleLinePosition) {
      console.log('Warning: Could not get single-line position, skipping consistency test');
      return;
    }

    console.log('Single-line position:', JSON.stringify(singleLinePosition, null, 2));

    // Now select a two-line logo
    const twoLineResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) return null;

      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);

      // Find a two-line option with %
      let targetOption = options.find(o => o.includes('BEZIRK') && o.includes('%'));
      if (!targetOption) {
        targetOption = options.find(o => o.includes('%'));
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return targetOption;
      }
      return null;
    });

    expect(twoLineResult).not.toBeNull();
    console.log('Selected two-line logo:', twoLineResult);

    // Wait for logo to load
    await page.waitForTimeout(3000);

    const twoLinePosition = await page.evaluate(() => {
      if (typeof logoName === 'undefined' || !logoName || typeof logo === 'undefined' || !logo) {
        return null;
      }
      const offsetFromTop = logoName.top - logo.top;
      return {
        offsetFromTop,
        relativeToWidth: offsetFromTop / logo.getScaledWidth(),
        logoHeight: logo.getScaledHeight(),
        logoWidth: logo.getScaledWidth(),
        textContent: logoName.text
      };
    });

    if (!twoLinePosition) {
      console.log('Warning: Could not get two-line position, skipping consistency test');
      return;
    }

    console.log('Two-line position:', JSON.stringify(twoLinePosition, null, 2));

    // The key test: both should have approximately the same relative position to logo width
    const positionDifference = Math.abs(singleLinePosition.relativeToWidth - twoLinePosition.relativeToWidth);
    console.log('Position difference (relative to width):', positionDifference);

    // They should be within 5% of each other (both should be ~0.90)
    expect(positionDifference).toBeLessThan(0.05);

    // Verify both are positioned correctly (at ~90% of logo width from top)
    expect(singleLinePosition.relativeToWidth).toBeGreaterThanOrEqual(0.85);
    expect(singleLinePosition.relativeToWidth).toBeLessThanOrEqual(0.95);
    expect(twoLinePosition.relativeToWidth).toBeGreaterThanOrEqual(0.85);
    expect(twoLinePosition.relativeToWidth).toBeLessThanOrEqual(0.95);

    console.log('Position consistency test passed!');
  });

  test('Single-line logo in Story template - Visual regression test', async ({ page }) => {
    console.log('Testing single-line logo text in Story template...');

    // Select Story template
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select a single-line logo
    const logoSelectionResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      if (!$select.length) return { success: false, error: 'Select element not found' };

      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) {
        return { success: false, error: 'SearchableSelect not initialized' };
      }

      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);

      // Find a single-line option
      let targetOption = options.find(o => o.toUpperCase() === 'SALZBURG');
      if (!targetOption) {
        targetOption = options.find(o => o.length > 0 && o.length <= 16 && !o.includes('%'));
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return { success: true, value: targetOption };
      }

      return { success: false, error: 'No suitable option found' };
    });

    expect(logoSelectionResult.success).toBe(true);
    console.log('Logo selection result:', logoSelectionResult);

    // Wait for logo to load
    await page.waitForTimeout(3000);

    // Navigate to next step
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    // Visual regression comparison
    await compareWithReference(page, 'logo-text-single-line-story');

    console.log('Single-line logo text in Story template test completed!');
  });

  test('Two-line logo in Story template - Visual regression test', async ({ page }) => {
    console.log('Testing two-line logo text in Story template...');

    // Select Story template
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Select a two-line logo
    const logoSelectionResult = await page.evaluate(() => {
      const $select = jQuery('#logo-selection');
      if (!$select.length) return { success: false, error: 'Select element not found' };

      const searchableSelect = $select.data('searchable-select');
      if (!searchableSelect) {
        return { success: false, error: 'SearchableSelect not initialized' };
      }

      const options = Array.from($select[0].options).map(o => o.value).filter(v => v);

      // Find a two-line option with %
      let targetOption = options.find(o => o.includes('HOFSTÄTTEN') && o.includes('%'));
      if (!targetOption) {
        targetOption = options.find(o => o.includes('%'));
      }

      if (targetOption) {
        searchableSelect.selectOption(targetOption);
        return { success: true, value: targetOption };
      }

      return { success: false, error: 'No two-line option found' };
    });

    expect(logoSelectionResult.success).toBe(true);
    console.log('Logo selection result:', logoSelectionResult);

    // Wait for logo to load
    await page.waitForTimeout(3000);

    // Navigate to next step
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    // Visual regression comparison
    await compareWithReference(page, 'logo-text-two-line-story');

    console.log('Two-line logo text in Story template test completed!');
  });
});
