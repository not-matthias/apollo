import { Page, expect } from '@playwright/test';

/**
 * Helper functions for common test operations
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded and ready
   * Optimized version - use domcontentloaded instead of networkidle
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the current theme from the document
   */
  async getCurrentTheme(): Promise<string> {
    return await this.page.evaluate(() => {
      // Apollo uses localStorage to store theme
      const theme = localStorage.getItem('theme-storage');
      if (theme) return theme;

      // Fallback to class detection
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
    const prevTheme = await this.getCurrentTheme();
    await this.page.click('#dark-mode-toggle');

    // Wait for the theme to change (class on <html> changes)
    await this.page.waitForFunction(
      (prev) => {
        const html = document.documentElement;
        const current = html.classList.contains('dark') ? 'dark' :
                       html.classList.contains('light') ? 'light' : 'auto';
        return current !== prev;
      },
      prevTheme
    );
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
    const socialLinks = this.page.locator('.socials .social');
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
   * Click a TOC link and verify active state
   * Optimized version with faster waits
   */
  async clickTocLinkAndVerifyActive(tocLink: any) {
    await tocLink.click();

    // Wait for the link to have the active/current class
    await this.page.waitForFunction(
      (el) => el && /active|current/i.test(el.className),
      await tocLink.elementHandle()
    );

    // Verify the link has active styling
    const linkClass = await tocLink.getAttribute('class');
    if (linkClass) {
      expect(linkClass).toMatch(/active|current/i);
    }
  }
}
