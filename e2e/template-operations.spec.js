import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Template Operations E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should switch between different template types', async ({ page }) => {
    const templateSelect = page.locator('#canvas-template');
    await expect(templateSelect).toBeVisible();
    
    // Test story template
    await templateSelect.selectOption('story');
    await page.waitForTimeout(1000);
    
    let canvas = page.locator('#meme-canvas');
    await expect(canvas).toBeVisible();
    
    // Test post template
    await templateSelect.selectOption('post');
    await page.waitForTimeout(1000);
    
    canvas = page.locator('#meme-canvas');
    await expect(canvas).toBeVisible();
    
    // Test A4 template
    await templateSelect.selectOption('a4');
    await page.waitForTimeout(1000);
    
    canvas = page.locator('#meme-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should display template dimensions', async ({ page }) => {
    const templateSelect = page.locator('#canvas-template');
    
    // Select different templates and verify dimensions are shown
    await templateSelect.selectOption('story');
    await page.waitForTimeout(1000);
    
    const dimensionsElement = page.locator('#canvas-dimensions');
    let dimensionsText = await dimensionsElement.textContent();
    expect(dimensionsText).toMatch(/\d+\s*[×x]\s*\d+/); // Should show dimensions
    
    // Switch to post template
    await templateSelect.selectOption('post');
    await page.waitForTimeout(1000);
    
    dimensionsText = await dimensionsElement.textContent();
    expect(dimensionsText).toMatch(/\d+\s*[×x]\s*\d+/); // Should show different dimensions
  });

  test('should handle print format templates', async ({ page }) => {
    const templateSelect = page.locator('#canvas-template');
    
    // Test A4 template
    await templateSelect.selectOption('a4');
    await page.waitForTimeout(1000);
    
    // Verify canvas loads for print format
    const canvas = page.locator('#meme-canvas');
    await expect(canvas).toBeVisible();
    
    // Check dimensions are updated
    const dimensionsElement = page.locator('#canvas-dimensions');
    const dimensionsText = await dimensionsElement.textContent();
    expect(dimensionsText).toMatch(/\d+\s*[×x]\s*\d+/); // Should show dimensions
  });
});