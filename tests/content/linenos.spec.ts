import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Line Numbers in Code Blocks (Issue #168)', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/posts/linenos-test/');
    await helpers.waitForPageReady();
  });

  // Helper: get only code blocks that have line numbers (skip source examples)
  const linenosBlocks = (page: any) =>
    page.locator('pre.giallo:has(.giallo-ln)');

  test('line numbers are not user-selectable', async ({ page }) => {
    const lineNumbers = page.locator('.giallo-ln');
    const count = await lineNumbers.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const userSelect = await lineNumbers.nth(i).evaluate(
        (el: Element) => getComputedStyle(el).userSelect
      );
      expect(userSelect).toBe('none');
    }
  });

  test('line numbers have proper spacing', async ({ page }) => {
    const lineNumber = page.locator('.giallo-ln').first();
    await expect(lineNumber).toBeAttached();

    const styles = await lineNumber.evaluate((el: Element) => {
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        marginRight: parseFloat(cs.marginRight),
        minWidth: parseFloat(cs.minWidth),
      };
    });

    expect(styles.display).toBe('inline-block');
    expect(styles.marginRight).toBeGreaterThan(0);
    expect(styles.minWidth).toBeGreaterThan(0);
  });

  test('copy button does not include line numbers', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const firstBlock = linenosBlocks(page).first();
    const copyButton = firstBlock.locator('.clipboard-button');
    await expect(copyButton).toBeAttached();

    await copyButton.dispatchEvent('click');
    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    expect(clipboardText).toContain('fn main()');
    expect(clipboardText).toContain('println!');

    const lines = clipboardText.trim().split('\n');
    for (const line of lines) {
      expect(line).not.toMatch(/^\d+\s*(fn|println|let|})/);
    }
  });

  test('highlighted lines have a distinct background', async ({ page }) => {
    // Second linenos block: hl_lines=2
    const block = linenosBlocks(page).nth(1);

    const hlBg = await block.locator('.giallo-l.z-hl').first().evaluate(
      (el: Element) => getComputedStyle(el).backgroundColor
    );
    const normalBg = await block.locator('.giallo-l:not(.z-hl)').first().evaluate(
      (el: Element) => getComputedStyle(el).backgroundColor
    );

    expect(hlBg).not.toBe(normalBg);
  });

  test('multi-line highlights apply to all specified lines', async ({ page }) => {
    // Third linenos block: hl_lines=2 3
    const block = linenosBlocks(page).nth(2);

    const highlightedLines = block.locator('.giallo-l.z-hl');
    expect(await highlightedLines.count()).toBe(2);

    const lineNumbers = await highlightedLines.evaluateAll((els: Element[]) =>
      els.map((el) => el.querySelector('.giallo-ln')?.textContent?.trim())
    );
    expect(lineNumbers).toEqual(['2', '3']);
  });

  test('range highlights apply to all lines in range', async ({ page }) => {
    // Fourth linenos block: hl_lines=1-3
    const block = linenosBlocks(page).nth(3);

    const highlightedLines = block.locator('.giallo-l.z-hl');
    expect(await highlightedLines.count()).toBe(3);

    const lineNumbers = await highlightedLines.evaluateAll((els: Element[]) =>
      els.map((el) => el.querySelector('.giallo-ln')?.textContent?.trim())
    );
    expect(lineNumbers).toEqual(['1', '2', '3']);
  });

  test('linenostart offsets line numbers', async ({ page }) => {
    // Fifth linenos block: linenostart=10
    const block = linenosBlocks(page).nth(4);

    const lineNumbers = await block.locator('.giallo-ln').evaluateAll((els: Element[]) =>
      els.map((el) => el.textContent?.trim())
    );
    expect(lineNumbers).toEqual(['10', '11', '12', '13']);
  });

  test('hide_lines removes specified lines from output', async ({ page }) => {
    // Sixth linenos block: hide_lines=2
    const block = linenosBlocks(page).nth(5);

    const visibleLines = block.locator('.giallo-l');
    expect(await visibleLines.count()).toBe(3);

    const lineNumbers = await block.locator('.giallo-ln').evaluateAll((els: Element[]) =>
      els.map((el) => el.textContent?.trim())
    );
    expect(lineNumbers).toEqual(['1', '3', '4']);
  });
});
