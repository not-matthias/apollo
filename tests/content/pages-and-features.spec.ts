import { test, expect } from '@playwright/test';

test.describe('Pages and Features', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Homepage should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Should have some content
    const content = page.locator('article, .body, main');
    await expect(content.first()).toBeVisible();
  });

  test('projects page loads and displays projects', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');

    // Page should have a heading or main content
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Look for project items (cards or list items)
    const projects = page.locator('.card, .list-item');
    const projectCount = await projects.count();

    if (projectCount > 0) {
      // Each project should have a title
      const title = projects.first().locator('h1, h2, h3').first();
      await expect(title).toBeVisible();
    }
  });

  test('tags page loads and displays tags', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('domcontentloaded');

    // Page should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Look for tags
    const tags = page.locator('a[href*="/tags/"]');
    const tagCount = await tags.count();

    if (tagCount > 0) {
      expect(tagCount).toBeGreaterThan(0);

      // Tags should be clickable
      const firstTag = tags.first();
      const href = await firstTag.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('tag filtering works correctly', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('domcontentloaded');

    const tags = page.locator('a[href*="/tags/"]');
    const tagCount = await tags.count();

    if (tagCount > 0) {
      const firstTag = tags.first();
      await firstTag.click();

      // Should be on a tag-specific page
      await expect(page).toHaveURL(/\/tags\//);

      // Should show posts with that tag
      const posts = page.locator('.list-item, .card');
      const postCount = await posts.count();
      expect(postCount).toBeGreaterThan(0);
    }
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click search button to open modal
    const searchButton = page.locator('#search-button');
    if (await searchButton.isVisible()) {
      await searchButton.click();

      // Wait for search modal to appear
      const searchModal = page.locator('#searchModal');
      await expect(searchModal).toBeVisible();

      // Look for search input in the modal
      const searchInput = page.locator('#searchInput');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');

        // Should show search results container
        const resultsContainer = page.locator('#results-container');
        await expect(resultsContainer).toBeVisible();
      }
    }
  });

  test('404 page exists and is functional', async ({ page }) => {
    // Try to navigate to a non-existent page
    const response = await page.goto('/this-page-does-not-exist');

    if (response) {
      // Should return 404 status
      expect(response.status()).toBe(404);
    }

    await page.waitForLoadState('domcontentloaded');

    // Should show 404 page content
    const content = page.locator('main, article, .content').first();
    await expect(content).toBeVisible();

    // Should have some indication this is an error page
    const text = await page.textContent('body');
    expect(text?.toLowerCase()).toMatch(/404|not found|error/);
  });

  test('RSS/feed link exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for RSS feed link in head
    const headFeedLink = await page.locator('link[type="application/rss+xml"], link[type="application/atom+xml"]').count();
    const visibleFeedLink = await page.locator('a[href*="rss"], a[href*="feed"], a[href*="atom.xml"]').count();

    expect(headFeedLink + visibleFeedLink).toBeGreaterThan(0);
  });
});
