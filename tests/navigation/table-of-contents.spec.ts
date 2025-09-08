import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Table of Contents', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('TOC is generated for pages with headers', async ({ page }) => {
    // Navigate to a post or page that should have headers
    await page.goto('/posts');
    await helpers.waitForPageReady();

    // Find a post link and navigate to it
    const postLinks = page.locator('a[href*="/posts/"]');
    const postCount = await postLinks.count();

    if (postCount > 0) {
      await postLinks.first().click();
      await helpers.waitForPageReady();

      // Check if TOC exists (it may not exist on all posts)
      const hasToc = await helpers.hasTableOfContents();

      if (hasToc) {
        await helpers.verifyTableOfContents();
      }
    }
  });

  test('TOC links navigate to correct sections', async ({ page }) => {
    // Go to a page that likely has a TOC
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const postLinks = page.locator('a[href*="/posts/"]');
    const postCount = await postLinks.count();

    if (postCount > 0) {
      await postLinks.first().click();
      await helpers.waitForPageReady();

      const hasToc = await helpers.hasTableOfContents();

      if (hasToc) {
        const tocLinks = page.locator('.toc a, #toc a');
        const linkCount = await tocLinks.count();

        if (linkCount > 0) {
          const firstLink = tocLinks.first();
          const href = await firstLink.getAttribute('href');

          if (href && href.startsWith('#')) {
            // Click the TOC link
            await firstLink.click();
            // Wait for scroll to complete and target section to be in view
            await page.waitForFunction(
              (targetId) => {
                const element = document.querySelector(targetId);
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top >= 0 && rect.top < window.innerHeight;
              },
              href
            );

            // Verify the target element exists
            const targetElement = page.locator(href);
            await expect(targetElement).toBeVisible();
          }
        }
      }
    }
  });

  test('TOC is sticky positioned in sidebar', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const postLinks = page.locator('a[href*="/posts/"]');
    const postCount = await postLinks.count();

    if (postCount > 0) {
      await postLinks.first().click();
      await helpers.waitForPageReady();

      const toc = page.locator('.toc, #toc');
      if (await toc.isVisible()) {
        const position = await toc.evaluate(el => getComputedStyle(el).position);
        expect(position).toMatch(/sticky|fixed/);
      }
    }
  });

  test('TOC adapts to viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/posts');
    await helpers.waitForPageReady();

    const postLinks = page.locator('a[href*="/posts/"]');
    const postCount = await postLinks.count();

    if (postCount > 0) {
      await postLinks.first().click();
      await helpers.waitForPageReady();

      // On mobile, TOC might be hidden or repositioned
      const toc = page.locator('.toc, #toc');
      if (await toc.isVisible()) {
        // Should still be functional
        const tocLinks = toc.locator('a');
        const linkCount = await tocLinks.count();
        expect(linkCount).toBeGreaterThan(0);
      }
    }
  });

  test('active section highlighting works during scroll', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const postLinks = page.locator('a[href*="/posts/"]');
    const postCount = await postLinks.count();

    if (postCount > 0) {
      await postLinks.first().click();
      await helpers.waitForPageReady();

      const hasToc = await helpers.hasTableOfContents();

      if (hasToc) {
        const tocLinks = page.locator('.toc a, #toc a');
        const linkCount = await tocLinks.count();

        if (linkCount > 1) {
          // Scroll to different sections and verify active highlighting
          const firstLink = tocLinks.first();
          const secondLink = tocLinks.nth(1);

          // Click first link and verify active state
          await helpers.clickTocLinkAndVerifyActive(firstLink);

          // Click second link and verify active state
          await helpers.clickTocLinkAndVerifyActive(secondLink);
        }
      }
    }
  });
});
