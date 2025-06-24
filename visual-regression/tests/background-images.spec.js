import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';
import fs from 'fs';
import path from 'path';

test.describe('Visual Regression - Background Images', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Custom JPEG Upload - Upload and render JPEG background image', async ({ page }) => {
    console.log('Testing JPEG background upload...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Create a test JPEG image data URL (simple 100x100 red square)
    const jpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wAA/9k=';

    // Simulate file upload by directly calling processMeme
    await page.evaluate((dataUrl) => {
      const imgInfo = {
        url: dataUrl,
        width: 100,
        height: 100
      };
      processMeme(imgInfo);
    }, jpegDataUrl);

    await page.waitForTimeout(2000);

    // Verify background image was added
    const hasBackgroundImage = await page.evaluate(() => {
      return typeof contentImage !== 'undefined' && contentImage !== null;
    });
    expect(hasBackgroundImage).toBe(true);

    await compareWithReference(page, 'background-jpeg-upload');
  });

  test('Custom PNG Upload - Upload and render PNG background image', async ({ page }) => {
    console.log('Testing PNG background upload...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Create a test PNG image data URL (simple 100x100 green square with transparency)
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // Simulate file upload by directly calling processMeme
    await page.evaluate((dataUrl) => {
      const imgInfo = {
        url: dataUrl,
        width: 100,
        height: 100
      };
      processMeme(imgInfo);
    }, pngDataUrl);

    await page.waitForTimeout(2000);

    // Verify background image was added
    const hasBackgroundImage = await page.evaluate(() => {
      return typeof contentImage !== 'undefined' && contentImage !== null;
    });
    expect(hasBackgroundImage).toBe(true);

    await compareWithReference(page, 'background-png-upload');
  });

  test('Background Image Scaling - Test auto-fit to content rectangle', async ({ page }) => {
    console.log('Testing background image scaling...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Upload a larger test image
    const largeImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    await page.evaluate((dataUrl) => {
      const imgInfo = {
        url: dataUrl,
        width: 500,
        height: 500
      };
      processMeme(imgInfo);
    }, largeImageDataUrl);

    await page.waitForTimeout(2000);

    // Verify image scaling and positioning
    const imageProperties = await page.evaluate(() => {
      if (typeof contentImage !== 'undefined' && contentImage !== null) {
        return {
          scaleX: contentImage.scaleX,
          scaleY: contentImage.scaleY,
          left: contentImage.left,
          top: contentImage.top,
          lockMovementX: contentImage.lockMovementX,
          lockMovementY: contentImage.lockMovementY
        };
      }
      return null;
    });

    expect(imageProperties).not.toBeNull();
    expect(imageProperties.scaleX).toBeGreaterThan(0);
    expect(imageProperties.scaleY).toBeGreaterThan(0);

    await compareWithReference(page, 'background-image-scaling');
  });

  test('Background Image Clipping - Test proper boundary handling', async ({ page }) => {
    console.log('Testing background image clipping...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Upload background image
    const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    await page.evaluate((dataUrl) => {
      const imgInfo = {
        url: dataUrl,
        width: 200,
        height: 200
      };
      processMeme(imgInfo);
    }, testImageDataUrl);

    await page.waitForTimeout(2000);

    // Add text to ensure proper layering
    await page.click('button[onclick="toggleSection(\'text-section\')"]');
    await page.waitForTimeout(500);
    await page.fill('#text', 'TEXT ÜBER BILD');
    await page.click('#add-text');
    await page.waitForTimeout(1500);

    // Verify content image exists
    const hasContentImage = await page.evaluate(() => {
      return typeof contentImage !== 'undefined' && contentImage !== null;
    });

    expect(hasContentImage).toBe(true);

    await compareWithReference(page, 'background-image-clipping');
  });
});