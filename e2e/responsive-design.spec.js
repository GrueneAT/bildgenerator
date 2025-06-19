import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test('should display interface on desktop', async ({ page }) => {
    await page.goto('/');
    
    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Basic functionality check
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should work on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verify page loads on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check for no errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('should work on tablet viewports', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Verify page loads on tablet
    await expect(page.locator('body')).toBeVisible();
    
    // Check for no errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});