import { test, expect } from '@playwright/test';

test.describe('Font Loading and Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('font files are accessible', async ({ page, request }) => {
    const baseUrl = page.url().replace(/\/$/, '');

    // Test critical font files
    const fontTests = [
      '/fonts/zed-fonts/ZedTextL-Regular.woff2',
      '/fonts/JetbrainsMono/JetBrainsMono-Regular.ttf',
    ];

    for (const fontPath of fontTests) {
      const response = await request.get(`${baseUrl}${fontPath}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('font');
    }
  });

  test('code elements use monospace fonts', async ({ page }) => {
    // Navigate to a page with code
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();

      const codeElements = page.locator('code, pre').first();
      if (await codeElements.count() > 0) {
        const codeFontFamily = await codeElements.evaluate(el =>
          getComputedStyle(el).fontFamily
        );

        // Code should use JetBrains Mono or monospace fallback
        expect(codeFontFamily).toMatch(/Jetbrains Mono|monospace/i);
      }
    }
  });
});
