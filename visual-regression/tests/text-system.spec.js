import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Text System', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Text Elements - Compare text rendering and positioning', async ({ page }) => {
    console.log('Testing text elements...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text elements
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    
    await page.fill('#text', 'GRÜNE TEXT TEST');
    await page.click('#add-text');
    await page.waitForTimeout(2000);

    await page.fill('#text', 'Zweiter Text\nMit Zeilenumbruch');
    await page.click('#add-text');
    await page.waitForTimeout(2000);

    // Position texts for consistency
    await page.evaluate(() => {
      const objects = canvas.getObjects();
      let textCount = 0;
      
      objects.forEach((obj) => {
        if (obj.type === 'text' && obj !== logoName) {
          textCount++;
          if (textCount === 1) {
            obj.set({ left: canvas.width / 2, top: canvas.height * 0.2 });
            obj.scaleToWidth(canvas.width * 0.8);
          } else if (textCount === 2) {
            obj.set({ left: canvas.width * 0.1, top: canvas.height * 0.6 });
            obj.scaleToWidth(canvas.width * 0.6);
          }
          obj.setCoords();
        }
      });
      canvas.renderAll();
    });
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'text-elements');
  });

  test('Text Yellow Color - Brand primary color', async ({ page }) => {
    console.log('Testing yellow text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set yellow color
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'GRÜNE GELB TEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set yellow color
    await page.selectOption('#text-color', 'rgb(255,240,0)');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-color-yellow');
  });

  test('Text White Color - High contrast white', async ({ page }) => {
    console.log('Testing white text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set white color
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'GRÜNE WEISS TEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set white color
    await page.selectOption('#text-color', 'rgb(255,255,255)');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-color-white');
  });

  test('Text Black Color - Standard black text', async ({ page }) => {
    console.log('Testing black text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set black color
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'GRÜNE SCHWARZ TEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set black color
    await page.selectOption('#text-color', 'rgb(0,0,0)');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-color-black');
  });

  test('Text Left Alignment - Left-aligned text', async ({ page }) => {
    console.log('Testing left-aligned text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set left alignment
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'LINKS\nAUSGERICHTET\nTEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set left alignment
    await page.locator('label:has(input#left)').click();
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-align-left');
  });

  test('Text Center Alignment - Center-aligned text', async ({ page }) => {
    console.log('Testing center-aligned text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set center alignment
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'ZENTRIERT\nAUSGERICHTET\nTEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set center alignment
    await page.locator('label:has(input#center)').click();
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-align-center');
  });

  test('Text Right Alignment - Right-aligned text', async ({ page }) => {
    console.log('Testing right-aligned text...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add text and set right alignment
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'RECHTS\nAUSGERICHTET\nTEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);
    
    // Set right alignment
    await page.locator('label:has(input#right)').click();
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'text-align-right');
  });
});