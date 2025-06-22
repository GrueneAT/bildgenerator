import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

test.describe('Visual Regression Testing', () => {
  const REFERENCE_DIR = 'e2e-regression-source';
  const COMPARISON_DIR = 'e2e-comparison-results';
  
  test.beforeEach(async ({ page }) => {
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
  });

  test('Basic Layout - Compare template and logo rendering', async ({ page }) => {
    console.log('Testing basic layout...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    // Capture canvas in step 3 before going to step 4
    await compareWithReference(page, 'basic-layout');
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

  // Helper functions
  async function setupBasicTemplate(page) {
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(2000);
    
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

  async function compareWithReference(page, testName) {
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
});