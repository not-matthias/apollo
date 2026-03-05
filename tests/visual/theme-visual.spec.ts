import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Themes', () => {
  test('homepage visual comparison - light theme', async ({ page }) => {
    test.setTimeout(30000);

    // Set theme via localStorage before navigation so it initializes correctly
    await page.addInitScript(() => {
      localStorage.setItem('theme-storage', 'light');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-light.png');
  });

  test('homepage visual comparison - dark theme', async ({ page }) => {
    test.setTimeout(30000);

    // Set theme via localStorage before navigation so it initializes correctly
    await page.addInitScript(() => {
      localStorage.setItem('theme-storage', 'dark');
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
