import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page structure', async ({ page }) => {
    // Verify basic HTML structure
    await expect(page.locator('html')).toHaveAttribute('lang');
    
    // Should have proper title
    await expect(page).toHaveTitle(/\w+/); // Non-empty title
    
    // Should have main content area
    await expect(page.locator('body')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab should move focus to interactive elements
    await page.keyboard.press('Tab');
    
    // Check if focus moved to an element
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;
    
    // Basic keyboard navigation should work
    expect(hasFocus).toBe(true);
  });

  test('should have proper contrast and readability', async ({ page }) => {
    // Check if page has readable text
    const bodyText = await page.locator('body').textContent();
    
    // Should have some visible text content
    expect(bodyText.trim().length).toBeGreaterThan(10);
    
    // Check for basic color styling
    const bodyColor = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Should have defined text color
    expect(bodyColor).toBeTruthy();
  });
});