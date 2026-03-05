import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Talks Page', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Skip visual tests on Safari mobile due to rendering variability');

  test('talks page visual comparison', async ({ page }) => {
    test.setTimeout(45000);

    // Set theme via localStorage before navigation so it initializes correctly
    await page.addInitScript(() => {
      localStorage.setItem('theme-storage', 'light');
    });

    await page.goto('/talks');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('talks-page.png');
  });
});
