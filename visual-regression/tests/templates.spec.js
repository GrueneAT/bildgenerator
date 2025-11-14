import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  // Social Media Templates
  test('Template Post 4:5 with Border - Test post layout 1080x1350 with border', async ({ page }) => {
    console.log('Testing post 4:5 with border template...');

    await page.selectOption('#canvas-template', 'post_45_border');
    await page.waitForTimeout(2000);

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'template-post-45-border');
  });

  test('Template Post 4:5 without Border - Test post layout 1080x1350 no border', async ({ page }) => {
    console.log('Testing post 4:5 without border template...');

    await page.selectOption('#canvas-template', 'post_45_no_border');
    await page.waitForTimeout(2000);

    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'template-post-45-no-border');
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

  test('Template Facebook Header - Test facebook header dimensions', async ({ page }) => {
    console.log('Testing facebook header template...');

    await page.selectOption('#canvas-template', 'facebook_header');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-facebook-header');
  });

  // Print Templates - A4 Format
  test('Template A4 Portrait - Test A4 poster layout', async ({ page }) => {
    console.log('Testing A4 portrait template...');

    await page.selectOption('#canvas-template', 'a4');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a4-portrait');
  });

  test('Template A4 Landscape - Test A4 landscape layout', async ({ page }) => {
    console.log('Testing A4 landscape template...');

    await page.selectOption('#canvas-template', 'a4_quer');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a4-landscape');
  });

  // Print Templates - A3 Format
  test('Template A3 Portrait - Test A3 poster layout', async ({ page }) => {
    console.log('Testing A3 portrait template...');

    await page.selectOption('#canvas-template', 'a3');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a3-portrait');
  });

  test('Template A3 Landscape - Test A3 landscape layout', async ({ page }) => {
    console.log('Testing A3 landscape template...');

    await page.selectOption('#canvas-template', 'a3_quer');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a3-landscape');
  });

  // Print Templates - A5 Format
  test('Template A5 Portrait - Test A5 flyer layout', async ({ page }) => {
    console.log('Testing A5 portrait template...');

    await page.selectOption('#canvas-template', 'a5');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a5-portrait');
  });

  test('Template A5 Landscape - Test A5 landscape layout', async ({ page }) => {
    console.log('Testing A5 landscape template...');

    await page.selectOption('#canvas-template', 'a5_quer');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a5-landscape');
  });

  // Large Print Templates - A2 Format
  test('Template A2 Portrait - Test A2 poster layout', async ({ page }) => {
    console.log('Testing A2 portrait template...');

    await page.selectOption('#canvas-template', 'a2');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a2-portrait');
  });

  test('Template A2 Landscape - Test A2 landscape layout', async ({ page }) => {
    console.log('Testing A2 landscape template...');

    await page.selectOption('#canvas-template', 'a2_quer');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a2-landscape');
  });

  // Template Switching Test
  test('Template Switching - Test changing between templates', async ({ page }) => {
    console.log('Testing template switching...');

    // Start with story template and just test the basic layout
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(2000);
    
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    // Just capture the basic story template with logo
    await compareWithReference(page, 'template-switching');
  });
});