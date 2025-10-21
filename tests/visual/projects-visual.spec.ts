import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Projects Page', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip visual tests on Safari mobile due to rendering variability');

  test('projects page visual comparison', async ({ page }) => {
    test.setTimeout(45000); // Timeout for screenshot

    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');

    // Set to light theme
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });

    // Wait for theme class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.className === 'light';
    });

    // Wait a moment for CSS to apply
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('projects-page.png');
  });
});
