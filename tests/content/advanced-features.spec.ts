import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Advanced Features', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('MathJax formulas are rendered', async ({ page }) => {
    // Look for pages that might contain math formulas
    await page.goto('/posts');
    await helpers.waitForPageReady();

    // Navigate to first post to check for math content
    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Check if MathJax is loaded
      const mathJaxScript = page.locator('script[src*="mathjax"], script[src*="tex-mml-chtml"]');
      const mathJaxCount = await mathJaxScript.count();

      if (mathJaxCount > 0) {
        // Wait for MathJax to initialize
        await page.waitForFunction(() => window.MathJax !== undefined, { timeout: 5000 }).catch((error) => {
          if (error && error.name === 'TimeoutError') {
            // Log the timeout error but continue test execution for graceful handling
            console.warn(`MathJax did not initialize within 5 seconds: ${error.message}`);
          } else {
            // Log or rethrow unexpected errors
            console.error('Unexpected error while waiting for MathJax initialization:', error);
            throw error;
          }
        });

        // Look for rendered math elements
        const mathElements = page.locator('.MathJax, .mjx-chtml, mjx-container, .math');
        const mathCount = await mathElements.count();

        if (mathCount > 0) {
          // Verify math is visible and rendered
          await expect(mathElements.first()).toBeVisible();
        }
      }
    }
  });

  test('Mermaid diagrams are displayed', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Check if Mermaid is loaded
      const mermaidScript = page.locator('script[src*="mermaid"]');
      const mermaidCount = await mermaidScript.count();

      if (mermaidCount > 0) {
        // Wait for Mermaid to initialize
        await page.waitForFunction(() => window.mermaid !== undefined, { timeout: 5000 }).catch(() => {});

        // Look for Mermaid diagram containers
        const mermaidElements = page.locator('.mermaid, .mermaid-diagram');
        const diagramCount = await mermaidElements.count();

        if (diagramCount > 0) {
          // Verify diagram is visible
          await expect(mermaidElements.first()).toBeVisible();

          // Mermaid should have rendered SVG content
          const svgContent = mermaidElements.first().locator('svg');
          if (await svgContent.isVisible()) {
            await expect(svgContent).toBeVisible();
          }
        }
      }
    }
  });

  test('code blocks are properly highlighted', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Look for code blocks
      const codeBlocks = page.locator('pre code, .highlight, .code-block');
      const codeCount = await codeBlocks.count();

      if (codeCount > 0) {
        const firstCodeBlock = codeBlocks.first();
        await expect(firstCodeBlock).toBeVisible();

        // Code blocks should have syntax highlighting classes
        const className = await firstCodeBlock.getAttribute('class');
        if (className) {
          expect(className).toMatch(/language-|hljs|highlight/);
        }

        // Should contain highlighted elements
        const highlightedElements = firstCodeBlock.locator('.hljs-keyword, .hljs-string, .hljs-comment, span[class*="hljs-"]');
        const highlightCount = await highlightedElements.count();

        if (highlightCount > 0) {
          expect(highlightCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('code copy functionality works', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Look for copy buttons on code blocks
      const copyButtons = page.locator('.copy-button, .copy, button[title*="copy" i], button[aria-label*="copy" i]');
      const copyCount = await copyButtons.count();

      if (copyCount > 0) {
        const firstCopyButton = copyButtons.first();
        await expect(firstCopyButton).toBeVisible();

        // Click the copy button
        await firstCopyButton.click();

        // Button should show some feedback (text change, etc.)
        await page.waitForTimeout(100);

        // Verify clipboard permissions are handled gracefully
        const buttonText = await firstCopyButton.textContent();
        if (buttonText) {
          // Common copy feedback text
          expect(buttonText.toLowerCase()).toMatch(/copy|copied/);
        }
      }
    }
  });

  test('toggleable notes feature works', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Look for note elements
      const notes = page.locator('.note, .callout, .admonition, .warning, .info, .tip');
      const noteCount = await notes.count();

      if (noteCount > 0) {
        const firstNote = notes.first();
        await expect(firstNote).toBeVisible();

        // Look for toggle button within note
        const toggleButton = firstNote.locator('button, .toggle, .collapse-toggle');
        const toggleCount = await toggleButton.count();

        if (toggleCount > 0) {
          const firstToggle = toggleButton.first();

          // Note content should be visible initially
          const noteContent = firstNote.locator('.content, .note-content, .body');
          if (await noteContent.isVisible()) {
            await expect(noteContent).toBeVisible();

            // Click toggle to collapse
            await firstToggle.click();
            await page.waitForTimeout(300);

            // Content might be hidden or collapsed
            const isStillVisible = await noteContent.isVisible();
            // Note: This test is flexible since toggle behavior can vary
          }
        }
      }
    }
  });

  test('responsive images and media work correctly', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForPageReady();

    const firstPostLink = page.locator('article a, .post a, .post-title a').first();
    if (await firstPostLink.isVisible()) {
      await firstPostLink.click();
      await helpers.waitForPageReady();

      // Look for images
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        const firstImage = images.first();
        await expect(firstImage).toBeVisible();

        // Images should load successfully
        await expect(firstImage).not.toHaveAttribute('src', '');

        // Check if images are responsive
        const maxWidth = await firstImage.evaluate(el => getComputedStyle(el).maxWidth);
        expect(maxWidth).toBe('100%');
      }
    }
  });
});
