const { test, expect } = require('@playwright/test');

test.describe('Homepage Screenshots', () => {
  test('should match homepage screenshot - desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });

  test('should match homepage screenshot - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('should match dark theme screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to switch to dark theme if theme toggle exists
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    if (await themeToggle.count() > 0) {
      // Check current theme and switch if needed
      const isDarkTheme = await page.evaluate(() => {
        return document.body.classList.contains('dark') || 
               document.documentElement.getAttribute('data-theme') === 'dark';
      });
      
      if (!isDarkTheme) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveScreenshot('homepage-dark.png');
    }
  });
});
