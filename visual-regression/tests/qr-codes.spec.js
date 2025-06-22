import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - QR Codes', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('QR Code Black Color - Standard black QR code', async ({ page }) => {
    console.log('Testing black QR code...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add black QR code
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    await page.fill('#qr-text', 'https://gruene.at/test-black');
    await page.selectOption('#qr-color', '#000000');
    await page.click('#add-qr-code');
    await page.waitForTimeout(3000);

    await compareWithReference(page, 'qr-code-black');
  });

  test('QR Code Green Color - Brand green QR code', async ({ page }) => {
    console.log('Testing green QR code...');

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    // Add green QR code
    await page.click('button[onclick="toggleSection(\'elements-section\')"]');
    await page.waitForTimeout(500);
    await page.click('#show-qr-section');
    await page.waitForTimeout(500);
    await page.fill('#qr-text', 'https://gruene.at/test-green');
    await page.selectOption('#qr-color', '#538430');
    await page.click('#add-qr-code');
    await page.waitForTimeout(3000);

    await compareWithReference(page, 'qr-code-green');
  });
});