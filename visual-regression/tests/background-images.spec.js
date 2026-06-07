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

  test('Cover Scaling - Wide image on portrait canvas leaves no gap', async ({ page }) => {
    console.log('Testing cover-scale on a portrait canvas with a wide image...');

    // Portrait feed canvas + a wide (landscape) background: the case that used
    // to leave green side gaps when the image was only height-fit. Cover-scaling
    // must fully cover the content rect on BOTH axes.
    await setupBasicTemplate(page, 'feed_post_45');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // A 1x1 green PNG declared as a wide 1600x400 image (4:1 landscape).
    const wideImageDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 1600, height: 400 });
    }, wideImageDataUrl);
    await page.waitForTimeout(2000);

    const cover = await page.evaluate(() => {
      if (typeof contentImage === 'undefined' || contentImage === null) return null;
      const sw = contentImage.getScaledWidth();
      const sh = contentImage.getScaledHeight();
      return {
        imgLeft: contentImage.left,
        imgTop: contentImage.top,
        imgRight: contentImage.left + sw,
        imgBottom: contentImage.top + sh,
        rectLeft: contentRect.left,
        rectTop: contentRect.top,
        rectRight: contentRect.left + contentRect.width,
        rectBottom: contentRect.top + contentRect.height,
        lockMovementX: contentImage.lockMovementX,
        lockMovementY: contentImage.lockMovementY,
      };
    });

    expect(cover).not.toBeNull();
    // The image must fully span the content rect on both axes — no gap anywhere.
    const EPS = 0.5;
    expect(cover.imgLeft).toBeLessThanOrEqual(cover.rectLeft + EPS);
    expect(cover.imgTop).toBeLessThanOrEqual(cover.rectTop + EPS);
    expect(cover.imgRight).toBeGreaterThanOrEqual(cover.rectRight - EPS);
    expect(cover.imgBottom).toBeGreaterThanOrEqual(cover.rectBottom - EPS);
    // Wide image overflows horizontally on a portrait rect -> X pannable, Y locked.
    expect(cover.lockMovementX).toBe(false);
    expect(cover.lockMovementY).toBe(true);
  });

  test('Cover Scaling - Tall image on landscape canvas leaves no gap', async ({ page }) => {
    console.log('Testing cover-scale on a landscape canvas with a tall image...');

    // Landscape event header + a tall (portrait) background: the mirror case.
    await setupBasicTemplate(page, 'event');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    const tallImageDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await page.evaluate((dataUrl) => {
      processMeme({ url: dataUrl, width: 400, height: 1600 });
    }, tallImageDataUrl);
    await page.waitForTimeout(2000);

    const cover = await page.evaluate(() => {
      if (typeof contentImage === 'undefined' || contentImage === null) return null;
      const sw = contentImage.getScaledWidth();
      const sh = contentImage.getScaledHeight();
      return {
        gapLeft: contentImage.left - contentRect.left,
        gapTop: contentImage.top - contentRect.top,
        coverRight: contentImage.left + sw - (contentRect.left + contentRect.width),
        coverBottom: contentImage.top + sh - (contentRect.top + contentRect.height),
        lockMovementX: contentImage.lockMovementX,
        lockMovementY: contentImage.lockMovementY,
      };
    });

    expect(cover).not.toBeNull();
    const EPS = 0.5;
    // No gap: image edges at or beyond the rect edges.
    expect(cover.gapLeft).toBeLessThanOrEqual(EPS);
    expect(cover.gapTop).toBeLessThanOrEqual(EPS);
    expect(cover.coverRight).toBeGreaterThanOrEqual(-EPS);
    expect(cover.coverBottom).toBeGreaterThanOrEqual(-EPS);
    // Tall image overflows vertically on a landscape rect -> Y pannable, X locked.
    expect(cover.lockMovementX).toBe(true);
    expect(cover.lockMovementY).toBe(false);
  });
});