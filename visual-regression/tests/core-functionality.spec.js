import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from './test-utils.js';

test.describe('Visual Regression - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Application Functionality - Verify core features work correctly', async ({ page }) => {
    console.log('Testing application functionality...');

    // Test template selection
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);
    
    const templateValue = await page.evaluate(() => {
      return document.getElementById('canvas-template').value;
    });
    expect(templateValue).toBe('post');

    // Test logo loading
    const hasLogo = await page.evaluate(async () => {
      let attempts = 0;
      while (attempts < 30) {
        const logoSelect = document.getElementById('logo-selection');
        if (logoSelect && logoSelect.options.length > 1) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      return false;
    });
    expect(hasLogo).toBe(true);

    // Test canvas initialization
    const canvasExists = await page.evaluate(() => {
      return typeof canvas !== 'undefined' && canvas !== null;
    });
    expect(canvasExists).toBe(true);

    console.log('Application functionality test completed!');
  });
});