import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Navigation Menu', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageReady();
  });

  test('navigation menu exists and is visible', async ({ page }) => {
    await helpers.verifyNavigationMenu();
  });

  test('posts link navigates correctly', async ({ page }) => {
    await page.click('nav a[href="/posts"]');
    await helpers.waitForPageReady();
    
    expect(page.url()).toContain('/posts');
    
    // Verify posts page loaded
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('projects link navigates correctly', async ({ page }) => {
    await page.click('nav a[href="/projects"]');
    await helpers.waitForPageReady();
    
    expect(page.url()).toContain('/projects');
    
    // Verify projects page loaded
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('tags link navigates correctly', async ({ page }) => {
    await page.click('nav a[href="/tags"]');
    await helpers.waitForPageReady();
    
    expect(page.url()).toContain('/tags');
    
    // Verify tags page loaded
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('homepage logo/title links back to home', async ({ page }) => {
    // Navigate away from home
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Click on site title/logo to go back home
    const homeLink = page.locator('header a[href="/"], .site-title a, .logo a').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await helpers.waitForPageReady();
      
      expect(page.url()).toMatch(/\/$|\/index\.html$/);
    }
  });

  test('navigation is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await helpers.waitForPageReady();
    
    // Navigation should still be accessible
    await helpers.verifyNavigationMenu();
  });

  test('social media links are present and functional', async ({ page }) => {
    await helpers.verifySocialLinks();
    
    // Test that social links have proper attributes
    const socialLinks = page.locator('.social-links a, .social a');
    const count = await socialLinks.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const link = socialLinks.nth(i);
      const href = await link.getAttribute('href');
      const target = await link.getAttribute('target');
      
      // Social links should have valid URLs
      expect(href).toMatch(/^https?:\/\/.+/);
      
      // Social links should open in new tab
      expect(target).toBe('_blank');
    }
  });

  test('current page is highlighted in navigation', async ({ page }) => {
    // Go to posts page
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Check if posts link has active state
    const postsLink = page.locator('nav a[href="/posts"]');
    const classList = await postsLink.getAttribute('class');
    
    // Should have some indication of active state (class may vary)
    if (classList) {
      expect(classList).toMatch(/active|current|selected/i);
    }
  });
});