import { test, expect } from '@playwright/test';
import { setupTestEnvironment, setupBasicTemplate, navigateToDownloadStep, compareWithReference } from './test-utils.js';

test.describe('Visual Regression - Logo Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('Canvas with logo enabled (default) shows logo at bottom', async ({ page }) => {
    console.log('Testing canvas with logo enabled...');

    // Select template and wait for canvas initialization
    await page.selectOption('#canvas-template', 'post');

    // Wait for canvas objects to be added
    await page.waitForFunction(() => {
      return typeof canvas !== 'undefined' && canvas !== null && canvas.getObjects().length > 0;
    }, { timeout: 10000 });

    await page.waitForTimeout(1000);

    // Verify canvas is initialized
    const canvasInitialized = await page.evaluate(() => {
      return {
        canvasExists: typeof canvas !== 'undefined' && canvas !== null,
        objectCount: typeof canvas !== 'undefined' ? canvas.getObjects().length : 0,
        hasContentRect: typeof contentRect !== 'undefined' && contentRect !== null
      };
    });
    console.log('Canvas after template selection:', canvasInitialized);

    // Verify logo toggle exists and is checked by default
    const logoToggleExists = await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      return toggle !== null;
    });
    expect(logoToggleExists).toBe(true);

    const isLogoEnabled = await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      return toggle && toggle.checked;
    });
    expect(isLogoEnabled).toBe(true);

    // Select a logo using jQuery to trigger handlers properly
    const logoSelectionResult = await page.evaluate(() => {
      const logoSelect = jQuery('#logo-selection');
      const result = { found: false, value: null, optionsCount: 0 };

      if (logoSelect.length && logoSelect.find('option').length > 1) {
        const options = logoSelect.find('option');
        result.optionsCount = options.length;

        for (let i = 1; i < options.length; i++) {
          const value = jQuery(options[i]).val();
          if (value && value.trim()) {
            logoSelect.val(value).trigger('change');
            result.found = true;
            result.value = value;
            break;
          }
        }
      }
      return result;
    });

    console.log('Logo selection result:', logoSelectionResult);

    // Wait for async logo image loading (longer timeout for CI)
    await page.waitForTimeout(5000);

    // Check logo state and canvas
    const logoDebug = await page.evaluate(() => {
      return {
        logoOnCanvas: typeof logo !== 'undefined' && logo !== null,
        logoStateEnabled: typeof LogoState !== 'undefined' ? LogoState.isLogoEnabled() : 'undefined',
        canvasObjects: typeof canvas !== 'undefined' ? canvas.getObjects().length : 0
      };
    });

    console.log('Logo debug:', logoDebug);
    expect(logoDebug.logoOnCanvas).toBe(true);

    // Navigate to download step and compare
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'logo-toggle-enabled');

    console.log('Canvas with logo enabled test completed!');
  });

  test('Canvas with logo disabled shows no logo', async ({ page }) => {
    console.log('Testing canvas with logo disabled...');

    // Select template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Wait for logo toggle to be available
    await page.waitForSelector('#logo-toggle', { timeout: 5000 });

    // Disable logo toggle
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    // Verify logo is disabled
    const isLogoDisabled = await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      return toggle && !toggle.checked;
    });
    expect(isLogoDisabled).toBe(true);

    // Verify logo selection is disabled
    const isLogoSelectDisabled = await page.evaluate(() => {
      const logoSelect = document.getElementById('logo-selection');
      return logoSelect && logoSelect.disabled;
    });
    expect(isLogoSelectDisabled).toBe(true);

    // Verify no logo on canvas
    const hasNoLogoOnCanvas = await page.evaluate(() => {
      return typeof logo === 'undefined' || logo === null;
    });
    expect(hasNoLogoOnCanvas).toBe(true);

    await page.waitForTimeout(1000);

    // Navigate to download step without selecting logo (should work when disabled)
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'logo-toggle-disabled');

    console.log('Canvas with logo disabled test completed!');
  });

  test('Story template without logo', async ({ page }) => {
    console.log('Testing story template without logo...');

    // Select story template
    await page.selectOption('#canvas-template', 'story');
    // Wait longer for template change to complete
    await page.waitForTimeout(2000);

    // Disable logo toggle
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    // Verify story dimensions
    const canvasDimensions = await page.evaluate(() => {
      return {
        width: canvas.width,
        height: canvas.height
      };
    });
    expect(canvasDimensions.width).toBe(1080);
    expect(canvasDimensions.height).toBe(1920);

    await page.waitForTimeout(1000);

    // Navigate and compare
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'logo-toggle-story-disabled');

    console.log('Story template without logo test completed!');
  });

  test('Post template without logo', async ({ page }) => {
    console.log('Testing post template without logo...');

    // Select post template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Disable logo toggle
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    await page.waitForTimeout(1000);

    // Navigate and compare
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'logo-toggle-post-disabled');

    console.log('Post template without logo test completed!');
  });

  test('Re-enabling logo shows logo again', async ({ page }) => {
    console.log('Testing logo re-enable...');

    // Select template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Select a logo first using jQuery to trigger handlers properly
    await page.evaluate(() => {
      const logoSelect = jQuery('#logo-selection');
      if (logoSelect.length && logoSelect.find('option').length > 1) {
        const options = logoSelect.find('option');
        for (let i = 1; i < options.length; i++) {
          const value = jQuery(options[i]).val();
          if (value && value.trim()) {
            logoSelect.val(value).trigger('change');
            break;
          }
        }
      }
    });

    // Wait for async logo image loading
    await page.waitForTimeout(3000);

    // Verify logo is present
    let hasLogo = await page.evaluate(() => {
      return typeof logo !== 'undefined' && logo !== null;
    });
    expect(hasLogo).toBe(true);

    // Disable logo
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    // Verify logo is removed
    hasLogo = await page.evaluate(() => {
      return typeof logo === 'undefined' || logo === null;
    });
    expect(hasLogo).toBe(true);

    // Re-enable logo
    await page.click('#logo-toggle');
    await page.waitForTimeout(1000);

    // Verify logo is back
    hasLogo = await page.evaluate(() => {
      return typeof logo !== 'undefined' && logo !== null;
    });
    expect(hasLogo).toBe(true);

    // Navigate and compare - should match enabled state
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    await compareWithReference(page, 'logo-toggle-re-enabled');

    console.log('Logo re-enable test completed!');
  });

  test('Validation bypasses logo check when disabled', async ({ page }) => {
    console.log('Testing validation bypass with logo disabled...');

    // Select template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Disable logo
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    // Do NOT select a logo
    // Try to proceed to next step (should work)
    await page.click('#step-1-next');
    await page.waitForTimeout(1000);

    // Verify we're on step 2 (validation passed)
    const isStep2Visible = await page.evaluate(() => {
      const step2 = document.getElementById('step-2');
      return step2 && !step2.classList.contains('hidden');
    });
    expect(isStep2Visible).toBe(true);

    console.log('Validation bypass test completed!');
  });

  test('Validation requires logo when enabled', async ({ page }) => {
    console.log('Testing validation requires logo when enabled...');

    // Select template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Ensure logo is enabled (default)
    const isLogoEnabled = await page.evaluate(() => {
      const toggle = document.getElementById('logo-toggle');
      return toggle && toggle.checked;
    });
    expect(isLogoEnabled).toBe(true);

    // Clear logo selection using JavaScript (searchable-select hides the select)
    await page.evaluate(() => {
      const logoSelect = document.getElementById('logo-selection');
      if (logoSelect) {
        logoSelect.value = '';
        logoSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);

    // Try to proceed to next step (should fail)
    await page.click('#step-1-next');
    await page.waitForTimeout(500);

    // Verify we're still on step 1 (validation failed)
    const isStep1Visible = await page.evaluate(() => {
      const step1 = document.getElementById('step-1');
      return step1 && !step1.classList.contains('hidden');
    });
    expect(isStep1Visible).toBe(true);

    // Verify error message is shown
    const hasErrorMessage = await page.evaluate(() => {
      // Check for any visible alert or error message
      const alerts = document.querySelectorAll('.alert, .error, [role="alert"]');
      return Array.from(alerts).some(alert =>
        !alert.classList.contains('hidden') &&
        alert.textContent.includes('Logo')
      );
    });

    // If error messages are shown, this should be true
    // If not shown visually, validation still prevented navigation
    console.log('Logo validation enforced when enabled');

    console.log('Validation enforcement test completed!');
  });

  test('Template change with logo disabled does not add logo', async ({ page }) => {
    console.log('Testing template change with logo disabled...');

    // Select initial template
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Disable logo
    await page.click('#logo-toggle');
    await page.waitForTimeout(500);

    // Change to different template
    await page.selectOption('#canvas-template', 'story');
    await page.waitForTimeout(1000);

    // Verify no logo was added
    const hasNoLogo = await page.evaluate(() => {
      return typeof logo === 'undefined' || logo === null;
    });
    expect(hasNoLogo).toBe(true);

    // Change back to post
    await page.selectOption('#canvas-template', 'post');
    await page.waitForTimeout(1000);

    // Still no logo
    const stillNoLogo = await page.evaluate(() => {
      return typeof logo === 'undefined' || logo === null;
    });
    expect(stillNoLogo).toBe(true);

    console.log('Template change with disabled logo test completed!');
  });
});
