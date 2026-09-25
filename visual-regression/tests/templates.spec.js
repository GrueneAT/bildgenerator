import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, navigateToStep, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  // Social Media Templates
  test('Template Feed-Post 4:5 - Test feed post layout 1080x1350', async ({ page }) => {
    console.log('Testing feed post 4:5 template...');
    await setupBasicTemplate(page, 'feed_post_45');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-feed-post-45');
  });

  test('Template Story Format - Test vertical story layout', async ({ page }) => {
    console.log('Testing story template...');

    await setupBasicTemplate(page, 'story');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-story');
  });

  test('Template Event Format - Test event layout', async ({ page }) => {
    console.log('Testing event template...');

    await setupBasicTemplate(page, 'event');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-event');
  });

  test('Template Facebook Header - Test facebook header dimensions', async ({ page }) => {
    console.log('Testing facebook header template...');

    await setupBasicTemplate(page, 'facebook_header');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-facebook-header');
  });

  // Website Templates
  test('Template Artikelbild 2:3 - Test article image layout 1080x1620', async ({ page }) => {
    console.log('Testing article image 2:3 template...');

    await setupBasicTemplate(page, 'artikel_23');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'template-artikel-23');
  });

  // Print Templates - A4 Format
  test('Template A4 Portrait - Test A4 poster layout', async ({ page }) => {
    console.log('Testing A4 portrait template...');

    await setupBasicTemplate(page, 'a4');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a4-portrait');
  });

  test('Template A4 Landscape - Test A4 landscape layout', async ({ page }) => {
    console.log('Testing A4 landscape template...');

    await setupBasicTemplate(page, 'a4_quer');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a4-landscape');
  });

  // Print Templates - A5 Format
  test('Template A5 Portrait - Test A5 flyer layout', async ({ page }) => {
    console.log('Testing A5 portrait template...');

    await setupBasicTemplate(page, 'a5');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a5-portrait');
  });

  test('Template A5 Landscape - Test A5 landscape layout', async ({ page }) => {
    console.log('Testing A5 landscape template...');

    await setupBasicTemplate(page, 'a5_quer');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    
    await compareWithReference(page, 'template-a5-landscape');
  });

  // Print Templates - A6 Format
  test('Template A6 Portrait - Test A6 flyer layout', async ({ page }) => {
    console.log('Testing A6 portrait template...');
    await setupBasicTemplate(page, 'a6');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-portrait');
  });

  test('Template A6 Landscape - Test A6 landscape layout', async ({ page }) => {
    console.log('Testing A6 landscape template...');
    await setupBasicTemplate(page, 'a6_quer');
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-landscape');
  });

  // Template Switching Test
  test('Template Switching - Test changing between templates', async ({ page }) => {
    console.log('Testing template switching...');

    // Establish one template, then switch to a differently shaped one: the
    // canvas has to be rebuilt at the new dimensions, and the logo has to be
    // repositioned for them. Capturing story straight away would only repeat
    // the story test above.
    await setupBasicTemplate(page, 'feed_post_45');

    // setupBasicTemplate leaves the wizard on step 2, where the template
    // select of step 1 is hidden and therefore not actionable. Go back for
    // the switch, the same way the switch-with-content test does.
    await navigateToStep(page, 2, 1);
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(2000);

    await navigateToStep(page, 1, 3);

    await compareWithReference(page, 'template-switching');
  });
});