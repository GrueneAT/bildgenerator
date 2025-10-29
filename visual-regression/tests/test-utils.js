import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { expect } from '@playwright/test';

export const REFERENCE_DIR = 'visual-regression/reference-images';
export const COMPARISON_DIR = 'visual-regression/comparison-results';

// Set to true to generate reference images instead of comparing
export const GENERATE_REFERENCE_MODE = process.env.GENERATE_REFERENCE === 'true';

/**
 * Setup basic template with logo selection
 * @param {import('@playwright/test').Page} page 
 * @param {string} templateType - Template type to select
 */
export async function setupBasicTemplate(page, templateType = 'post') {
  // Only set template if it's not already set
  const currentTemplate = await page.evaluate(() => {
    const templateSelect = document.getElementById('canvas-template');
    return templateSelect ? templateSelect.value : '';
  });
  
  if (!currentTemplate || currentTemplate !== templateType) {
    await page.selectOption('#canvas-template', templateType);
    await page.waitForTimeout(2000);
  }
  
  // Wait for canvas and logos to be properly initialized
  await page.waitForFunction(() => {
    return typeof canvas !== 'undefined' && 
           canvas !== null && 
           document.getElementById('logo-selection') &&
           document.getElementById('logo-selection').options.length > 1;
  }, { timeout: 30000 });
  
  // Check if we have a default logo available and select it
  await page.evaluate(() => {
    const logoSelect = document.getElementById('logo-selection');
    if (logoSelect && logoSelect.options.length > 1) {
      // Select the first non-empty option
      for (let i = 1; i < logoSelect.options.length; i++) {
        if (logoSelect.options[i].value && logoSelect.options[i].value.trim()) {
          logoSelect.value = logoSelect.options[i].value;
          logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return logoSelect.options[i].value;
        }
      }
    }
    return null;
  });
  
  await page.waitForTimeout(2000);
  
  // Wait for step 1 next button to be visible and enabled
  await page.waitForSelector('#step-1-next:visible', { timeout: 10000 });
  await page.click('#step-1-next');
  await page.waitForTimeout(1000);
}

/**
 * Wait for a specific wizard step to be active
 * @param {import('@playwright/test').Page} page 
 * @param {number} stepNumber - Step number (1-4)
 */
export async function waitForWizardStep(page, stepNumber) {
  await page.waitForFunction((step) => {
    const stepElement = document.getElementById(`step-${step}`);
    return stepElement && !stepElement.classList.contains('hidden');
  }, stepNumber, { timeout: 10000 });
}

/**
 * Navigate to a specific wizard step safely
 * @param {import('@playwright/test').Page} page 
 * @param {number} fromStep - Current step
 * @param {number} toStep - Target step
 */
export async function navigateToStep(page, fromStep, toStep) {
  if (fromStep === toStep) return;
  
  if (fromStep < toStep) {
    // Moving forward
    for (let step = fromStep; step < toStep; step++) {
      const nextButtonId = `#step-${step}-next`;
      await page.waitForSelector(`${nextButtonId}:visible`, { timeout: 10000 });
      await page.click(nextButtonId);
      await waitForWizardStep(page, step + 1);
    }
  } else {
    // Moving backward
    for (let step = fromStep; step > toStep; step--) {
      const backButtonId = `#step-${step}-back`;
      await page.waitForSelector(`${backButtonId}:visible`, { timeout: 10000 });
      await page.click(backButtonId);
      await waitForWizardStep(page, step - 1);
    }
  }
}

/**
 * Navigate to the download step (step 4) from any current step
 * @param {import('@playwright/test').Page} page 
 */
export async function navigateToDownloadStep(page) {
  // Determine current step
  const currentStep = await page.evaluate(() => {
    for (let i = 1; i <= 4; i++) {
      const stepElement = document.getElementById(`step-${i}`);
      if (stepElement && !stepElement.classList.contains('hidden')) {
        return i;
      }
    }
    return 1; // Default to step 1 if can't determine
  });
  
  // Navigate to step 4
  await navigateToStep(page, currentStep, 4);
  
  // Wait for step 4 to be fully visible
  await waitForWizardStep(page, 4);
  await page.waitForSelector('#generate-meme:visible', { timeout: 10000 });
}

/**
 * Compare current canvas state with reference image using download mechanism
 * @param {import('@playwright/test').Page} page 
 * @param {string} testName - Name for the test/reference image
 */
export async function compareWithReference(page, testName) {
  await page.waitForTimeout(2000);

  // Ensure fonts are loaded before taking screenshot
  // This prevents font loading race conditions in CI
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Additional delay for fonts to be fully rendered on canvas
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  const referenceImagePath = path.join(REFERENCE_DIR, `${testName}-reference.png`);

  // Navigate to step 4 (download step) if not already there
  const isStep4Visible = await page.isVisible('#step-4:not(.hidden)');
  if (!isStep4Visible) {
    // Navigate through steps to reach download
    await navigateToDownloadStep(page);
  }
  
  // Set up download listener and dialog handlers
  const downloadPromise = page.waitForEvent('download');
  
  // Handle confirmation dialogs that may appear
  page.on('dialog', async dialog => {
    console.log(`Dialog detected: ${dialog.message()}`);
    await dialog.accept();
  });
  
  // Click the download button
  await page.click('#generate-meme');
  
  // Wait for the download to complete
  const download = await downloadPromise;
  
  // Save the downloaded file to a temporary location
  const tempDownloadPath = path.join(COMPARISON_DIR, `temp-${testName}.png`);
  await download.saveAs(tempDownloadPath);

  // If in reference generation mode, copy the downloaded image as reference
  if (GENERATE_REFERENCE_MODE) {
    fs.copyFileSync(tempDownloadPath, referenceImagePath);
    console.log(`✓ Reference image generated: ${referenceImagePath}`);
    // Clean up temp file
    fs.unlinkSync(tempDownloadPath);
    return;
  }

  // Check if reference image exists
  if (!fs.existsSync(referenceImagePath)) {
    console.log(`❌ Reference image not found at ${referenceImagePath}. Run with GENERATE_REFERENCE=true to create it.`);
    throw new Error(`Reference image missing: ${testName}. Run: GENERATE_REFERENCE=true npx playwright test`);
  }

  // Copy the downloaded file as comparison image
  const comparisonImagePath = path.join(COMPARISON_DIR, `${testName}-comparison.png`);
  fs.copyFileSync(tempDownloadPath, comparisonImagePath);
  
  // Clean up temp file
  fs.unlinkSync(tempDownloadPath);

  try {
    // Load reference and comparison images
    const referenceImg = PNG.sync.read(fs.readFileSync(referenceImagePath));
    const comparisonImg = PNG.sync.read(fs.readFileSync(comparisonImagePath));
    
    // Ensure images have the same dimensions
    if (referenceImg.width !== comparisonImg.width || referenceImg.height !== comparisonImg.height) {
      console.log(`❌ Image dimensions differ for ${testName}`);
      console.log(`Reference: ${referenceImg.width}x${referenceImg.height}`);
      console.log(`Comparison: ${comparisonImg.width}x${comparisonImg.height}`);
      expect(false).toBe(true); // Fail the test
      return;
    }

    // Create diff image
    const { width, height } = referenceImg;
    const diffImg = new PNG({ width, height });

    // Compare images with pixelmatch
    const threshold = 0.1; // Sensitivity threshold (0-1, lower = more sensitive)
    const diffPixels = pixelmatch(
      referenceImg.data,
      comparisonImg.data,
      diffImg.data,
      width,
      height,
      { threshold }
    );

    // Calculate percentage difference
    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    if (diffPixels === 0) {
      console.log(`✓ Images are pixel-perfect identical for ${testName}`);
    } else {
      console.log(`❌ Visual differences detected for ${testName}`);
      console.log(`Different pixels: ${diffPixels} (${diffPercentage.toFixed(2)}%)`);
      console.log(`Reference image: ${referenceImagePath}`);
      console.log(`Comparison image: ${comparisonImagePath}`);

      // Save diff image
      const diffImagePath = path.join(COMPARISON_DIR, `${testName}-diff.png`);
      fs.writeFileSync(diffImagePath, PNG.sync.write(diffImg));
      console.log(`Diff image created: ${diffImagePath}`);

      // Fail if difference is above acceptable threshold
      // 0.5% tolerance allows for font rendering differences across environments (CI vs local)
      // while still catching real visual regressions
      expect(diffPercentage).toBeLessThan(0.5);
    }
  } catch (error) {
    console.log(`❌ Error during image comparison for ${testName}: ${error.message}`);
    throw error;
  }
  
  // Verify that the downloaded image is valid and has content
  const downloadedImg = PNG.sync.read(fs.readFileSync(comparisonImagePath));
  expect(downloadedImg.width).toBeGreaterThan(100); // Reasonable minimum size
  expect(downloadedImg.height).toBeGreaterThan(100);
  
  console.log(`✓ ${testName} comparison completed - Image dimensions: ${downloadedImg.width}x${downloadedImg.height}`);
}

/**
 * Setup test environment with common beforeEach functionality
 * @param {import('@playwright/test').Page} page
 */
export async function setupTestEnvironment(page) {
  // Ensure directories exist
  if (!fs.existsSync(REFERENCE_DIR)) {
    fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMPARISON_DIR)) {
    fs.mkdirSync(COMPARISON_DIR, { recursive: true });
  }

  await page.goto('/');
  await expect(page).toHaveTitle(/Grüne|GRÜNE|Bildgenerator/i);

  // Wait for custom fonts to be fully loaded
  // This is critical for consistent visual testing across environments
  await page.waitForFunction(() => {
    return document.fonts.ready.then(() => true);
  }, { timeout: 30000 });

  // Verify Gotham Narrow fonts are loaded
  const fontsLoaded = await page.evaluate(async () => {
    // Wait for fonts to be ready
    await document.fonts.ready;

    // Check if key fonts are available
    const fonts = [
      '16px "Gotham Narrow Ultra Italic"',
      '16px "Gotham Narrow Book"',
      '16px "Gotham Narrow Bold"'
    ];

    const results = fonts.map(font => document.fonts.check(font));
    return {
      allLoaded: results.every(r => r === true),
      results: results,
      fonts: fonts
    };
  });

  if (!fontsLoaded.allLoaded) {
    console.warn('⚠️  Warning: Some fonts may not be fully loaded', fontsLoaded);
  }

  // Additional timeout to ensure fonts are rendered on canvas
  await page.waitForTimeout(1500);
}