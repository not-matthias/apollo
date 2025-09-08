import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Responsive Design', () => {
  test('homepage responsive - desktop', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for screenshot

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for layout to stabilize after viewport change
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });

  test('homepage responsive - tablet', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for screenshot

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for layout to stabilize after viewport change
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

  test('homepage responsive - mobile', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for screenshot

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for layout to stabilize after viewport change
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
