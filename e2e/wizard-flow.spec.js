import { test, expect } from '@playwright/test';

test.describe('Basic Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Grüne|GRÜNE|Bildgenerator/i);
  });

  test('should load application without errors', async ({ page }) => {
    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Verify no errors occurred
    expect(errors).toHaveLength(0);
    
    // Basic DOM elements should be present
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have functional interface elements', async ({ page }) => {
    // Look for interactive elements (buttons, inputs, etc.)
    const buttons = page.locator('button, input[type="button"], .btn');
    const inputs = page.locator('input, textarea, select');
    
    // Should have some interactive elements
    const buttonCount = await buttons.count();
    const inputCount = await inputs.count();
    
    expect(buttonCount + inputCount).toBeGreaterThan(0);
  });
});