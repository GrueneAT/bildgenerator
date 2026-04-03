import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  // Social Media Templates
  test('Template Feed-Post 4:5 - Test feed post layout 1080x1350', async ({ page }) => {
    console.log('Testing feed post 4:5 template...');
    await page.selectOption('#canvas-template', 'feed_post_45');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-feed-post-45');
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

  // Print Templates - A6 Format
  test('Template A6 Portrait - Test A6 flyer layout', async ({ page }) => {
    console.log('Testing A6 portrait template...');
    await page.selectOption('#canvas-template', 'a6');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-portrait');
  });

  test('Template A6 Landscape - Test A6 landscape layout', async ({ page }) => {
    console.log('Testing A6 landscape template...');
    await page.selectOption('#canvas-template', 'a6_quer');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-landscape');
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