import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers';

test.describe('Tag Alignment in Project Cards', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/projects');
    await helpers.waitForPageReady();
  });

  test('tags should be aligned to the right when there are no github/demo links', async ({ page }) => {
    // Find the card for "Example Project Without Links"
    const projectCard = page.locator('.card', { has: page.locator('h1:has-text("Example Project Without Links")') });

    // Verify the card exists
    await expect(projectCard).toBeVisible();

    // Get the card footer
    const cardFooter = projectCard.locator('.card-footer');
    await expect(cardFooter).toBeVisible();

    // Verify there are no card links (github/demo buttons)
    const cardLinks = cardFooter.locator('.card-links');
    await expect(cardLinks).not.toBeVisible();

    // Verify there are tags
    const cardTags = cardFooter.locator('.card-tags');
    await expect(cardTags).toBeVisible();

    const tags = cardTags.locator('.card-tag');
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThan(0);

    // Get the bounding boxes
    const footerBox = await cardFooter.boundingBox();
    const tagsBox = await cardTags.boundingBox();

    expect(footerBox).toBeTruthy();
    expect(tagsBox).toBeTruthy();

    if (footerBox && tagsBox) {
      // Tags should be aligned to the right (right edge should be close to footer's right edge)
      const footerRight = footerBox.x + footerBox.width;
      const tagsRight = tagsBox.x + tagsBox.width;

      // Allow a small margin for padding (20px is the card padding)
      const rightMargin = footerBox.width * 0.1; // 10% tolerance
      expect(tagsRight).toBeGreaterThan(footerRight - rightMargin);
    }
  });

  test('tags should still be aligned to the right when github/demo links are present', async ({ page }) => {
    // Find a card that has both links and tags (e.g., "Apollo" project)
    const projectCard = page.locator('.card', { has: page.locator('h1:has-text("Apollo")') });

    // Verify the card exists
    await expect(projectCard).toBeVisible();

    // Get the card footer
    const cardFooter = projectCard.locator('.card-footer');
    await expect(cardFooter).toBeVisible();

    // Verify there are card links
    const cardLinks = cardFooter.locator('.card-links');
    await expect(cardLinks).toBeVisible();

    // Verify there are tags
    const cardTags = cardFooter.locator('.card-tags');
    await expect(cardTags).toBeVisible();

    // Get the bounding boxes
    const footerBox = await cardFooter.boundingBox();
    const tagsBox = await cardTags.boundingBox();

    expect(footerBox).toBeTruthy();
    expect(tagsBox).toBeTruthy();

    if (footerBox && tagsBox) {
      // Tags should be aligned to the right (right edge should be close to footer's right edge)
      const footerRight = footerBox.x + footerBox.width;
      const tagsRight = tagsBox.x + tagsBox.width;

      // Allow a small margin for padding
      const rightMargin = footerBox.width * 0.1; // 10% tolerance
      expect(tagsRight).toBeGreaterThan(footerRight - rightMargin);
    }
  });
});
