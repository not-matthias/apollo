import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Visual Regression - Themes', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('homepage visual comparison - light theme', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Set to light theme
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });
    
    await page.waitForTimeout(300); // Let theme changes apply
    await expect(page).toHaveScreenshot('homepage-light.png');
  });

  test('homepage visual comparison - dark theme', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Set to dark theme
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });
    
    await page.waitForTimeout(300); // Let theme changes apply
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });

  test('posts page visual comparison', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Test both themes
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('posts-page-light.png');
    
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('posts-page-dark.png');
  });

  test('projects page visual comparison', async ({ page }) => {
    await page.goto('/projects');
    await helpers.waitForPageReady();
    
    await page.evaluate(() => {
      document.documentElement.className = 'light';
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('projects-page-light.png');
    
    await page.evaluate(() => {
      document.documentElement.className = 'dark';
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('projects-page-dark.png');
  });

  test('individual post visual comparison', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();
    
    // Navigate to first post
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();
      
      // Test light theme
      await page.evaluate(() => {
        document.documentElement.className = 'light';
      });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('individual-post-light.png');
      
      // Test dark theme
      await page.evaluate(() => {
        document.documentElement.className = 'dark';
      });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('individual-post-dark.png');
    }
  });

  test('navigation header visual comparison', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageReady();
    
    // Screenshot just the header area
    const header = page.locator('header');
    if (await header.isVisible()) {
      await page.evaluate(() => {
        document.documentElement.className = 'light';
      });
      await page.waitForTimeout(300);
      await expect(header).toHaveScreenshot('header-light.png');
      
      await page.evaluate(() => {
        document.documentElement.className = 'dark';
      });
      await page.waitForTimeout(300);
      await expect(header).toHaveScreenshot('header-dark.png');
    }
  });
});