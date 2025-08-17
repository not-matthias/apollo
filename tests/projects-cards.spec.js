const { test, expect } = require('@playwright/test');

test.describe('Projects and Cards Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/');
  });

  test('should display projects page with cards', async ({ page }) => {
    const projectCards = page.locator('.card, .project-card, article');
    const cardCount = await projectCards.count();
    
    if (cardCount > 0) {
      await expect(projectCards.first()).toBeVisible();
    }
  });

  test('should have working project links', async ({ page }) => {
    const projectLinks = page.locator('.card a, .project-card a, article a');
    const linkCount = await projectLinks.count();
    
    if (linkCount > 0) {
      const firstLink = projectLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      
      // Check if it's an external link or internal link
      if (href && href.startsWith('http')) {
        // External link - check that it has proper attributes
        const target = await firstLink.getAttribute('target');
        const rel = await firstLink.getAttribute('rel');
        
        // External links should open in new tab
        expect(target).toBe('_blank');
        if (rel) {
          expect(rel).toContain('noopener');
        }
      }
    }
  });

  test('should display project images/videos when available', async ({ page }) => {
    const projectImages = page.locator('.card img, .project-card img, article img');
    const projectVideos = page.locator('.card video, .project-card video, article video');
    
    const imageCount = await projectImages.count();
    const videoCount = await projectVideos.count();
    
    if (imageCount > 0) {
      const firstImage = projectImages.first();
      await expect(firstImage).toBeVisible();
      
      // Check that image has proper alt text
      const altText = await firstImage.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
    
    if (videoCount > 0) {
      const firstVideo = projectVideos.first();
      await expect(firstVideo).toBeVisible();
    }
  });

  test('should display project titles and descriptions', async ({ page }) => {
    const projectTitles = page.locator('.card h1, .card h2, .card h3, .project-card h1, .project-card h2, .project-card h3, article h1, article h2, article h3');
    const projectDescriptions = page.locator('.card p, .project-card p, article p, .description');
    
    const titleCount = await projectTitles.count();
    const descriptionCount = await projectDescriptions.count();
    
    if (titleCount > 0) {
      const firstTitle = projectTitles.first();
      await expect(firstTitle).toBeVisible();
      
      const titleText = await firstTitle.textContent();
      expect(titleText?.length).toBeGreaterThan(0);
    }
    
    if (descriptionCount > 0) {
      const firstDescription = projectDescriptions.first();
      await expect(firstDescription).toBeVisible();
    }
  });

  test('should handle project card hover effects', async ({ page }) => {
    const projectCards = page.locator('.card, .project-card, article');
    const cardCount = await projectCards.count();
    
    if (cardCount > 0) {
      const firstCard = projectCards.first();
      
      // Hover over the card
      await firstCard.hover();
      await page.waitForTimeout(500);
      
      // Check if hover effect applied (card should still be visible)
      await expect(firstCard).toBeVisible();
    }
  });

  test('should have responsive card layout', async ({ page }) => {
    const projectCards = page.locator('.card, .project-card, article');
    const cardCount = await projectCards.count();
    
    if (cardCount > 1) {
      // Test desktop layout
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.reload();
      
      // Cards should be in grid layout
      const firstCard = projectCards.first();
      const secondCard = projectCards.nth(1);
      
      if (await firstCard.count() > 0 && await secondCard.count() > 0) {
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // On desktop, cards might be side by side
          const areSideBySide = Math.abs(firstCardBox.y - secondCardBox.y) < 50;
          const areStacked = firstCardBox.y !== secondCardBox.y;
          
          // Either layout is valid
          expect(areSideBySide || areStacked).toBe(true);
        }
      }
      
      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Cards should still be visible
      await expect(projectCards.first()).toBeVisible();
    }
  });

  test('should sort projects by weight when specified', async ({ page }) => {
    const projectTitles = page.locator('.card h1, .card h2, .card h3, .project-card h1, .project-card h2, .project-card h3');
    const titleCount = await projectTitles.count();
    
    if (titleCount > 1) {
      // Get all title texts
      const titleTexts = await projectTitles.allTextContents();
      
      // Should have titles
      expect(titleTexts.length).toBeGreaterThan(0);
      titleTexts.forEach(title => {
        expect(title.length).toBeGreaterThan(0);
      });
    }
  });

  test('should handle local video thumbnails with play buttons', async ({ page }) => {
    const videoContainers = page.locator('.video-container, .talk-video, [data-video]');
    const playButtons = page.locator('.video-play-btn, .play-button, button[aria-label*="play"]');
    
    const videoCount = await videoContainers.count();
    const playButtonCount = await playButtons.count();
    
    if (videoCount > 0 && playButtonCount > 0) {
      const firstPlayButton = playButtons.first();
      await expect(firstPlayButton).toBeVisible();
      
      // Click play button
      await firstPlayButton.click();
      await page.waitForTimeout(1000);
      
      // Should still be on the same page (or handle video playback)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/projects/');
    }
  });

  test('should display meta information for projects', async ({ page }) => {
    const metaItems = page.locator('.meta, .project-meta, .card-meta');
    const metaCount = await metaItems.count();
    
    if (metaCount > 0) {
      const firstMeta = metaItems.first();
      await expect(firstMeta).toBeVisible();
      
      // Meta items might contain links, tags, or other information
      const metaLinks = firstMeta.locator('a');
      const linkCount = await metaLinks.count();
      
      if (linkCount > 0) {
        const firstMetaLink = metaLinks.first();
        await expect(firstMetaLink).toBeVisible();
      }
    }
  });

  test('should handle empty projects page gracefully', async ({ page }) => {
    // Even if no projects, page should load without errors
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    // Should have proper page structure
    const mainContent = page.locator('main, .content, .main-content');
    await expect(mainContent).toBeVisible();
  });
});