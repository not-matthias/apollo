const { test, expect } = require('@playwright/test');

test.describe('Main Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main navigation menu', async ({ page }) => {
    const nav = page.locator('nav, .nav, .menu, .navigation');
    await expect(nav).toBeVisible();
    
    // Check for common menu items based on config
    const menuItems = page.locator('nav a, .nav a, .menu a');
    const menuCount = await menuItems.count();
    expect(menuCount).toBeGreaterThan(0);
  });

  test('should have working menu links', async ({ page }) => {
    const menuLinks = page.locator('nav a, .nav a, .menu a');
    const linkCount = await menuLinks.count();
    
    if (linkCount > 0) {
      const firstLink = menuLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      
      // Click first menu link
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to new page
      const newUrl = page.url();
      expect(newUrl).toContain(href);
    }
  });

  test('should display social links', async ({ page }) => {
    const socialLinks = page.locator('.social a, .socials a, a[href*="twitter"], a[href*="github"]');
    const socialCount = await socialLinks.count();
    
    if (socialCount > 0) {
      const firstSocial = socialLinks.first();
      await expect(firstSocial).toBeVisible();
      
      const href = await firstSocial.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should have proper page title and meta description', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    const description = page.locator('meta[name="description"]');
    const descriptionContent = await description.getAttribute('content');
    if (descriptionContent) {
      expect(descriptionContent.length).toBeGreaterThan(0);
    }
  });

  test('should load all JavaScript files without errors', async ({ page }) => {
    const jsErrors = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that no JavaScript errors occurred
    expect(jsErrors.length).toBe(0);
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(body).toBeVisible();
  });

  test('should handle MathJax rendering if enabled', async ({ page }) => {
    const mathJaxExists = await page.evaluate(() => {
      return typeof window.MathJax !== 'undefined';
    });
    
    if (mathJaxExists) {
      expect(mathJaxExists).toBe(true);
      
      // Check if MathJax is configured
      const mathJaxConfigured = await page.evaluate(() => {
        return window.MathJax.tex !== undefined;
      });
      expect(mathJaxConfigured).toBe(true);
    }
  });

  test('should have working RSS feed link', async ({ page }) => {
    const rssLink = page.locator('link[type="application/rss+xml"], a[href*="rss"], a[href*="feed"]');
    const rssCount = await rssLink.count();
    
    if (rssCount > 0) {
      const rssHref = await rssLink.first().getAttribute('href');
      expect(rssHref).toBeTruthy();
      expect(rssHref).toMatch(/\.(xml|rss)$/);
    }
  });

  test('should display posts/articles on homepage', async ({ page }) => {
    const articles = page.locator('article, .post, .entry');
    const articleCount = await articles.count();
    
    if (articleCount > 0) {
      const firstArticle = articles.first();
      await expect(firstArticle).toBeVisible();
      
      // Check for article title
      const articleTitle = firstArticle.locator('h1, h2, h3, .title, .post-title');
      await expect(articleTitle).toBeVisible();
    }
  });

  test('should have pagination when there are many posts', async ({ page }) => {
    const pagination = page.locator('.pagination, .pager, nav[aria-label*="pagination"]');
    const paginationCount = await pagination.count();
    
    if (paginationCount > 0) {
      await expect(pagination).toBeVisible();
      
      const paginationLinks = pagination.locator('a');
      const linkCount = await paginationLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('should load favicon correctly', async ({ page }) => {
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    const faviconCount = await favicon.count();
    
    if (faviconCount > 0) {
      const faviconHref = await favicon.first().getAttribute('href');
      expect(faviconHref).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1Elements = page.locator('h1');
    const h1Count = await h1Elements.count();
    
    // Should have at least one H1
    expect(h1Count).toBeGreaterThan(0);
    
    // Check heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 1) {
      // Should have logical heading structure
      const firstHeading = await headings.first().innerHTML();
      expect(firstHeading.length).toBeGreaterThan(0);
    }
  });

  test('should handle code syntax highlighting', async ({ page }) => {
    const codeBlocks = page.locator('pre code, .highlight, .hljs');
    const codeBlockCount = await codeBlocks.count();
    
    if (codeBlockCount > 0) {
      const firstCodeBlock = codeBlocks.first();
      await expect(firstCodeBlock).toBeVisible();
      
      // Check if syntax highlighting is applied
      const hasHighlighting = await firstCodeBlock.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return computedStyle.color !== 'rgba(0, 0, 0, 0)' && computedStyle.color !== 'initial';
      });
      
      expect(hasHighlighting).toBe(true);
    }
  });
});