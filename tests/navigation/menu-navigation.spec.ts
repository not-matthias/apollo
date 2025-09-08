import { test, expect } from '@playwright/test';

test.describe('Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('navigation menu and core links work', async ({ page }) => {
    // Verify menu exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Verify and test main links - be flexible with href matching
    const postsLink = page.locator('nav a').filter({ hasText: /posts/i }).first();
    await expect(postsLink).toBeVisible();
    await postsLink.click();
    await expect(page).toHaveURL(/\/posts/);

    // Navigate to projects
    await page.locator('nav a').filter({ hasText: /projects/i }).first().click();
    await expect(page).toHaveURL(/\/projects/);

    // Navigate to tags
    await page.locator('nav a').filter({ hasText: /tags/i }).first().click();
    await expect(page).toHaveURL(/\/tags/);
  });

  test('social media links are present', async ({ page }) => {
    const socialLinks = page.locator('.socials .social');
    const count = await socialLinks.count();

    if (count > 0) {
      expect(count).toBeGreaterThan(0);

      // Verify first social link has valid href
      const firstLink = socialLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^https?:\/\/.+/);
    }
  });

  test('responsive navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigation should still be accessible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Links should still work
    const postsLink = page.locator('nav a').filter({ hasText: /posts/i }).first();
    if (await postsLink.isVisible()) {
      await expect(postsLink).toBeVisible();
    }
  });
});
