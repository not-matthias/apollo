import { test, expect } from '@playwright/test';

test.describe('Blog Posts', () => {
  test('posts page displays list and individual posts open', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    // Check for posts listing - posts use list-item class
    const posts = page.locator('.list-item, .card');
    const postCount = await posts.count();
    expect(postCount).toBeGreaterThan(0);

    // Verify post has title and link - title is in h1.title
    const titleLink = posts.first().locator('h1.title a, h1.card-title a').first();
    await expect(titleLink).toBeVisible();

    // Open first post
    await titleLink.click();
    await expect(page).toHaveURL(/\/posts\//);

    // Verify post content exists
    const content = page.locator('article, main, .content').first();
    await expect(content).toBeVisible();

    // Check for content elements
    const contentElements = content.locator('p, h1, h2, h3, h4, h5, h6, ul, ol, pre');
    expect(await contentElements.count()).toBeGreaterThan(0);
  });

  test('post metadata and tags work', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    const firstPostLink = page.locator('.list-item h1.title a, .card h1.card-title a').first();
    await firstPostLink.click();

    // Check for metadata - using .meta class
    const metadata = page.locator('.meta, time, .post-date').first();
    if (await metadata.isVisible()) {
      const text = await metadata.textContent();
      if (text) {
        expect(text).toMatch(/\d{4}/); // Should contain a year
      }
    }

    // Test tags if present
    const tags = page.locator('.tags a, .tag');
    const tagCount = await tags.count();

    if (tagCount > 0) {
      const firstTag = tags.first();
      await firstTag.click();
      await expect(page).toHaveURL(/\/tags\//);
    }
  });

  test('pagination works correctly', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    // Look for next link
    const nextLink = page.locator('.pagination a, .page-link').filter({ hasText: /next|→/i }).first();

    if (await nextLink.isVisible()) {
      await nextLink.click();

      // Should still be on posts page with posts displayed
      await expect(page).toHaveURL(/\/posts/);
      const posts = page.locator('.list-item, .card');
      expect(await posts.count()).toBeGreaterThan(0);
    }
  });
});
