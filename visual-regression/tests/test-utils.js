import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { expect } from '@playwright/test';

export const REFERENCE_DIR = 'visual-regression/reference-images';
export const COMPARISON_DIR = 'visual-regression/comparison-results';

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
  
  // Wait for logo selection to be available and select the first available logo
  await page.waitForTimeout(2000);
  
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
  
  // If no logo was selected, we might need to handle this differently
  // For now, let's try to proceed
  await page.click('#step-1-next');
  await page.waitForTimeout(1000);
}

/**
 * Compare current canvas state with reference image
 * @param {import('@playwright/test').Page} page 
 * @param {string} testName - Name for the test/reference image
 */
export async function compareWithReference(page, testName) {
  await page.waitForTimeout(2000);
  
  const referenceImagePath = path.join(REFERENCE_DIR, `${testName}-reference.png`);
  
  // Check if reference image exists
  if (!fs.existsSync(referenceImagePath)) {
    console.log(`Reference image not found at ${referenceImagePath}. Skipping comparison.`);
    test.skip();
    return;
  }

  // Capture current image
  const canvasDataUrl = await page.evaluate(() => {
    return canvas.toDataURL('image/png', 1.0);
  });

  // Save comparison image
  const comparisonImagePath = path.join(COMPARISON_DIR, `${testName}-comparison.png`);
  const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(comparisonImagePath, base64Data, 'base64');

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
      
      // Fail if difference is above acceptable threshold (0.1% for high precision)
      expect(diffPercentage).toBeLessThan(0.1);
    }
  } catch (error) {
    console.log(`❌ Error during image comparison for ${testName}: ${error.message}`);
    throw error;
  }
  
  // Verify basic element structure
  const elementCount = await page.evaluate(() => {
    const objects = canvas.getObjects();
    return {
      total: objects.length,
      texts: objects.filter(obj => obj.type === 'text').length,
      images: objects.filter(obj => obj.type === 'image').length,
      circles: objects.filter(obj => obj.type === 'circle').length
    };
  });
  
  expect(elementCount.total).toBeGreaterThan(2);
  console.log(`✓ ${testName} comparison completed - ${elementCount.total} elements verified`);
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
  
  // Reduced timeout for faster testing
  await page.waitForTimeout(1000);
}