import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, compareWithReference, waitForWizardStep, navigateToStep } from './test-utils.js';

test.describe('Visual Regression - Wizard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Wizard Step 1 - Template and Logo Selection', async ({ page }) => {
    console.log('Testing wizard step 1...');

    // Wait for initial step 1 to be active
    await waitForWizardStep(page, 1);

    // Select template
    await page.selectOption('#canvas-template', 'post_45_border');
    await page.waitForTimeout(2000);

    // Check template selection worked
    const templateValue = await page.evaluate(() => {
      return document.getElementById('canvas-template').value;
    });
    expect(templateValue).toBe('post_45_border');

    // Wait for logos to be loaded and select one
    await page.waitForFunction(() => {
      const logoSelect = document.getElementById('logo-selection');
      return logoSelect && logoSelect.options.length > 1;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const logoSelect = document.getElementById('logo-selection');
      if (logoSelect && logoSelect.options.length > 1) {
        logoSelect.value = logoSelect.options[1].value;
        logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(2000);

    await compareWithReference(page, 'wizard-step-1');
  });

  test('Wizard Step 2 - Content Upload', async ({ page }) => {
    console.log('Testing wizard step 2...');

    await setupBasicTemplate(page);
    
    // We should now be on step 2 automatically after setupBasicTemplate
    await waitForWizardStep(page, 2);

    await compareWithReference(page, 'wizard-step-2');
  });

  test('Wizard Step 3 - Content Editing', async ({ page }) => {
    console.log('Testing wizard step 3...');

    await setupBasicTemplate(page);
    
    // Navigate to step 3
    await navigateToStep(page, 2, 3);

    await compareWithReference(page, 'wizard-step-3');
  });

  test('Wizard Step 4 - Download', async ({ page }) => {
    console.log('Testing wizard step 4...');

    await setupBasicTemplate(page);
    
    // Navigate to step 4
    await navigateToStep(page, 2, 4);

    await compareWithReference(page, 'wizard-step-4');
  });

  test('Wizard Back Navigation - Step 4 to Step 3', async ({ page }) => {
    console.log('Testing wizard back navigation...');

    await setupBasicTemplate(page);
    
    // Go to step 4 then back to step 3
    await navigateToStep(page, 2, 4);
    await navigateToStep(page, 4, 3);

    await compareWithReference(page, 'wizard-back-navigation');
  });

  test('Wizard Progress Visual State - Basic wizard progression', async ({ page }) => {
    console.log('Testing wizard progress visual state...');

    // Start with basic template setup
    await setupBasicTemplate(page);
    
    // We should now be on step 2 - capture this state
    await waitForWizardStep(page, 2);

    await compareWithReference(page, 'wizard-progress-indicators');
  });
});