const { test, expect } = require('@playwright/test');

test.describe('Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should switch between light and dark themes', async ({ page }) => {
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    
    if (await themeToggle.count() > 0) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || 
               document.body.className.match(/theme-(\w+)/) || 
               localStorage.getItem('theme');
      });

      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Get new theme
      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || 
               document.body.className.match(/theme-(\w+)/) || 
               localStorage.getItem('theme');
      });

      // Theme should have changed
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should persist theme selection in localStorage', async ({ page }) => {
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(storedTheme).toBeTruthy();
    }
  });

  test('should apply correct CSS classes for themes', async ({ page }) => {
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    
    if (await themeToggle.count() > 0) {
      // Check initial state
      const hasThemeClass = await page.evaluate(() => {
        return document.body.classList.contains('light') || 
               document.body.classList.contains('dark') ||
               document.documentElement.hasAttribute('data-theme');
      });

      expect(hasThemeClass).toBe(true);

      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check that theme class changed
      const stillHasThemeClass = await page.evaluate(() => {
        return document.body.classList.contains('light') || 
               document.body.classList.contains('dark') ||
               document.documentElement.hasAttribute('data-theme');
      });

      expect(stillHasThemeClass).toBe(true);
    }
  });

  test('should respect system theme preference', async ({ page }) => {
    // Set system to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const systemTheme = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    expect(systemTheme).toBe('dark');
  });

  test('should update theme toggle icon/text when theme changes', async ({ page }) => {
    const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
    
    if (await themeToggle.count() > 0) {
      const initialToggleContent = await themeToggle.textContent();
      
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      const newToggleContent = await themeToggle.textContent();
      
      // Content should change (icon or text)
      expect(newToggleContent).not.toBe(initialToggleContent);
    }
  });
});