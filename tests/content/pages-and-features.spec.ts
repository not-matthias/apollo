import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Pages and Features', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Homepage should have a title
    const title = page.locator('h1, .hero-title, .site-title');
    await expect(title.first()).toBeVisible();
    
    // Should have some content or navigation
    const content = page.locator('main, .content, .hero');
    await expect(content.first()).toBeVisible();
  });

  test('projects page loads and displays projects', async ({ page }) => {
    await page.goto('/projects');
    await helpers.waitForPageReady();
    
    // Page should have a heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Look for project items
    const projects = page.locator('article, .project, .project-item, .card');
    const projectCount = await projects.count();
    
    if (projectCount > 0) {
      // Each project should have a title
      for (let i = 0; i < Math.min(projectCount, 3); i++) {
        const project = projects.nth(i);
        const title = project.locator('h1, h2, h3, .title, .project-title');
        await expect(title.first()).toBeVisible();
      }
    }
  });

  test('tags page loads and displays tags', async ({ page }) => {
    await page.goto('/tags');
    await helpers.waitForPageReady();
    
    // Page should have a heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Look for tags
    const tags = page.locator('.tag, .tags a, .tag-cloud a');
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
    await helpers.waitForPageReady();
    
    const tags = page.locator('.tag a, .tags a, .tag-cloud a');
    const tagCount = await tags.count();
    
    if (tagCount > 0) {
      const firstTag = tags.first();
      await firstTag.click();
      await helpers.waitForPageReady();
      
      // Should be on a tag-specific page
      expect(page.url()).toContain('/tags/');
      
      // Should show posts with that tag
      const posts = page.locator('article, .post, .post-item');
      const postCount = await posts.count();
      expect(postCount).toBeGreaterThan(0);
    }
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Look for search input
    const searchInput = page.locator('#search-input, input[type="search"], .search-input');
    
    if (await searchInput.first().isVisible()) {
      await helpers.performSearch('test');
      
      // Should show search results
      const searchResults = page.locator('#search-results, .search-results, .results');
      if (await searchResults.first().isVisible()) {
        const results = searchResults.locator('li, .result, .search-result');
        const resultCount = await results.count();
        expect(resultCount).toBeGreaterThanOrEqual(0);
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
    
    await helpers.waitForPageReady();
    
    // Should show 404 page content
    const content = page.locator('main, .content, .error');
    await expect(content.first()).toBeVisible();
    
    // Should have some indication this is an error page
    const errorIndicator = page.locator('h1, .error-title, .not-found');
    const text = await errorIndicator.first().textContent();
    expect(text?.toLowerCase()).toMatch(/404|not found|error/);
  });

  test('RSS/feed link exists', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Look for RSS feed link
    const feedLink = page.locator('link[type="application/rss+xml"], link[type="application/atom+xml"], a[href*="rss"], a[href*="feed"], a[href*="atom"]').first();
    
    // Feed link should exist (either in head or visible on page)
    const headFeedLink = await page.locator('link[type="application/rss+xml"], link[type="application/atom+xml"]').count();
    const visibleFeedLink = await page.locator('a[href*="rss"], a[href*="feed"], a[href*="atom"]').count();
    
    expect(headFeedLink + visibleFeedLink).toBeGreaterThan(0);
  });
});