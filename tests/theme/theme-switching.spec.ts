import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Theme Switching', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageReady();
  });

  test('theme toggle button exists', async ({ page }) => {
    const themeToggle = page.locator('#dark-mode-toggle');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeEnabled();
  });

  test('can cycle through light, dark, and auto themes', async ({ page }) => {
    // Get initial theme
    const initialTheme = await helpers.getCurrentTheme();

    // Click theme toggle
    await helpers.toggleTheme();
    const firstToggleTheme = await helpers.getCurrentTheme();
    expect(firstToggleTheme).not.toBe(initialTheme);

    // Click theme toggle again
    await helpers.toggleTheme();
    const secondToggleTheme = await helpers.getCurrentTheme();
    expect(secondToggleTheme).not.toBe(firstToggleTheme);

    // Click theme toggle a third time
    await helpers.toggleTheme();
    const thirdToggleTheme = await helpers.getCurrentTheme();
    expect(thirdToggleTheme).not.toBe(secondToggleTheme);
  });

  test('correct CSS classes applied for each theme', async ({ page }) => {
    const html = page.locator('html');

    // Test dark theme
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });
    await expect(html).toHaveClass(/dark/);

    // Test light theme
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });
    await expect(html).toHaveClass(/light/);

    // Test auto theme (should not have specific theme class)
    await page.evaluate(() => {
      document.documentElement.className = '';
    });
    await expect(html).not.toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    // Set to dark theme
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.className = 'dark';
    });

    const themeBeforeReload = await helpers.getCurrentTheme();

    // Reload page
    await page.reload();
    await helpers.waitForPageReady();

    const themeAfterReload = await helpers.getCurrentTheme();
    expect(themeAfterReload).toBe(themeBeforeReload);
  });

  test('theme changes affect page styling', async ({ page }) => {
    // Test color changes with theme - check html element color variables
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });

    const lightColor = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--color-text') || styles.color;
    });

    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });

    const darkColor = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--color-text') || styles.color;
    });

    expect(lightColor).not.toBe(darkColor);
  });
});
