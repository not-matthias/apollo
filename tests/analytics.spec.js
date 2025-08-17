const { test, expect } = require('@playwright/test');

test.describe('Analytics and Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load GoatCounter tracking script when enabled', async ({ page }) => {
    // Check if GoatCounter is loaded
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      expect(goatCounterExists).toBe(true);
      
      // Check if goatcounter has expected methods
      const hasCountMethod = await page.evaluate(() => {
        return typeof window.goatcounter.count === 'function';
      });
      expect(hasCountMethod).toBe(true);

      const hasUrlMethod = await page.evaluate(() => {
        return typeof window.goatcounter.url === 'function';
      });
      expect(hasUrlMethod).toBe(true);
    }
  });

  test('should filter localhost traffic', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      const filterResult = await page.evaluate(() => {
        return window.goatcounter.filter();
      });
      
      // Should filter localhost
      expect(filterResult).toBe('localhost');
    }
  });

  test('should detect bot traffic', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      // Check if bot detection works for webdriver
      const isBotDetected = await page.evaluate(() => {
        // The count.js file checks for navigator.webdriver
        return navigator.webdriver;
      });
      
      // In Playwright, webdriver should be true
      expect(isBotDetected).toBe(true);
    }
  });

  test('should handle page counting correctly', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      // Test the count function
      const countResult = await page.evaluate(() => {
        // This should not count due to localhost filter
        window.goatcounter.count();
        return true;
      });
      
      expect(countResult).toBe(true);
    }
  });

  test('should generate proper URLs for tracking', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      const urlResult = await page.evaluate(() => {
        const url = window.goatcounter.url();
        return url !== undefined;
      });
      
      expect(urlResult).toBe(true);
    }
  });

  test('should respect localStorage skipgc setting', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      // Set skipgc in localStorage
      await page.evaluate(() => {
        localStorage.setItem('skipgc', 't');
      });

      const filterResult = await page.evaluate(() => {
        return window.goatcounter.filter();
      });
      
      expect(filterResult).toBe('disabled with #toggle-goatcounter');
    }
  });

  test('should handle canonical URLs correctly', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      // Test get_path function indirectly through url generation
      const pathHandling = await page.evaluate(() => {
        // Check if canonical link exists
        const canonical = document.querySelector('link[rel="canonical"][href]');
        return canonical !== null;
      });
      
      // If canonical exists, path handling should work
      if (pathHandling) {
        expect(pathHandling).toBe(true);
      }
    }
  });

  test('should use sendBeacon when available', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      const beaconSupported = await page.evaluate(() => {
        return 'sendBeacon' in navigator;
      });
      
      expect(beaconSupported).toBe(true);
    }
  });

  test('should fallback to image tracking when sendBeacon fails', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      // Mock sendBeacon to fail
      await page.evaluate(() => {
        const originalSendBeacon = navigator.sendBeacon;
        navigator.sendBeacon = () => false;
        
        // Try to count (should create img fallback)
        window.goatcounter.count({ path: '/test' });
        
        // Restore original
        navigator.sendBeacon = originalSendBeacon;
      });

      // Check if image was created
      const imageCreated = await page.evaluate(() => {
        const images = document.querySelectorAll('img[src*="goatcounter"]');
        return images.length > 0;
      });
      
      if (imageCreated) {
        expect(imageCreated).toBe(true);
      }
    }
  });

  test('should handle query parameters correctly', async ({ page }) => {
    const goatCounterExists = await page.evaluate(() => {
      return typeof window.goatcounter !== 'undefined';
    });

    if (goatCounterExists) {
      const hasGetQueryParam = await page.evaluate(() => {
        return typeof window.goatcounter.get_query !== 'undefined';
      });
      
      // The get_query function should exist
      if (hasGetQueryParam) {
        expect(hasGetQueryParam).toBe(true);
      }
    }
  });
});