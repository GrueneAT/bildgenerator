import { test, expect } from '@playwright/test';

test.describe('Image Generation Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load image generation interface', async ({ page }) => {
    // Verify page loads without errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
    
    // Check for canvas or image-related elements
    const canvasElements = page.locator('canvas, .canvas, #canvas, .image-container');
    const hasCanvasElements = await canvasElements.count() > 0;
    
    // Should have some image generation interface
    expect(hasCanvasElements).toBe(true);
  });

  test('should have file upload capabilities', async ({ page }) => {
    // Look for file input
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    
    // Should have file upload functionality
    expect(fileInputCount).toBeGreaterThan(0);
  });
});