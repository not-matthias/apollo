import { Page, expect } from '@playwright/test';

/**
 * Helper functions for common test operations
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded and ready
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForFunction(() => document.readyState === 'complete');
  }

  /**
   * Get the current theme from the document
   */
  async getCurrentTheme(): Promise<string> {
    return await this.page.evaluate(() => {
      const html = document.documentElement;
      if (html.classList.contains('dark')) return 'dark';
      if (html.classList.contains('light')) return 'light';
      return 'auto';
    });
  }

  /**
   * Click the theme toggle button
   */
  async toggleTheme() {
    await this.page.click('#theme-toggle');
    // Wait for theme change to apply
    await this.page.waitForTimeout(100);
  }

  /**
   * Verify navigation menu exists and has expected links
   */
  async verifyNavigationMenu() {
    const nav = this.page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for main navigation links
    await expect(this.page.locator('nav a[href="/posts"]')).toBeVisible();
    await expect(this.page.locator('nav a[href="/projects"]')).toBeVisible();
    await expect(this.page.locator('nav a[href="/tags"]')).toBeVisible();
  }

  /**
   * Verify social media links are present
   */
  async verifySocialLinks() {
    const socialLinks = this.page.locator('.social-links a');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify each link has an icon
    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      await expect(link.locator('svg, img')).toBeVisible();
    }
  }

  /**
   * Check if table of contents exists on the page
   */
  async hasTableOfContents(): Promise<boolean> {
    const toc = this.page.locator('.toc, #toc');
    return await toc.isVisible();
  }

  /**
   * Verify table of contents navigation
   */
  async verifyTableOfContents() {
    const hasToc = await this.hasTableOfContents();
    if (!hasToc) return;
    
    const tocLinks = this.page.locator('.toc a, #toc a');
    const count = await tocLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // Test first TOC link
    if (count > 0) {
      const firstLink = tocLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^#.+/); // Should be an anchor link
    }
  }

  /**
   * Take a screenshot with consistent naming
   */
  async takeScreenshot(name: string, options: { fullPage?: boolean } = {}) {
    const theme = await this.getCurrentTheme();
    const screenshotName = `${name}-${theme}.png`;
    await this.page.screenshot({ 
      path: `tests/screenshots/${screenshotName}`,
      fullPage: options.fullPage || false 
    });
  }

  /**
   * Wait for search to be ready
   */
  async waitForSearchReady() {
    await this.page.waitForFunction(() => {
      return window.elasticlunr !== undefined;
    });
  }

  /**
   * Perform a search and wait for results
   */
  async performSearch(query: string) {
    await this.waitForSearchReady();
    await this.page.fill('#search-input', query);
    await this.page.press('#search-input', 'Enter');
    await this.page.waitForTimeout(500); // Wait for search results to populate
  }
}