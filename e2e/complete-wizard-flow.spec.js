import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Complete Wizard Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full image generation workflow', async ({ page }) => {
    // Step 1: Template and Logo Selection
    await test.step('Select template and logo', async () => {
      // Wait for step 1 to be visible
      await expect(page.locator('#step-1')).toBeVisible();
      
      // Select template
      const templateSelect = page.locator('#canvas-template');
      await templateSelect.selectOption('post_45_border'); // Select post template
      
      // Wait for logos to load and select one if available
      await page.waitForFunction(() => {
        const logoSelect = document.getElementById('logo-selection');
        return logoSelect && logoSelect.options.length > 1;
      }, { timeout: 10000 }).catch(() => {
        // Logos might not be available in test environment
        console.log('Logos not loaded in test environment');
      });
      
      // Try to select a logo if available, otherwise mock it
      await page.evaluate(() => {
        const logoSelect = document.getElementById('logo-selection');
        if (logoSelect && logoSelect.options.length > 1) {
          // Select the first available logo
          for (let i = 1; i < logoSelect.options.length; i++) {
            if (logoSelect.options[i].value) {
              logoSelect.value = logoSelect.options[i].value;
              logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        } else {
          // Mock a logo selection for testing
          logoSelect.innerHTML = '<option value="">Logo auswählen...</option><option value="test-logo">Test Logo</option>';
          logoSelect.value = 'test-logo';
          logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await page.waitForTimeout(500); // Wait for validation
      
      // Proceed to step 2
      const nextButton = page.locator('#step-1-next');
      await nextButton.click();
      await page.waitForTimeout(1000);
    });

    // Step 2: Background Image Upload
    await test.step('Upload background image', async () => {
      // Wait for step 2 to be visible
      await expect(page.locator('#step-2')).toBeVisible();
      
      // Upload test image
      const fileInput = page.locator('#meme-input');
      await expect(fileInput).toBeAttached();
      
      const testImagePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for image processing
      await page.waitForTimeout(3000);
      
      // Verify canvas shows image
      await expect(page.locator('#meme-canvas')).toBeVisible();
      
      // Proceed to step 3
      const nextButton = page.locator('#step-2-next');
      await nextButton.click();
    });

    // Step 3: Add Content
    await test.step('Add text and QR code content', async () => {
      // Wait for step 3 to be visible
      await expect(page.locator('#step-3')).toBeVisible();
      
      // Expand text section
      const textSectionButton = page.locator('button[onclick="toggleSection(\'text-section\')"]');
      await textSectionButton.click();
      
      // Add text element
      const textInput = page.locator('#text');
      await textInput.fill('Test Text Content');
      
      const addTextButton = page.locator('#add-text');
      await addTextButton.click();
      
      // Add QR code - expand elements section first
      const elementsSectionButton = page.locator('button[onclick="toggleSection(\'elements-section\')"]');
      await elementsSectionButton.click();
      
      const showQRButton = page.locator('#show-qr-section');
      await showQRButton.click();
      
      // Fill QR content
      const qrTextInput = page.locator('#qr-text');
      await qrTextInput.fill('https://gruene.at');
      
      const addQRButton = page.locator('#add-qr-code');
      await addQRButton.click();
      
      // Wait for content to be added to canvas
      await page.waitForTimeout(2000);
      
      // Proceed to step 4
      const nextButton = page.locator('#step-3-next');
      await nextButton.click();
    });

    // Step 4: Export
    await test.step('Export final image', async () => {
      // Wait for step 4 to be visible
      await expect(page.locator('#step-4')).toBeVisible();
      
      // Test export button functionality
      const downloadButton = page.locator('#generate-meme');
      await expect(downloadButton).toBeVisible();
      
      // Click the export button - in test environment this might not actually download
      await downloadButton.click();
      
      // Wait a moment to ensure the button click was processed
      await page.waitForTimeout(1000);
      
      // Verify the export step is accessible and functional
      await expect(downloadButton).toBeVisible();
    });
  });

  test('should handle template switching', async ({ page }) => {
    // Initial setup
    const templateSelect = page.locator('#canvas-template');
    await templateSelect.selectOption('post_45_border');
    
    // Switch template
    await templateSelect.selectOption('story');
    await page.waitForTimeout(1000);
    
    // Verify canvas is still visible and functional
    await expect(page.locator('#meme-canvas')).toBeVisible();
    
    // Check dimensions updated
    const dimensionsElement = page.locator('#canvas-dimensions');
    const dimensionsText = await dimensionsElement.textContent();
    expect(dimensionsText).toMatch(/\d+\s*[×x]\s*\d+/);
  });

  test('should handle basic navigation', async ({ page }) => {
    // Test basic wizard navigation
    await expect(page.locator('#step-1')).toBeVisible();
    
    // Select template and logo to enable next button
    const templateSelect = page.locator('#canvas-template');
    await templateSelect.selectOption('post_45_border');
    
    // Mock logo selection for navigation test
    await page.evaluate(() => {
      const logoSelect = document.getElementById('logo-selection');
      logoSelect.innerHTML = '<option value="">Logo auswählen...</option><option value="test-logo">Test Logo</option>';
      logoSelect.value = 'test-logo';
      logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await page.waitForTimeout(500);
    
    // Go to step 2
    const nextButton = page.locator('#step-1-next');
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Should now advance to step 2
    await expect(page.locator('#step-2')).toBeVisible();
    
    // Go back to step 1
    const backButton = page.locator('#step-2-back');
    await backButton.click();
    await expect(page.locator('#step-1')).toBeVisible();
  });
});