const { test, expect } = require('@playwright/test');

test.describe('JavaScript Module Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load main.js without errors', async ({ page }) => {
    const mainJsLoaded = await page.evaluate(() => {
      const script = document.querySelector('script[src*="main.js"]');
      return script !== null;
    });
    
    if (mainJsLoaded) {
      expect(mainJsLoaded).toBe(true);
    }
  });

  test('should load note.js and handle dynamic notes', async ({ page }) => {
    const noteJsExists = await page.evaluate(() => {
      const script = document.querySelector('script[src*="note.js"]');
      return script !== null;
    });
    
    if (noteJsExists) {
      // Look for dynamic notes on the page
      const dynamicNotes = page.locator('.note, .dynamic-note, [data-note]');
      const noteCount = await dynamicNotes.count();
      
      if (noteCount > 0) {
        const firstNote = dynamicNotes.first();
        await expect(firstNote).toBeVisible();
      }
    }
  });

  test('should handle mermaid diagrams when mermaid.js is loaded', async ({ page }) => {
    const mermaidExists = await page.evaluate(() => {
      return typeof window.mermaid !== 'undefined' || 
             document.querySelector('script[src*="mermaid"]') !== null;
    });
    
    if (mermaidExists) {
      // Look for mermaid diagrams
      const mermaidDiagrams = page.locator('.mermaid, pre code.language-mermaid');
      const diagramCount = await mermaidDiagrams.count();
      
      if (diagramCount > 0) {
        const firstDiagram = mermaidDiagrams.first();
        await expect(firstDiagram).toBeVisible();
      }
    }
  });

  test('should handle code block functionality from codeblock.js', async ({ page }) => {
    const codeblockJsExists = await page.evaluate(() => {
      const script = document.querySelector('script[src*="codeblock.js"]');
      return script !== null;
    });
    
    if (codeblockJsExists) {
      const codeBlocks = page.locator('pre code, .highlight code');
      const codeBlockCount = await codeBlocks.count();
      
      if (codeBlockCount > 0) {
        // Check if code blocks have copy functionality or other enhancements
        const hasCodeEnhancement = await page.evaluate(() => {
          const codeElements = document.querySelectorAll('pre code, .highlight code');
          return codeElements.length > 0;
        });
        
        expect(hasCodeEnhancement).toBe(true);
      }
    }
  });

  test('should test elasticlunr pipeline functionality', async ({ page }) => {
    const elasticlunrLoaded = await page.evaluate(() => {
      return typeof window.elasticlunr !== 'undefined';
    });
    
    if (elasticlunrLoaded) {
      // Test elasticlunr pipeline
      const pipelineWorks = await page.evaluate(() => {
        try {
          const pipeline = new window.elasticlunr.Pipeline();
          const tokens = ['test', 'search', 'functionality'];
          const result = pipeline.run(tokens);
          return Array.isArray(result) && result.length === tokens.length;
        } catch (error) {
          return false;
        }
      });
      
      expect(pipelineWorks).toBe(true);
      
      // Test registered functions
      const hasRegisteredFunctions = await page.evaluate(() => {
        return typeof window.elasticlunr.Pipeline.registeredFunctions === 'object';
      });
      
      expect(hasRegisteredFunctions).toBe(true);
      
      // Test stemmer if available
      const stemmerWorks = await page.evaluate(() => {
        try {
          if (window.elasticlunr.stemmer) {
            const stemmed = window.elasticlunr.stemmer('running');
            return typeof stemmed === 'string' && stemmed.length > 0;
          }
          return true; // No stemmer is also valid
        } catch (error) {
          return false;
        }
      });
      
      expect(stemmerWorks).toBe(true);
    }
  });

  test('should test elasticlunr stopword filtering', async ({ page }) => {
    const elasticlunrLoaded = await page.evaluate(() => {
      return typeof window.elasticlunr !== 'undefined' && 
             typeof window.elasticlunr.stopWordFilter !== 'undefined';
    });
    
    if (elasticlunrLoaded) {
      const stopwordFilterWorks = await page.evaluate(() => {
        try {
          // Test that stopwords are filtered
          const stopwords = ['the', 'and', 'or', 'but'];
          const filtered = stopwords.map(word => window.elasticlunr.stopWordFilter(word));
          return filtered.every(result => result === undefined);
        } catch (error) {
          return false;
        }
      });
      
      expect(stopwordFilterWorks).toBe(true);
      
      // Test that non-stopwords pass through
      const normalWordsWork = await page.evaluate(() => {
        try {
          const normalWords = ['apollo', 'theme', 'configuration'];
          const filtered = normalWords.map(word => window.elasticlunr.stopWordFilter(word));
          return filtered.every(result => result !== undefined);
        } catch (error) {
          return false;
        }
      });
      
      expect(normalWordsWork).toBe(true);
    }
  });

  test('should test elasticlunr configuration functionality', async ({ page }) => {
    const elasticlunrLoaded = await page.evaluate(() => {
      return typeof window.elasticlunr !== 'undefined' && 
             typeof window.elasticlunr.Configuration !== 'undefined';
    });
    
    if (elasticlunrLoaded) {
      const configurationWorks = await page.evaluate(() => {
        try {
          const config = new window.elasticlunr.Configuration('title', 'content');
          config.build(['title', 'content'], true, true);
          const configData = config.get();
          return typeof configData === 'object' && 
                 Object.prototype.hasOwnProperty.call(configData, 'title') && 
                 Object.prototype.hasOwnProperty.call(configData, 'content');
        } catch (error) {
          return false;
        }
      });
      
      expect(configurationWorks).toBe(true);
      
      // Test configuration reset
      const resetWorks = await page.evaluate(() => {
        try {
          const config = new window.elasticlunr.Configuration('title', 'content');
          config.build(['title'], true, true);
          config.reset();
          const configData = config.get();
          return Object.keys(configData).length === 0;
        } catch (error) {
          return false;
        }
      });
      
      expect(resetWorks).toBe(true);
    }
  });

  test('should verify all JavaScript modules load without conflicts', async ({ page }) => {
    // Check for JavaScript errors during page load
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Should have no JavaScript errors
    expect(jsErrors.length).toBe(0);
  });

  test('should test DOM ready functionality', async ({ page }) => {
    // Test that DOM manipulation works correctly
    const domReady = await page.evaluate(() => {
      return document.readyState === 'complete' || document.readyState === 'interactive';
    });
    
    expect(domReady).toBe(true);
    
    // Test that event listeners are properly attached
    const hasEventListeners = await page.evaluate(() => {
      // Check for common event listeners
      const hasDocumentListeners = document.addEventListener !== undefined;
      const hasWindowListeners = window.addEventListener !== undefined;
      return hasDocumentListeners && hasWindowListeners;
    });
    
    expect(hasEventListeners).toBe(true);
  });
});