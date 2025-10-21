import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Character Shortcodes Post', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip visual tests on Safari mobile due to rendering variability');

  test('character shortcodes post visual comparison - light theme', async ({ page }) => {
    test.setTimeout(45000); // Timeout for screenshot

    await page.goto('/posts/character-shortcodes');
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

    await expect(page).toHaveScreenshot('character-shortcodes-light.png');
  });

  test('character shortcodes post visual comparison - dark theme', async ({ page }) => {
    test.setTimeout(45000); // Timeout for screenshot

    await page.goto('/posts/character-shortcodes');
    await page.waitForLoadState('domcontentloaded');

    // Set to dark theme
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });

    // Wait for theme class to be applied
    await page.waitForFunction(() => {
      return document.documentElement.className === 'dark';
    });

    // Wait a moment for CSS to apply
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('character-shortcodes-dark.png');
  });
});
