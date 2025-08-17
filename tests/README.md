# Apollo Theme - Playwright Tests

This directory contains comprehensive unit and integration tests for the Apollo Zola theme using Playwright.

## Test Structure

The test suite is organized into several test files, each focusing on specific functionality:

### Test Files

- **`example.spec.js`** - Basic homepage screenshot test (original)
- **`search.spec.js`** - Search functionality tests using ElasticLunr
- **`theme-toggle.spec.js`** - Theme switching functionality tests
- **`table-of-contents.spec.js`** - Table of contents navigation tests
- **`analytics.spec.js`** - GoatCounter analytics and tracking tests
- **`main-features.spec.js`** - Main page features and navigation tests
- **`javascript-modules.spec.js`** - JavaScript module unit tests
- **`projects-cards.spec.js`** - Projects/cards page functionality tests

### Configuration

- **`playwright.config.js`** - Playwright configuration with multiple browser support
- **`package.json`** - Dependencies and test scripts

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run install
   ```

3. Install system dependencies (if needed):
   ```bash
   npm run install:deps
   ```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
npm run test:search      # Search functionality
npm run test:theme       # Theme toggle
npm run test:toc         # Table of contents
npm run test:analytics   # Analytics/tracking
npm run test:main        # Main features
npm run test:js          # JavaScript modules
npm run test:projects    # Projects page
```

### Browser-Specific Tests
```bash
npm run test:chromium    # Chrome only
npm run test:firefox     # Firefox only  
npm run test:webkit      # Safari only
npm run test:mobile      # Mobile browsers
```

### Debug and Development
```bash
npm run test:ui          # Interactive UI mode
npm run test:debug       # Debug mode
npm run test:headed      # Run with browser UI visible
```

### Reports
```bash
npm run report           # View test report
```

## Test Features

### Search Functionality Tests
- Search input visibility and interaction
- ElasticLunr search engine functionality
- Search results display and clearing
- Search index loading and querying

### Theme Toggle Tests
- Theme button visibility and interaction  
- Theme switching between light/dark modes
- LocalStorage persistence of theme selection
- CSS class application for themes
- System theme preference respect

### Table of Contents Tests
- TOC visibility on content pages
- Clickable TOC links and navigation
- Scroll-to-section functionality
- Current section highlighting
- Scroll-based TOC updates
- Nested heading support
- Intersection Observer functionality

### Analytics Tests
- GoatCounter script loading
- Bot traffic detection
- Localhost traffic filtering
- Page counting functionality
- URL generation for tracking
- LocalStorage skip settings
- Canonical URL handling
- SendBeacon and fallback methods

### Main Features Tests
- Navigation menu functionality
- Social links display
- Page titles and meta descriptions
- JavaScript loading without errors
- Responsive design testing
- MathJax rendering (if enabled)
- RSS feed links
- Article/post display
- Pagination functionality
- Favicon loading
- Heading hierarchy
- Code syntax highlighting

### JavaScript Module Tests
- Module loading verification
- Dynamic notes functionality
- Mermaid diagram support
- Code block enhancements
- ElasticLunr pipeline testing
- Stopword filtering
- Configuration functionality
- Error-free loading
- DOM ready functionality

### Projects/Cards Page Tests
- Project cards display
- Project links functionality
- Image and video thumbnails
- Project titles and descriptions
- Card hover effects
- Responsive layout
- Project sorting by weight
- Video play buttons
- Meta information display
- Empty page handling

## Browser Support

Tests run on multiple browsers:
- **Chromium** (Chrome-based browsers)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5 viewport)
- **Mobile Safari** (iPhone 12 viewport)

## Prerequisites

The test suite assumes:
1. Zola static site generator is available (`zola serve` command)
2. Apollo theme is properly configured
3. Site is accessible at `http://localhost:1111`

## Test Configuration

The tests are designed to:
- Handle missing features gracefully (many tests check if functionality exists before testing)
- Work with different Apollo theme configurations
- Test both desktop and mobile viewports
- Provide comprehensive coverage of JavaScript functionality
- Validate accessibility and user experience features

## Continuous Integration

Tests can be run in CI environments with:
- Automatic browser installation
- Headless mode by default
- Retry logic for flaky tests
- HTML report generation
- Trace collection on failures

## Troubleshooting

If tests fail:
1. Ensure Zola is running on `http://localhost:1111`
2. Check that all theme features are enabled in `config.toml`
3. Verify JavaScript files are loading without errors
4. Check browser console for JavaScript errors
5. Use debug mode to step through failing tests

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Use descriptive test names and organize into logical groups
3. Handle optional features gracefully with feature detection
4. Add appropriate waits for dynamic content
5. Test both positive and negative scenarios
6. Update this README when adding new test categories