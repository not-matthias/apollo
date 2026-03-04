import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Theme Switching (toggle mode - 2 state)', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Clear any stale theme preference
    await page.addInitScript(() => {
      localStorage.removeItem('theme-storage');
    });
    await page.goto('/');
    await helpers.waitForPageReady();
  });

  test('theme toggle button exists', async ({ page }) => {
    const themeToggle = page.locator('#dark-mode-toggle');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toBeEnabled();
  });

  test('auto icon is not present in toggle mode', async ({ page }) => {
    const autoIcon = page.locator('#auto-icon');
    await expect(autoIcon).toHaveCount(0);
  });

  test('sun and moon icons are present', async ({ page }) => {
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    await expect(sunIcon).toBeAttached();
    await expect(moonIcon).toBeAttached();
  });

  test('cycles between light and dark only', async ({ page }) => {
    // Set to light first
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // Toggle to dark
    await helpers.toggleTheme();
    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);

    // Toggle back to light (not auto)
    await helpers.toggleTheme();
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
  });

  test('correct icon visibility for light theme', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
      (window as any).updateItemToggleTheme();
    });

    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    await expect(sunIcon).toBeVisible();
    await expect(moonIcon).not.toBeVisible();
  });

  test('correct icon visibility for dark theme', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'dark');
      (window as any).updateItemToggleTheme();
    });

    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');
    await expect(sunIcon).not.toBeVisible();
    await expect(moonIcon).toBeVisible();
  });

  test('theme preference persists across page reloads', async ({ browser }) => {
    // Use a fresh context without the addInitScript that clears localStorage
    const context = await browser.newContext();
    const page = await context.newPage();
    const h = new TestHelpers(page);

    await page.goto('/');
    await h.waitForPageReady();

    // Set dark theme
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'dark');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Reload — localStorage should persist
    await page.reload();
    await h.waitForPageReady();

    await expect(html).toHaveClass(/dark/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme).toBe('dark');

    await context.close();
  });

  test('stale "auto" in localStorage resolves to system preference', async ({ page }) => {
    // Simulate leftover "auto" from toggle-auto mode
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
    });

    // Emulate light system preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await helpers.waitForPageReady();

    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // Verify localStorage was updated away from "auto"
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme).toBe('light');
  });

  test('stale "auto" resolves to dark when system prefers dark', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
    });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await helpers.waitForPageReady();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme).toBe('dark');
  });

  test('theme changes affect page styling', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
      (window as any).updateItemToggleTheme();
    });

    const lightBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-0');
    });

    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'dark');
      (window as any).updateItemToggleTheme();
    });

    const darkBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-0');
    });

    expect(lightBg).not.toBe(darkBg);
  });

  test('non-active theme does not respond to system theme changes', async ({ page }) => {
    // Set explicitly to light
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // System switches to dark — should not affect explicit light
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);

    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
  });

  test('defaults to system preference when no localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('theme-storage');
    });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await helpers.waitForPageReady();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});

test.describe('Theme Switching (toggle-auto mode - 3 state)', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.addInitScript(() => {
      localStorage.removeItem('theme-storage');
    });
    await page.goto('/');
    await helpers.waitForPageReady();

    // Switch to toggle-auto mode by injecting the auto icon and changing the mode
    await page.evaluate(() => {
      (window as any).themeToggleMode = 'toggle-auto';

      // Add auto icon if not present
      const toggle = document.getElementById('dark-mode-toggle');
      if (toggle && !document.getElementById('auto-icon')) {
        const autoIcon = document.createElement('img');
        autoIcon.src = '/icons/auto.svg';
        autoIcon.id = 'auto-icon';
        autoIcon.alt = 'Auto';
        autoIcon.style.filter = 'invert(1)';
        autoIcon.style.display = 'none';
        toggle.appendChild(autoIcon);
      }

      (window as any).updateItemToggleTheme();
    });
  });

  test('cycles through light, dark, and auto', async ({ page }) => {
    // Set to light
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'light');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // Toggle → dark
    await helpers.toggleTheme();
    await expect(html).toHaveClass(/dark/);

    // Toggle → auto
    await page.click('#dark-mode-toggle');
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme).toBe('auto');

    // Toggle → light
    await page.click('#dark-mode-toggle');
    const savedTheme2 = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme2).toBe('light');
    await expect(html).toHaveClass(/light/);
  });

  test('auto icon is visible in auto state', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
      (window as any).updateItemToggleTheme();
    });

    const autoIcon = page.locator('#auto-icon');
    const sunIcon = page.locator('#sun-icon');
    const moonIcon = page.locator('#moon-icon');

    await expect(autoIcon).toBeVisible();
    await expect(sunIcon).not.toBeVisible();
    await expect(moonIcon).not.toBeVisible();
  });

  test('auto mode respects system theme preference', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');

    // System dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());
    await expect(html).toHaveClass(/dark/);

    // System light
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());
    await expect(html).toHaveClass(/light/);
  });

  test('auto icon filter changes based on system preference', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
      (window as any).updateItemToggleTheme();
    });

    const autoIcon = page.locator('#auto-icon');

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());

    const darkFilter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(darkFilter).toBe('invert(1)');

    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());

    const lightFilter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(lightFilter).toBe('invert(0)');
  });

  test('auto icon filter resets when switching away from auto', async ({ page }) => {
    // Start in auto with dark system
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
      (window as any).updateItemToggleTheme();
    });

    const autoIcon = page.locator('#auto-icon');
    let filter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(filter).toBe('invert(1)');

    // Toggle to light
    await page.click('#dark-mode-toggle');
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme-storage'));
    expect(savedTheme).toBe('light');

    filter = await autoIcon.evaluate((el: HTMLImageElement) => el.style.filter);
    expect(filter).toBe('none');

    const sunIcon = page.locator('#sun-icon');
    await expect(sunIcon).toBeVisible();
    await expect(autoIcon).not.toBeVisible();
  });

  test('auto mode updates when system theme changes', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme-storage', 'auto');
      (window as any).updateItemToggleTheme();
    });

    const html = page.locator('html');

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());
    await expect(html).toHaveClass(/dark/);
    await expect(html).not.toHaveClass(/light/);

    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);
    await page.evaluate(() => (window as any).updateItemToggleTheme());
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);
  });
});
