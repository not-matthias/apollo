import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Visual Regression - Responsive Design', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('homepage responsive - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await helpers.waitForPageReady();
    
    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });

  test('homepage responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await helpers.waitForPageReady();
    
    await expect(page).toHaveScreenshot('homepage-tablet.png');
  });

  test('homepage responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await helpers.waitForPageReady();
    
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });

  test('posts page responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    await expect(page).toHaveScreenshot('posts-mobile.png');
  });

  test('navigation responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Focus on navigation area
    const nav = page.locator('nav, header');
    if (await nav.first().isVisible()) {
      await expect(nav.first()).toHaveScreenshot('navigation-mobile.png');
    }
  });

  test('individual post responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      await expect(page).toHaveScreenshot('post-tablet.png');
    }
  });

  test('code blocks responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Look for code blocks
      const codeBlocks = page.locator('pre code, .highlight');
      const codeCount = await codeBlocks.count();
      
      if (codeCount > 0) {
        await expect(codeBlocks.first()).toHaveScreenshot('code-block-mobile.png');
      }
    }
  });

  test('table of contents responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      const toc = page.locator('.toc, #toc');
      if (await toc.isVisible()) {
        await expect(toc).toHaveScreenshot('toc-tablet.png');
      }
    }
  });

  test('footer responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await helpers.waitForPageReady();
    
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer-mobile.png');
    }
  });

  test('wide content responsive - desktop vs mobile', async ({ page }) => {
    // Test with desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Take desktop screenshot
      await expect(page).toHaveScreenshot('wide-content-desktop.png', { fullPage: true });
      
      // Switch to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500); // Let responsive changes apply
      
      // Take mobile screenshot
      await expect(page).toHaveScreenshot('wide-content-mobile.png', { fullPage: true });
    }
  });
});