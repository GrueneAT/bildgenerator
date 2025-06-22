import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Layouts', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Basic Layout - Compare template and logo rendering', async ({ page }) => {
    console.log('Testing basic layout...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    // Capture canvas in step 3 before going to step 4
    await compareWithReference(page, 'basic-layout');
  });

  test('Combined Layout - Compare all features together', async ({ page }) => {
    console.log('Testing combined layout...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'GRÜNE ZUKUNFT');
    await page.click('#add-text');
    await page.waitForTimeout(1500);

    // Add shapes
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
    await page.click('#add-pink-circle');
    await page.waitForTimeout(1000);

    // Add QR code
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    await page.fill('#qr-text', 'https://gruene.at');
    await page.click('#add-qr-code');
    await page.waitForTimeout(3000); // QR generation takes time

    // Arrange elements consistently
    await page.evaluate(() => {
      const objects = canvas.getObjects();
      let textCount = 0;
      let circleCount = 0;
      let qrCount = 0;
      
      objects.forEach((obj) => {
        if (obj === contentRect || obj === logo || obj === logoName) {
          return;
        }
        
        if (obj.type === 'text') {
          textCount++;
          obj.set({ left: canvas.width / 2, top: canvas.height * 0.15 });
          obj.scaleToWidth(canvas.width * 0.8);
        } else if (obj.type === 'circle') {
          circleCount++;
          obj.set({ left: canvas.width * 0.2, top: canvas.height * 0.5 });
          obj.scaleToWidth(canvas.width * 0.15);
        } else if (obj.type === 'image' && obj !== contentImage && obj !== logo) {
          qrCount++;
          obj.set({ left: canvas.width * 0.75, top: canvas.height * 0.6 });
          obj.scaleToWidth(canvas.width * 0.2);
        }
        
        obj.setCoords();
      });
      canvas.renderAll();
    });
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'combined-layout');
  });
});