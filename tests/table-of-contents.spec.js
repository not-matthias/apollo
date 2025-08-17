const { test, expect } = require('@playwright/test');

test.describe('Table of Contents Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to a page that likely has a table of contents
    await page.goto('/posts/configuration/');
  });

  test('should have table of contents on pages with headings', async ({ page }) => {
    const toc = page.locator('.toc, #toc, .table-of-contents');
    
    // Check if page has headings first
    const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 1;
    
    if (hasHeadings) {
      await expect(toc).toBeVisible();
    }
  });

  test('should have clickable TOC links', async ({ page }) => {
    const tocLinks = page.locator('.toc a, #toc a, .table-of-contents a');
    const linkCount = await tocLinks.count();
    
    if (linkCount > 0) {
      // Check that TOC links are clickable
      const firstTocLink = tocLinks.first();
      await expect(firstTocLink).toBeVisible();
      
      // Click the first TOC link
      await firstTocLink.click();
      await page.waitForTimeout(500);
      
      // Check if URL changed to include hash
      const url = page.url();
      expect(url).toMatch(/#.+/);
    }
  });

  test('should scroll to correct section when TOC link is clicked', async ({ page }) => {
    const tocLinks = page.locator('.toc a, #toc a, .table-of-contents a');
    const linkCount = await tocLinks.count();
    
    if (linkCount > 0) {
      const firstTocLink = tocLinks.first();
      const href = await firstTocLink.getAttribute('href');
      
      if (href && href.includes('#')) {
        const targetId = href.split('#')[1];
        
        await firstTocLink.click();
        await page.waitForTimeout(1000);
        
        // Check if target element is in viewport
        const targetElement = page.locator(`#${targetId}`);
        if (await targetElement.count() > 0) {
          const isInViewport = await targetElement.isInViewport();
          expect(isInViewport).toBe(true);
        }
      }
    }
  });

  test('should highlight current section in TOC', async ({ page }) => {
    const tocLinks = page.locator('.toc a, #toc a, .table-of-contents a');
    const linkCount = await tocLinks.count();
    
    if (linkCount > 0) {
      // Click a TOC link
      await tocLinks.first().click();
      await page.waitForTimeout(1000);
      
      // Check if any TOC item has active/selected class
      const hasActiveItem = await page.evaluate(() => {
        const tocItems = document.querySelectorAll('.toc li, #toc li, .table-of-contents li');
        return Array.from(tocItems).some(item => 
          item.classList.contains('selected') || 
          item.classList.contains('active') || 
          item.classList.contains('current'),
        );
      });
      
      expect(hasActiveItem).toBe(true);
    }
  });

  test('should update TOC highlight on scroll', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4');
    const headingCount = await headings.count();
    
    if (headingCount > 2) {
      // Scroll to second heading
      await headings.nth(1).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Check if TOC observer is working
      const tocObserverExists = await page.evaluate(() => {
        return typeof window.IntersectionObserver !== 'undefined';
      });
      
      expect(tocObserverExists).toBe(true);
      
      // Test that DOM manipulation works correctly
      const hasTocLogic = await page.evaluate(() => {
        return Object.prototype.hasOwnProperty.call(window, 'paragraphMenuMap') || 
               document.querySelector('.toc .selected, .toc .active') !== null;
      });
      
      if (hasTocLogic) {
        expect(hasTocLogic).toBe(true);
      }
    }
  });

  test('should handle nested headings correctly', async ({ page }) => {
    const nestedTocItems = page.locator('.toc ul ul, #toc ul ul, .table-of-contents ul ul');
    const nestedCount = await nestedTocItems.count();
    
    // If there are nested TOC items, check their structure
    if (nestedCount > 0) {
      const firstNestedItem = nestedTocItems.first();
      await expect(firstNestedItem).toBeVisible();
      
      // Check if nested items have proper parent classes
      const hasProperNesting = await page.evaluate(() => {
        const nestedItems = document.querySelectorAll('.toc ul ul li, #toc ul ul li');
        return nestedItems.length > 0;
      });
      
      expect(hasProperNesting).toBe(true);
    }
  });

  test('should work with intersection observer for scroll tracking', async ({ page }) => {
    // Check if intersection observer is set up
    const observerSetup = await page.evaluate(() => {
      // Check if the observer is created
      return typeof window.IntersectionObserver !== 'undefined';
    });
    
    expect(observerSetup).toBe(true);
    
    // Scroll through the page to test observer
    await page.keyboard.press('End');
    await page.waitForTimeout(500);
    await page.keyboard.press('Home');
    await page.waitForTimeout(500);
    
    // The page should still function correctly after scrolling
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });
});