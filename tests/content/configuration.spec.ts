import { test, expect } from '@playwright/test';

test.describe('Configuration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('search functionality works when enabled', async ({ page }) => {
    const searchButton = page.locator('[data-search], .search-button, button:has-text("Search")').first();

    if (await searchButton.isVisible()) {
      await searchButton.click();

      const searchModal = page.locator('.search-modal, #search-modal, [role="dialog"]').first();
      await expect(searchModal).toBeVisible();

      // Test search input
      const modalSearchInput = searchModal.locator('input').first();
      await modalSearchInput.fill('test');
    }
  });

  test('theme switching functionality works', async ({ page }) => {
    const themeToggle = page.locator('.theme-toggle, .theme-switcher, button[aria-label*="theme"]').first();

    if (await themeToggle.isVisible()) {
      const initialClass = await page.evaluate(() => document.documentElement.className);

      await themeToggle.click();

      const newClass = await page.evaluate(() => document.documentElement.className);
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('table of contents is generated when enabled', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    const postLinks = page.locator('a[href*="/posts/"]').first();
    if (await postLinks.isVisible()) {
      await postLinks.click();

      const toc = page.locator('.toc, .table-of-contents, #toc, #table-of-contents').first();

      if (await toc.isVisible()) {
        const tocLinks = toc.locator('a');
        const linkCount = await tocLinks.count();
        expect(linkCount).toBeGreaterThan(0);

        // Test clicking a TOC link
        await tocLinks.first().click();
      }
    }
  });

  test('social media links are configured', async ({ page }) => {
    const socialLinks = page.locator('a[href*="github"], a[href*="twitter"], a[href*="linkedin"], .social-links a, .socials a');

    if (await socialLinks.count() > 0) {
      const firstLink = socialLinks.first();
      const href = await firstLink.getAttribute('href');

      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test('RSS feed links are available', async ({ page }) => {
    const feedLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('link[type*="rss"], link[type*="atom"]');
      return Array.from(links).map(link => ({
        type: link.getAttribute('type'),
        href: link.getAttribute('href'),
      }));
    });

    if (feedLinks.length > 0) {
      const response = await page.request.get(feedLinks[0].href);
      expect(response.status()).toBe(200);
    }
  });
});
