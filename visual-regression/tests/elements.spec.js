import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Elements', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Shape Elements - Compare circles and image elements', async ({ page }) => {
    console.log('Testing shape elements...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add elements
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);

    await page.click('#add-pink-circle');
    await page.waitForTimeout(1000);

    await page.click('#add-cross');
    await page.waitForTimeout(1000);

    // Position elements consistently
    await page.evaluate(() => {
      const objects = canvas.getObjects();
      let circleCount = 0;
      let imageCount = 0;
      
      objects.forEach((obj) => {
        if (obj === contentRect || obj === logo || obj === logoName) {
          return;
        }
        
        if (obj.type === 'circle') {
          circleCount++;
          obj.set({ left: canvas.width * 0.3, top: canvas.height * 0.4 });
          obj.scaleToWidth(canvas.width * 0.2);
        } else if (obj.type === 'image' && obj !== contentImage && obj !== logo) {
          imageCount++;
          obj.set({ left: canvas.width * 0.7, top: canvas.height * 0.4 });
          obj.scaleToWidth(canvas.width * 0.15);
        }
        
        obj.setCoords();
      });
      canvas.renderAll();
    });
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'shape-elements');
  });
});