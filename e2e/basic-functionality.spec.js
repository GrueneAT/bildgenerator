import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for GRÜNE branding
    await expect(page).toHaveTitle(/Grüne|GRÜNE|Bildgenerator/i);
  });

  test('should display main interface elements', async ({ page }) => {
    await page.goto('/');
    
    // Look for common UI patterns
    const commonSelectors = [
      '.container',
      '.wizard',
      '.steps',
      '.main',
      '#app',
      'form',
      'button'
    ];
    
    let foundElement = false;
    for (const selector of commonSelectors) {
      if (await page.locator(selector).count() > 0) {
        foundElement = true;
        break;
      }
    }
    
    expect(foundElement).toBe(true);
  });

  test('should not have JavaScript errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });
});