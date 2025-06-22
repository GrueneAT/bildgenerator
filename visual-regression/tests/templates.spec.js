import { test } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Template Story Format - Test vertical story layout', async ({ page }) => {
    console.log('Testing story template...');

    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-story');
  });

  test('Template Event Format - Test event layout', async ({ page }) => {
    console.log('Testing event template...');

    await page.selectOption('#canvas-template', 'event');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-event');
  });
});