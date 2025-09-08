import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Themes', () => {
  test('homepage visual comparison - light theme', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for screenshot

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set to light theme
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });

    // Wait for theme class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.className === 'light';
    });

    // Give a moment for CSS to apply
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-light.png');
  });

  test('homepage visual comparison - dark theme', async ({ page }) => {
    test.setTimeout(30000); // Increase timeout for screenshot

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Set to dark theme
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });

    // Wait for theme class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.className === 'dark';
    });

    // Give a moment for CSS to apply
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
