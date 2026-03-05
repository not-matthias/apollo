import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Configuration Post', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip visual tests on Safari mobile due to rendering variability');

  test('configuration post visual comparison - light theme', async ({ page }) => {
    test.setTimeout(45000);

    // Set theme via localStorage before navigation so it initializes correctly
    await page.addInitScript(() => {
      localStorage.setItem('theme-storage', 'light');
    });

    await page.goto('/posts/configuration/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('configuration-post-light.png');
  });

  test('configuration post visual comparison - dark theme', async ({ page }) => {
    test.setTimeout(45000);

    // Set theme via localStorage before navigation so it initializes correctly
    await page.addInitScript(() => {
      localStorage.setItem('theme-storage', 'dark');
    });

    await page.goto('/posts/configuration/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('configuration-post-dark.png');
  });
});
