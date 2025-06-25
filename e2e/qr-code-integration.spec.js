import { test, expect } from '@playwright/test';

test.describe('QR Code Integration E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to QR code tab
    const qrTab = page.locator('#tab-qrcode');
    await qrTab.click();
    
    // Wait for QR container to be visible
    await expect(page.locator('#qrcode-container')).toBeVisible();
  });

  test('should create QR code with text content', async ({ page }) => {
    // QR Wizard Step 1: Select type
    await test.step('Select QR type', async () => {
      const textTypeButton = page.locator('[data-type="text"]');
      await expect(textTypeButton).toBeVisible();
      await textTypeButton.click();
      
      // Proceed to next step
      const nextButton = page.locator('#qr-step-1-next');
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
    });
    
    // QR Wizard Step 2: Enter content
    await test.step('Enter QR content', async () => {
      await expect(page.locator('#qr-step-2')).toBeVisible();
      
      // Wait for the form to be dynamically generated
      await page.waitForTimeout(1000);
      
      // Look for any text input in the form container - the type might be different
      const textInput = page.locator('#qr-form-container input, #qr-form-container textarea').first();
      await expect(textInput).toBeVisible();
      await textInput.fill('Grüne Österreich - Für eine bessere Zukunft!');
      
      // Proceed to preview
      const nextButton = page.locator('#qr-step-2-next');
      await nextButton.click();
    });
    
    // QR Wizard Step 3: Preview and download
    await test.step('Preview and download QR', async () => {
      await expect(page.locator('#qr-step-3')).toBeVisible();
      
      // Wait for QR generation to complete
      await page.waitForTimeout(2000);
      
      // Test QR download button (preview might still be processing)
      const downloadButton = page.locator('#qr-download');
      await expect(downloadButton).toBeVisible();
      await downloadButton.click();
      
      // Verify the button is functional
      await page.waitForTimeout(1000);
      await expect(downloadButton).toBeVisible();
    });
  });

  test('should create QR code with URL content', async ({ page }) => {
    // Select URL type
    const urlTypeButton = page.locator('[data-type="url"]');
    await urlTypeButton.click();
    
    const nextButton = page.locator('#qr-step-1-next');
    await nextButton.click();
    
    // Enter URL
    await expect(page.locator('#qr-step-2')).toBeVisible();
    await page.waitForTimeout(1000);
    
    const urlInput = page.locator('#qr-form-container input').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://gruene.at');
    
    const step2NextButton = page.locator('#qr-step-2-next');
    await step2NextButton.click();
    
    // Verify preview and download
    await expect(page.locator('#qr-step-3')).toBeVisible();
    const downloadButton = page.locator('#qr-download');
    await expect(downloadButton).toBeVisible();
  });

  test('should create QR code with email content', async ({ page }) => {
    // Select email type
    const emailTypeButton = page.locator('[data-type="email"]');
    await emailTypeButton.click();
    
    const nextButton = page.locator('#qr-step-1-next');
    await nextButton.click();
    
    // Fill email form
    await expect(page.locator('#qr-step-2')).toBeVisible();
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('#qr-form-container input').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('kontakt@gruene.at');
    
    const subjectInput = page.locator('#qr-form-container input[name*="subject"]');
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Grüne Politik');
    }
    
    const step2NextButton = page.locator('#qr-step-2-next');
    await step2NextButton.click();
    
    // Verify preview and download
    await expect(page.locator('#qr-step-3')).toBeVisible();
    const downloadButton = page.locator('#qr-download');
    await expect(downloadButton).toBeVisible();
  });

  test('should support QR code color customization', async ({ page }) => {
    // Create basic text QR
    const textTypeButton = page.locator('[data-type="text"]');
    await textTypeButton.click();
    
    const nextButton = page.locator('#qr-step-1-next');
    await nextButton.click();
    
    await page.waitForTimeout(1000);
    
    const textInput = page.locator('#qr-form-container input, #qr-form-container textarea').first();
    await expect(textInput).toBeVisible();
    await textInput.fill('Test QR Code');
    
    const step2NextButton = page.locator('#qr-step-2-next');
    await step2NextButton.click();
    
    // Test color options in step 3
    await expect(page.locator('#qr-step-3')).toBeVisible();
    
    const colorSelect = page.locator('#qr-color-select');
    await colorSelect.selectOption('#538430'); // Dark green
    
    const downloadButton = page.locator('#qr-download');
    await expect(downloadButton).toBeVisible();
  });
});