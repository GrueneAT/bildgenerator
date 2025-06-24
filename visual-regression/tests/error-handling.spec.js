import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference, navigateToStep } from './test-utils.js';

test.describe('Visual Regression - Error Handling & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Empty Text Input - Handle empty text gracefully', async ({ page }) => {
    console.log('Testing empty text input...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Try to add empty text
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    
    // Leave text field empty and try to add
    await page.click('#add-text');
    await page.waitForTimeout(1000);

    // Verify no empty text object was added
    const textObjectCount = await page.evaluate(() => {
      const textObjects = canvas.getObjects().filter(obj => 
        obj.type === 'text' && obj !== logoName
      );
      return textObjects.length;
    });

    // Should be 0 since empty text shouldn't be added
    expect(textObjectCount).toBe(0);

    await compareWithReference(page, 'empty-text-input');
  });

  test('Long Text Input - Handle very long text content', async ({ page }) => {
    console.log('Testing long text input...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add very long text
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    
    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    
    await page.fill('#text', longText);
    await page.click('#add-text');
    await page.waitForTimeout(2000);

    // Verify text was added but properly contained
    const textProperties = await page.evaluate(() => {
      const textObjects = canvas.getObjects().filter(obj => 
        obj.type === 'text' && obj !== logoName
      );
      if (textObjects.length > 0) {
        const textObj = textObjects[0];
        return {
          hasText: textObj.text.length > 0,
          width: textObj.width,
          height: textObj.height,
          scaleX: textObj.scaleX,
          scaleY: textObj.scaleY
        };
      }
      return null;
    });

    expect(textProperties).not.toBeNull();
    expect(textProperties.hasText).toBe(true);

    await compareWithReference(page, 'long-text-input');
  });

  test('Multiple Text Additions - Handle multiple consecutive text additions', async ({ page }) => {
    console.log('Testing multiple text additions...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add multiple texts rapidly
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    
    for (let i = 1; i <= 5; i++) {
      await page.fill('#text', `Text ${i}`);
      await page.click('#add-text');
      await page.waitForTimeout(800);
    }

    // Verify all texts were added
    const textObjectCount = await page.evaluate(() => {
      const textObjects = canvas.getObjects().filter(obj => 
        obj.type === 'text' && obj !== logoName
      );
      return textObjects.length;
    });

    expect(textObjectCount).toBe(5);

    await compareWithReference(page, 'multiple-text-additions');
  });

  test('Invalid QR Code Input - Handle invalid QR code data', async ({ page }) => {
    console.log('Testing invalid QR code input...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Try to add empty QR code
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    
    // Leave QR text empty and try to generate
    await page.click('#add-qr-code');
    await page.waitForTimeout(2000);

    // Verify no QR code was added for empty input
    const qrObjectCount = await page.evaluate(() => {
      const imageObjects = canvas.getObjects().filter(obj => 
        obj.type === 'image' && obj !== contentImage && obj !== logo
      );
      return imageObjects.length;
    });

    expect(qrObjectCount).toBe(0);

    await compareWithReference(page, 'invalid-qr-input');
  });

  test('Very Long QR Code - Handle extremely long QR code data', async ({ page }) => {
    console.log('Testing very long QR code...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add very long QR code data
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    
    const longQRData = 'https://example.com/very-long-url-with-many-parameters?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5&param6=value6&param7=value7&param8=value8&param9=value9&param10=value10&param11=value11&param12=value12&param13=value13&param14=value14&param15=value15&param16=value16&param17=value17&param18=value18&param19=value19&param20=value20';
    
    await page.fill('#qr-text', longQRData);
    await page.click('#add-qr-code');
    await page.waitForTimeout(5000); // Allow more time for complex QR generation

    // Verify QR code was generated
    const qrObjectCount = await page.evaluate(() => {
      const imageObjects = canvas.getObjects().filter(obj => 
        obj.type === 'image' && obj !== contentImage && obj !== logo
      );
      return imageObjects.length;
    });

    expect(qrObjectCount).toBeGreaterThan(0);

    await compareWithReference(page, 'long-qr-code');
  });

  test('Canvas Boundary Handling - Elements at canvas edges', async ({ page }) => {
    console.log('Testing canvas boundary handling...');

    await setupBasicTemplate(page);
    await navigateToStep(page, 2, 3);

    // Add text 
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'EDGE TEXT');
    await page.click('#add-text');
    await page.waitForTimeout(1500);

    // Move text to canvas edge using direct canvas manipulation
    await page.evaluate(() => {
      const textObjects = canvas.getObjects().filter(obj => 
        obj.type === 'text' && obj !== logoName
      );
      if (textObjects.length > 0) {
        const textObj = textObjects[0];
        // Move to top-left corner
        textObj.set({ left: 0, top: 0 });
        textObj.setCoords();
        canvas.renderAll();
      }
    });
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'canvas-boundary-handling');
  });

  test('Template Switch with Content - Handle template changes with existing content', async ({ page }) => {
    console.log('Testing template switch with existing content...');

    await setupBasicTemplate(page);
    await navigateToStep(page, 2, 3);

    // Add text content
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'CONTENT TEXT');
    await page.click('#add-text');
    await page.waitForTimeout(1500);

    // Go back to step 1 to change template
    await navigateToStep(page, 3, 1);

    // Switch to a different template
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(2000);

    // Go back to step 3 to see the result
    await navigateToStep(page, 1, 3);

    await compareWithReference(page, 'template-switch-with-content');
  });

  test('Rapid User Interactions - Handle rapid clicking and selections', async ({ page }) => {
    console.log('Testing rapid user interactions...');

    await setupBasicTemplate(page);
    await navigateToStep(page, 2, 3);

    // Rapid section toggles
    for (let i = 0; i < 3; i++) {
      await page.click('button[onclick="toggleSection(\'text-section\')"]');
      await page.waitForTimeout(200);
    }

    // Add text content
    await page.fill('#text', 'RAPID TEST');
    await page.click('#add-text');
    await page.waitForTimeout(1000);

    // Verify application stability
    const finalState = await page.evaluate(() => {
      return {
        canvasExists: typeof canvas !== 'undefined' && canvas !== null,
        objectCount: canvas.getObjects().length,
        texts: canvas.getObjects().filter(obj => obj.type === 'text' && obj !== logoName).length
      };
    });

    expect(finalState.canvasExists).toBe(true);
    expect(finalState.objectCount).toBeGreaterThan(2);

    await compareWithReference(page, 'rapid-user-interactions');
  });

  test('Missing Logo Handling - Handle missing logo gracefully', async ({ page }) => {
    console.log('Testing missing logo handling...');

    // Select template only
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(2000);

    // Wait for canvas to be ready
    await page.waitForFunction(() => {
      return typeof canvas !== 'undefined' && canvas !== null;
    }, { timeout: 30000 });

    // Just capture the state with template selected but no logo
    // This tests that the application doesn't crash when no logo is selected
    const canvasState = await page.evaluate(() => {
      return {
        canvasExists: typeof canvas !== 'undefined' && canvas !== null,
        objectCount: canvas.getObjects().length,
        templateSelected: document.getElementById('canvas-template').value
      };
    });

    expect(canvasState.canvasExists).toBe(true);
    expect(canvasState.templateSelected).toBe('post');

    await compareWithReference(page, 'missing-logo-handling');
  });
});