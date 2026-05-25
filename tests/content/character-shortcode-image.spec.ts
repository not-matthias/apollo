import { test, expect } from '@playwright/test';

test.describe('Character shortcode - custom image parameter', () => {
  test('renders resolved image URL, not literal {{ character_image }}', async ({ page }) => {
    await page.goto('/posts/character-shortcodes');
    await page.waitForLoadState('networkidle');

    const html = await page.content();
    expect(html).not.toContain('{{ character_image }}');

    const customImg = page.locator('.character-note .character-avatar img').last();
    const src = await customImg.getAttribute('src');
    expect(src).not.toBeNull();
    expect(src!).not.toContain('{{');
    expect(src!).toMatch(/\/images\/characters\/hooded\.png$/);
  });
});
