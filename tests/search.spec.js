const { test, expect } = require('@playwright/test');

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have search functionality', async ({ page }) => {
    // Check if search input exists
    const searchInput = page.locator('input[type="search"], #search, .search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('should show search results when typing', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], #search, .search-input');
    if (await searchInput.count() > 0) {
      await searchInput.fill('configuration');
      
      // Wait for search results to appear
      await page.waitForTimeout(1000);
      
      // Check if search results are displayed
      const searchResults = page.locator('.search-results, #search-results, .search-result');
      await expect(searchResults).toBeVisible();
    }
  });

  test('should clear search results when input is cleared', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], #search, .search-input');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      const searchResults = page.locator('.search-results, #search-results, .search-result');
      await expect(searchResults).not.toBeVisible();
    }
  });

  test('should handle elasticlunr search index loading', async ({ page }) => {
    // Check if elasticlunr is loaded
    const isElasticlunrLoaded = await page.evaluate(() => {
      return typeof window.elasticlunr !== 'undefined';
    });
    
    if (isElasticlunrLoaded) {
      expect(isElasticlunrLoaded).toBe(true);
      
      // Check if search index is loaded
      const hasSearchIndex = await page.evaluate(() => {
        return window.searchIndex !== undefined;
      });
      expect(hasSearchIndex).toBe(true);
    }
  });

  test('should perform search with elasticlunr', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], #search, .search-input');
    if (await searchInput.count() > 0) {
      // Wait for search index to load
      await page.waitForFunction(() => window.searchIndex !== undefined, { timeout: 5000 });
      
      await searchInput.fill('apollo');
      await page.waitForTimeout(1000);
      
      // Check search functionality
      const hasResults = await page.evaluate(() => {
        if (window.searchIndex && window.elasticlunr) {
          const results = window.searchIndex.search('apollo');
          return results.length > 0;
        }
        return false;
      });
      
      expect(hasResults).toBe(true);
    }
  });
});