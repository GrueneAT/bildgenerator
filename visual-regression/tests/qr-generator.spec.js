import { test, expect } from '@playwright/test';
import { setupTestEnvironment, GENERATE_REFERENCE_MODE, REFERENCE_DIR, COMPARISON_DIR } from './test-utils.js';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Setup QR test environment and navigate to QR wizard
 * @param {import('@playwright/test').Page} page 
 */
async function setupQRTest(page) {
  await setupTestEnvironment(page);
  
  // Navigate to QR Code tab
  await page.click('#tab-qrcode');
  await page.waitForTimeout(3000);
  
  // Ensure QR wizard is initialized
  await page.waitForSelector('#qr-step-1', { state: 'visible' });
}

/**
 * Complete QR generation workflow and navigate to download step
 * @param {import('@playwright/test').Page} page 
 * @param {string} type - QR type (url, text, email, vcard)
 * @param {object} data - QR data content
 * @param {object} colors - Optional color configuration
 */
async function completeQRWorkflow(page, type, data, colors = null) {
  // Step 1: Select QR type
  await page.click(`button[data-type="${type}"]`);
  await page.waitForTimeout(500);
  
  // Proceed to step 2
  await page.click('#qr-step-1-next');
  await page.waitForTimeout(2000);
  
  // Step 2: Fill data based on type
  switch (type) {
    case 'url':
      await page.fill('#qr-url-input', data.url);
      break;
    case 'text':
      await page.fill('#qr-text-input', data.text);
      break;
    case 'email':
      await page.fill('#qr-email-address', data.email);
      if (data.subject) {
        await page.fill('#qr-email-subject', data.subject);
      }
      if (data.body) {
        await page.fill('#qr-email-body', data.body);
      }
      break;
    case 'vcard':
      if (data.title) await page.fill('#qr-vcard-title', data.title);
      if (data.firstName) await page.fill('#qr-vcard-firstname', data.firstName);
      if (data.lastName) await page.fill('#qr-vcard-lastname', data.lastName);
      if (data.phone) await page.fill('#qr-vcard-phone', data.phone);
      if (data.email) await page.fill('#qr-vcard-email', data.email);
      if (data.address) await page.fill('#qr-vcard-address', data.address);
      if (data.zip) await page.fill('#qr-vcard-zip', data.zip);
      if (data.city) await page.fill('#qr-vcard-city', data.city);
      if (data.website) await page.fill('#qr-vcard-website', data.website);
      break;
  }
  
  await page.waitForTimeout(1000);
  
  // Proceed to step 3
  await page.click('#qr-step-2-next');
  await page.waitForTimeout(3000);
  
  // Step 3: Set colors if specified
  if (colors) {
    if (colors.foreground) {
      await page.selectOption('#qr-color-select', colors.foreground);
      await page.waitForTimeout(500);
    }
    if (colors.background) {
      await page.selectOption('#qr-background-select', colors.background);
      await page.waitForTimeout(500);
    }
  }
  
  // Wait for QR code generation
  await page.waitForSelector('.qr-preview-container canvas', { state: 'visible', timeout: 15000 });
  
  await page.waitForTimeout(2000);
  
  // QR wizard step 3 acts as the "download step" for QR codes
  // The page is now ready for pixelmatch comparison
}

/**
 * Compare QR code using pixelmatch - specialized for QR generator workflow
 * @param {import('@playwright/test').Page} page 
 * @param {string} testName - Name for the test/reference image
 */
async function compareQRWithReference(page, testName) {
  await page.waitForTimeout(2000);
  
  const referenceImagePath = path.join(REFERENCE_DIR, `${testName}-reference.png`);
  
  // Ensure we're at the QR download step (step 3)
  await page.waitForSelector('.qr-preview-container canvas', { state: 'visible' });
  await page.waitForSelector('#qr-download:visible', { timeout: 10000 });
  
  // Set up download listener
  const downloadPromise = page.waitForEvent('download');
  
  // Handle confirmation dialogs that may appear
  page.on('dialog', async dialog => {
    console.log(`Dialog detected: ${dialog.message()}`);
    await dialog.accept();
  });
  
  // Click the QR download button
  await page.click('#qr-download');
  
  // Wait for the download to complete
  const download = await downloadPromise;
  
  // Save the downloaded file to a temporary location
  const tempDownloadPath = path.join(COMPARISON_DIR, `temp-${testName}.png`);
  await download.saveAs(tempDownloadPath);

  // If in reference generation mode, copy the downloaded image as reference
  if (GENERATE_REFERENCE_MODE) {
    fs.copyFileSync(tempDownloadPath, referenceImagePath);
    console.log(`✓ QR Reference image generated: ${referenceImagePath}`);
    // Clean up temp file
    fs.unlinkSync(tempDownloadPath);
    return;
  }

  // Check if reference image exists
  if (!fs.existsSync(referenceImagePath)) {
    console.log(`❌ QR Reference image not found at ${referenceImagePath}. Run with GENERATE_REFERENCE=true to create it.`);
    throw new Error(`QR Reference image missing: ${testName}. Run: GENERATE_REFERENCE=true npx playwright test`);
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
      console.log(`❌ QR Image dimensions differ for ${testName}`);
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
      console.log(`✓ QR Images are pixel-perfect identical for ${testName}`);
    } else {
      console.log(`❌ QR Visual differences detected for ${testName}`);
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
    console.log(`❌ Error during QR image comparison for ${testName}: ${error.message}`);
    throw error;
  }
  
  // Verify that the downloaded QR image is valid and has content
  const downloadedImg = PNG.sync.read(fs.readFileSync(comparisonImagePath));
  expect(downloadedImg.width).toBeGreaterThan(100); // Reasonable minimum size for QR
  expect(downloadedImg.height).toBeGreaterThan(100);
  
  console.log(`✓ QR ${testName} comparison completed - Image dimensions: ${downloadedImg.width}x${downloadedImg.height}`);
}

test.describe('Visual Regression - QR Generator with Pixelmatch', () => {
  test.beforeEach(async ({ page }) => {
    // Basic setup is handled in setupQRTest for each test
  });

  // Basic QR Type Tests
  test('QR Generator - URL QR Code', async ({ page }) => {
    console.log('Testing URL QR code generation...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at/test-url-qr' };
    await completeQRWorkflow(page, 'url', data);
    
    await compareQRWithReference(page, 'qr-url');
  });

  test('QR Generator - Text QR Code', async ({ page }) => {
    console.log('Testing text QR code generation...');
    
    await setupQRTest(page);
    
    const data = { text: 'GRÜNE' };
    await completeQRWorkflow(page, 'text', data);
    
    await compareQRWithReference(page, 'qr-text');
  });

  test('QR Generator - Long URL QR Code', async ({ page }) => {
    console.log('Testing long URL QR code generation...');
    
    await setupQRTest(page);
    
    const data = { 
      url: 'https://gruene.at/lange-url?param1=wert1&param2=wert2' 
    };
    await completeQRWorkflow(page, 'url', data);
    
    await compareQRWithReference(page, 'qr-long-url');
  });

  test('QR Generator - Short URL QR Code', async ({ page }) => {
    console.log('Testing short URL QR code generation...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at' };
    await completeQRWorkflow(page, 'url', data);
    
    await compareQRWithReference(page, 'qr-short-url');
  });

  test('QR Generator - Minimal Text QR Code', async ({ page }) => {
    console.log('Testing minimal text QR code generation...');
    
    await setupQRTest(page);
    
    const data = { text: 'GRÜNE' };
    await completeQRWorkflow(page, 'text', data);
    
    await compareQRWithReference(page, 'qr-minimal-text');
  });

  // Color Combination Tests - covering all foreground and background colors
  test('QR Generator - Black on White (Classic)', async ({ page }) => {
    console.log('Testing black QR on white background...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at/black-white' };
    const colors = { foreground: '#000000', background: '#FFFFFF' };
    await completeQRWorkflow(page, 'url', data, colors);
    
    await compareQRWithReference(page, 'qr-black-white');
  });

  test('QR Generator - Dark Green on White (GRÜNE Brand)', async ({ page }) => {
    console.log('Testing dark green QR on white background...');
    
    await setupQRTest(page);
    
    const data = { text: 'Test' };
    const colors = { foreground: '#538430', background: '#FFFFFF' };
    await completeQRWorkflow(page, 'text', data, colors);
    
    await compareQRWithReference(page, 'qr-darkgreen-white');
  });

  test('QR Generator - Light Green on Black (High Contrast)', async ({ page }) => {
    console.log('Testing light green QR on black background...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at/light-green-style' };
    const colors = { foreground: '#82B624', background: '#000000' };
    await completeQRWorkflow(page, 'url', data, colors);
    
    await compareQRWithReference(page, 'qr-lightgreen-black');
  });

  test('QR Generator - Yellow on Black (Bold Style)', async ({ page }) => {
    console.log('Testing yellow QR on black background...');
    
    await setupQRTest(page);
    
    const data = { text: 'Zukunft' };
    const colors = { foreground: '#FFED00', background: '#000000' };
    await completeQRWorkflow(page, 'text', data, colors);
    
    await compareQRWithReference(page, 'qr-yellow-black');
  });

  test('QR Generator - Magenta on White (Creative Style)', async ({ page }) => {
    console.log('Testing magenta QR on white background...');
    
    await setupQRTest(page);
    
    const data = { text: 'Kreativ' };
    const colors = { foreground: '#E6007E', background: '#FFFFFF' };
    await completeQRWorkflow(page, 'text', data, colors);
    
    await compareQRWithReference(page, 'qr-magenta-white');
  });

  test('QR Generator - White on Black (Inverted)', async ({ page }) => {
    console.log('Testing white QR on black background...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at/white-black-style' };
    const colors = { foreground: '#FFFFFF', background: '#000000' };
    await completeQRWorkflow(page, 'url', data, colors);
    
    await compareQRWithReference(page, 'qr-white-black');
  });

  test('QR Generator - Dark Green on Transparent (Logo Overlay)', async ({ page }) => {
    console.log('Testing dark green QR on transparent background...');
    
    await setupQRTest(page);
    
    const data = { text: 'Style' };
    const colors = { foreground: '#538430', background: 'transparent' };
    await completeQRWorkflow(page, 'text', data, colors);
    
    await compareQRWithReference(page, 'qr-darkgreen-transparent');
  });

  test('QR Generator - Black on Transparent (Versatile)', async ({ page }) => {
    console.log('Testing black QR on transparent background...');
    
    await setupQRTest(page);
    
    const data = { url: 'https://gruene.at/transparent-style' };
    const colors = { foreground: '#000000', background: 'transparent' };
    await completeQRWorkflow(page, 'url', data, colors);
    
    await compareQRWithReference(page, 'qr-black-transparent');
  });

  test('QR Generator - Light Green on White (Soft Brand)', async ({ page }) => {
    console.log('Testing light green QR on white background...');
    
    await setupQRTest(page);
    
    const data = { text: 'Umwelt' };
    const colors = { foreground: '#82B624', background: '#FFFFFF' };
    await completeQRWorkflow(page, 'text', data, colors);
    
    await compareQRWithReference(page, 'qr-lightgreen-white');
  });

  test('QR Generator - Yellow on Transparent (Bright Overlay)', async ({ page }) => {
    console.log('Testing yellow QR on transparent background...');

    await setupQRTest(page);

    const data = { url: 'https://gruene.at/yellow-transparent' };
    const colors = { foreground: '#FFED00', background: 'transparent' };
    await completeQRWorkflow(page, 'url', data, colors);

    await compareQRWithReference(page, 'qr-yellow-transparent');
  });

  // Transparency Validation Tests - verify PNG alpha channel is actually transparent
  test('QR Generator - Transparency Validation - Verify transparent background has alpha channel', async ({ page }) => {
    console.log('Validating transparent background produces actual transparency in PNG...');

    await setupQRTest(page);

    const data = { url: 'https://gruene.at/transparency-test' };
    const colors = { foreground: '#000000', background: 'transparent' };
    await completeQRWorkflow(page, 'url', data, colors);

    // Wait for QR preview to be ready
    await page.waitForSelector('.qr-preview-container canvas', { state: 'visible' });
    await page.waitForSelector('#qr-download:visible', { timeout: 10000 });

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Handle confirmation dialogs
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Click the QR download button
    await page.click('#qr-download');

    // Wait for the download to complete
    const download = await downloadPromise;

    // Save the downloaded file
    const tempDownloadPath = path.join(COMPARISON_DIR, 'temp-transparency-validation.png');
    await download.saveAs(tempDownloadPath);

    // Read the PNG and verify it has transparent pixels
    const pngImage = PNG.sync.read(fs.readFileSync(tempDownloadPath));

    // Count transparent pixels (alpha = 0)
    let transparentPixelCount = 0;
    let opaquePixelCount = 0;
    const totalPixels = pngImage.width * pngImage.height;

    for (let i = 0; i < pngImage.data.length; i += 4) {
      const alpha = pngImage.data[i + 3];
      if (alpha === 0) {
        transparentPixelCount++;
      } else if (alpha === 255) {
        opaquePixelCount++;
      }
    }

    const transparentPercentage = (transparentPixelCount / totalPixels) * 100;
    const opaquePercentage = (opaquePixelCount / totalPixels) * 100;

    console.log(`Image dimensions: ${pngImage.width}x${pngImage.height}`);
    console.log(`Transparent pixels: ${transparentPixelCount} (${transparentPercentage.toFixed(2)}%)`);
    console.log(`Opaque pixels: ${opaquePixelCount} (${opaquePercentage.toFixed(2)}%)`);

    // Clean up temp file
    fs.unlinkSync(tempDownloadPath);

    // CRITICAL ASSERTION: Verify that the image has significant transparent area
    // QR codes have roughly 40-50% white/transparent area depending on data density
    // We expect at least 40% of pixels to be transparent for a valid transparent QR code
    expect(transparentPercentage).toBeGreaterThan(40);

    // Verify we also have opaque pixels (the QR code modules)
    expect(opaquePixelCount).toBeGreaterThan(0);

    console.log('✓ Transparency validation passed - PNG has actual transparent pixels');
  });

  test('QR Generator - Transparency Validation - Compare white vs transparent backgrounds', async ({ page }) => {
    console.log('Comparing white background vs transparent background pixel data...');

    // First, generate QR with WHITE background
    await setupQRTest(page);
    const data = { url: 'https://gruene.at/compare-test' };
    const whiteColors = { foreground: '#000000', background: '#FFFFFF' };
    await completeQRWorkflow(page, 'url', data, whiteColors);

    await page.waitForSelector('.qr-preview-container canvas', { state: 'visible' });
    await page.waitForSelector('#qr-download:visible', { timeout: 10000 });

    // Download white background QR
    let downloadPromise = page.waitForEvent('download');
    page.on('dialog', async dialog => await dialog.accept());
    await page.click('#qr-download');
    let download = await downloadPromise;

    const whiteBgPath = path.join(COMPARISON_DIR, 'temp-white-bg-test.png');
    await download.saveAs(whiteBgPath);

    // Read white background PNG
    const whitePng = PNG.sync.read(fs.readFileSync(whiteBgPath));

    // Count transparent pixels in white background version
    let whiteTransparentCount = 0;
    for (let i = 0; i < whitePng.data.length; i += 4) {
      if (whitePng.data[i + 3] === 0) {
        whiteTransparentCount++;
      }
    }

    // Fresh page load to generate QR with TRANSPARENT background
    await setupQRTest(page);
    const transparentColors = { foreground: '#000000', background: 'transparent' };
    await completeQRWorkflow(page, 'url', data, transparentColors);

    await page.waitForSelector('.qr-preview-container canvas', { state: 'visible' });
    await page.waitForSelector('#qr-download:visible', { timeout: 10000 });

    // Download transparent background QR
    downloadPromise = page.waitForEvent('download');
    await page.click('#qr-download');
    download = await downloadPromise;

    const transparentBgPath = path.join(COMPARISON_DIR, 'temp-transparent-bg-test.png');
    await download.saveAs(transparentBgPath);

    // Read transparent background PNG
    const transparentPng = PNG.sync.read(fs.readFileSync(transparentBgPath));

    // Count transparent pixels in transparent background version
    let transparentBgTransparentCount = 0;
    for (let i = 0; i < transparentPng.data.length; i += 4) {
      if (transparentPng.data[i + 3] === 0) {
        transparentBgTransparentCount++;
      }
    }

    // Clean up temp files
    fs.unlinkSync(whiteBgPath);
    fs.unlinkSync(transparentBgPath);

    console.log(`White background - Transparent pixels: ${whiteTransparentCount}`);
    console.log(`Transparent background - Transparent pixels: ${transparentBgTransparentCount}`);

    // CRITICAL ASSERTION: Transparent background version must have significantly more transparent pixels
    // White background should have ~0 transparent pixels
    // Transparent background should have many transparent pixels (the white area converted to transparent)
    expect(whiteTransparentCount).toBeLessThan(1000); // White BG should have very few/no transparent pixels
    expect(transparentBgTransparentCount).toBeGreaterThan(100000); // Transparent BG should have many transparent pixels
    expect(transparentBgTransparentCount).toBeGreaterThan(whiteTransparentCount * 100); // Should be dramatically more

    console.log('✓ Transparency comparison passed - Transparent background has significantly more transparent pixels than white background');
  });
});