import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Blog Posts', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('posts page displays list of posts', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Check for posts listing
    const posts = page.locator('article, .post, .post-item');
    const postCount = await posts.count();
    expect(postCount).toBeGreaterThan(0);
    
    // Each post should have a title and link
    for (let i = 0; i < Math.min(postCount, 3); i++) {
      const post = posts.nth(i);
      const titleLink = post.locator('h1 a, h2 a, h3 a, .post-title a');
      await expect(titleLink.first()).toBeVisible();
    }
  });

  test('individual posts can be opened', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Find first post link
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      const href = await firstPostLink.getAttribute('href');
      expect(href).toBeTruthy();
      
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Verify we're on a post page
      expect(page.url()).toContain('/posts/');
      
      // Post should have content
      const content = page.locator('article, .post-content, .content');
      await expect(content.first()).toBeVisible();
    }
  });

  test('post metadata is displayed', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Check for common metadata elements
      const metadata = page.locator('.post-meta, .meta, .post-date, .date');
      if (await metadata.first().isVisible()) {
        await expect(metadata.first()).toContainText(/\d{4}/); // Should contain a year
      }
    }
  });

  test('pagination works correctly', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Look for pagination controls
    const pagination = page.locator('.pagination, .pager, nav[aria-label="pagination"]');
    const nextLink = page.locator('.pagination a, .pager a, .next').filter({ hasText: /next|→|>/i });
    
    if (await nextLink.first().isVisible()) {
      const currentUrl = page.url();
      await nextLink.first().click();
      await helpers.waitForPageReady();
      
      // URL should have changed
      expect(page.url()).not.toBe(currentUrl);
      
      // Should still be on posts page
      expect(page.url()).toContain('/posts');
      
      // Should still have posts displayed
      const posts = page.locator('article, .post, .post-item');
      const postCount = await posts.count();
      expect(postCount).toBeGreaterThan(0);
    }
  });

  test('post tags are displayed and clickable', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Look for tags
      const tags = page.locator('.tags a, .tag, .post-tags a');
      const tagCount = await tags.count();
      
      if (tagCount > 0) {
        const firstTag = tags.first();
        await expect(firstTag).toBeVisible();
        
        const href = await firstTag.getAttribute('href');
        if (href) {
          await firstTag.click();
          await helpers.waitForPageReady();
          
          // Should navigate to tag page
          expect(page.url()).toContain('/tags/');
        }
      }
    }
  });

  test('post content is properly formatted', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Check for proper content structure
      const content = page.locator('article, .post-content, .content').first();
      await expect(content).toBeVisible();
      
      // Should have paragraphs or other content elements
      const contentElements = content.locator('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
      const elementCount = await contentElements.count();
      expect(elementCount).toBeGreaterThan(0);
    }
  });
});