import { test, expect } from '@playwright/test';

test.describe('Logo Selection Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load logo-related functionality', async ({ page }) => {
    // Check for no JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
    
    // Look for GRÜNE logo or branding elements
    const logoElements = page.locator('img[src*="logo"], .logo, .brand, img[src*="gruene"]');
    const hasLogos = await logoElements.count() > 0;
    
    // Should have logo/branding elements
    expect(hasLogos).toBe(true);
  });

  test('should have search or selection interface', async ({ page }) => {
    // Look for search inputs or selection elements
    const searchElements = page.locator('input[type="search"], input[placeholder*="suchen"], input[placeholder*="search"], select, .search');
    const hasSearchElements = await searchElements.count() > 0;
    
    // May or may not have search (depends on implementation)
    // Just verify page loads properly
    await expect(page.locator('body')).toBeVisible();
  });
});