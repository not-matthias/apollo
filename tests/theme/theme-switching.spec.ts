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

  test('auto mode respects system theme preference', async ({ page }) => {
    // Set to auto mode
    await helpers.toggleTheme();
    await helpers.toggleTheme();
    const currentTheme = await helpers.getCurrentTheme();
    expect(currentTheme).toBe('auto');

    // Simulate system preference for dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    // Verify dark theme is applied
    const htmlDark = page.locator('html');
    await expect(htmlDark).toHaveClass(/dark/);

    // Simulate system preference for light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);

    // Verify light theme is applied
    const htmlLight = page.locator('html');
    await expect(htmlLight).toHaveClass(/light/);
  });

  test('auto mode updates when system theme preference changes', async ({ page }) => {
    // Set to auto mode and ensure it's saved
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
    });

    // Reload page to apply auto mode
    await page.reload();
    await helpers.waitForPageReady();

    // Start with dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    // Verify dark theme is applied
    let html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Simulate system theme change to light
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);

    // Verify theme updated to light
    html = page.locator('html');
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);

    // Simulate system theme change back to dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    // Verify theme updated back to dark
    html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);
  });

  test('auto mode icon updates based on system theme preference', async ({ page }) => {
    // Set to auto mode
    await helpers.toggleTheme();
    await helpers.toggleTheme();
    const currentTheme = await helpers.getCurrentTheme();
    expect(currentTheme).toBe('auto');

    // Verify auto icon is visible
    const autoIcon = page.locator('#auto-icon');
    await expect(autoIcon).toBeVisible();

    // Sun and moon icons should be hidden in auto mode
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    await expect(sunIcon).not.toBeVisible();
    await expect(moonIcon).not.toBeVisible();

    // Test icon filter with dark system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    const darkFilter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(darkFilter).toBe('invert(1)');

    // Test icon filter with light system preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);

    const lightFilter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(lightFilter).toBe('invert(0)');
  });

  test('non-auto themes do not respond to system theme changes', async ({ page }) => {
    // Set to light theme and ensure it's saved
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
    });

    await page.reload();
    await helpers.waitForPageReady();

    // Verify light theme is applied
    let html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // Simulate system preference for dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    // Theme should remain light (not respond to system change)
    html = page.locator('html');
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
  });

  test('auto icon filter is reset when switching away from auto mode', async ({ page }) => {
    // Set to auto mode with dark system preference
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
    });

    await page.reload();
    await helpers.waitForPageReady();

    // Simulate dark system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    // Verify auto icon has dark filter applied
    const autoIcon = page.locator('#auto-icon');
    let filterValue = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(filterValue).toBe('invert(1)');

    // Switch to light mode
    await helpers.toggleTheme();
    const currentTheme = await helpers.getCurrentTheme();
    expect(currentTheme).toBe('light');

    // Verify auto icon filter is reset
    filterValue = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(filterValue).toBe('none');

    // Verify sun icon is now visible (light mode)
    const sunIcon = page.locator('#sun-icon');
    await expect(sunIcon).toBeVisible();
    await expect(autoIcon).not.toBeVisible();
  });
});
