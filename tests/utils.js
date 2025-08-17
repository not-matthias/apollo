/**
 * Utility functions for Apollo theme Playwright tests
 */

/**
 * Wait for search index to be loaded
 * @param {import('@playwright/test').Page} page 
 * @param {number} timeout 
 */
async function waitForSearchIndex(page, timeout = 5000) {
  await page.waitForFunction(
    () => window.searchIndex !== undefined || window.elasticlunr !== undefined,
    { timeout }
  );
}

/**
 * Check if a feature is enabled on the page
 * @param {import('@playwright/test').Page} page 
 * @param {string} feature - Feature name (search, theme-toggle, toc, analytics)
 * @returns {Promise<boolean>}
 */
async function isFeatureEnabled(page, feature) {
  switch (feature) {
    case 'search':
      return await page.locator('input[type="search"], #search, .search-input').count() > 0;
    case 'theme-toggle':
      return await page.locator('button[class*="theme"], .theme-toggle, #theme-toggle').count() > 0;
    case 'toc':
      return await page.locator('.toc, #toc, .table-of-contents').count() > 0;
    case 'analytics':
      return await page.evaluate(() => typeof window.goatcounter !== 'undefined');
    case 'mermaid':
      return await page.evaluate(() => typeof window.mermaid !== 'undefined');
    default:
      return false;
  }
}

/**
 * Get current theme
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<string|null>}
 */
async function getCurrentTheme(page) {
  return await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') || 
           (document.body.classList.contains('dark') ? 'dark' : null) ||
           (document.body.classList.contains('light') ? 'light' : null) ||
           localStorage.getItem('theme');
  });
}

/**
 * Switch theme if theme toggle is available
 * @param {import('@playwright/test').Page} page 
 * @param {string} targetTheme - 'light' or 'dark'
 */
async function switchTheme(page, targetTheme) {
  const themeToggle = page.locator('button[class*="theme"], .theme-toggle, #theme-toggle');
  if (await themeToggle.count() === 0) {
    throw new Error('Theme toggle not found');
  }

  const currentTheme = await getCurrentTheme(page);
  if (currentTheme !== targetTheme) {
    await themeToggle.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Wait for page to be fully loaded including async content
 * @param {import('@playwright/test').Page} page 
 */
async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for any async operations
}

/**
 * Check if page has JavaScript errors
 * @param {import('@playwright/test').Page} page 
 * @returns {Promise<string[]>} Array of error messages
 */
async function getJavaScriptErrors(page) {
  const errors = [];
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Simulate user search behavior
 * @param {import('@playwright/test').Page} page 
 * @param {string} query 
 */
async function performSearch(page, query) {
  const searchInput = page.locator('input[type="search"], #search, .search-input').first();
  await searchInput.fill(query);
  await page.waitForTimeout(1000); // Wait for search results
}

/**
 * Test responsive behavior at different viewport sizes
 * @param {import('@playwright/test').Page} page 
 * @param {function} testCallback - Function to run at each viewport
 */
async function testResponsive(page, testCallback) {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop-large' },
    { width: 1366, height: 768, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await waitForPageReady(page);
    await testCallback(viewport);
  }
}

module.exports = {
  waitForSearchIndex,
  isFeatureEnabled,
  getCurrentTheme,
  switchTheme,
  waitForPageReady,
  getJavaScriptErrors,
  performSearch,
  testResponsive
};