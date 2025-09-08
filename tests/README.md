# Apollo Theme UI Testing

This directory contains comprehensive UI tests for the Apollo Zola theme using Playwright.

## Test Structure

```
tests/
├── theme/               # Theme switching functionality tests
├── navigation/          # Menu and navigation tests
├── content/            # Content rendering and features tests
├── visual/             # Visual regression tests
├── helpers.ts          # Common test utilities
└── screenshots/        # Generated screenshot assets
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure Zola is available (via nix-shell):
   ```bash
   nix-shell
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with interactive UI
npm run test:ui

# Run tests in debug mode (step through tests)
npm run test:debug

# Run tests in headed mode (see browser)
npm run test:headed

# Update visual regression snapshots
npm run test:update-snapshots
```

### Running Specific Test Suites

```bash
# Run only theme tests
npx playwright test tests/theme/

# Run only navigation tests
npx playwright test tests/navigation/

# Run only visual tests
npx playwright test tests/visual/

# Run only content tests
npx playwright test tests/content/
```

## Test Categories

### Theme Switching Tests (`tests/theme/`)
- Verify theme toggle button exists and functions
- Test cycling through light/dark/auto themes
- Validate correct CSS application for each theme
- Ensure theme persistence across page reloads
- Verify visual changes when themes switch

### Navigation Tests (`tests/navigation/`)
- **Menu Navigation**: Verify all navigation links work correctly
- **Table of Contents**: Test TOC generation, navigation, and active highlighting
- **Responsive Navigation**: Ensure navigation works on mobile/tablet
- **Social Links**: Validate social media links and icons

### Content Tests (`tests/content/`)
- **Blog Posts**: Test post listing, pagination, individual post rendering
- **Pages**: Verify homepage, projects page, tags page functionality
- **Advanced Features**: Test MathJax, Mermaid diagrams, code highlighting
- **Search**: Validate search functionality and results
- **Error Handling**: Test 404 pages and error states

### Visual Regression Tests (`tests/visual/`)
- **Theme Comparison**: Screenshots of pages in light/dark themes
- **Responsive Design**: Visual tests across desktop/tablet/mobile viewports
- **Component Consistency**: Ensure UI components render consistently

## Test Helpers

The `helpers.ts` file provides utilities for:
- Page loading and readiness checks
- Theme detection and manipulation
- Navigation verification
- Screenshot capture with consistent naming
- Search functionality testing
- Table of contents validation

## Configuration

### Playwright Config (`playwright.config.ts`)
- Configured to test against multiple browsers (Chromium, Firefox, WebKit)
- Mobile viewport testing (iPhone, Pixel)
- Automatic Zola server startup
- Visual regression threshold settings

### Environment Setup
- NixOS integration with browser management
- Environment variables for Playwright browser paths
- CI-specific configuration for GitHub Actions

## CI/CD Integration

### GitHub Actions (`.github/workflows/ui-tests.yml`)
Tests run automatically on:
- Push to main/develop branches
- Pull requests to main branch

Artifacts uploaded:
- Test reports (always)
- Failed test screenshots (on failure)
- Visual regression comparisons

### Local Development
1. Start development server: `zola serve`
2. Run tests: `npm test`
3. Review test report: `npx playwright show-report`

## Visual Regression Testing

Screenshots are automatically generated and compared against baseline images:

- **Baseline Creation**: First test run creates reference screenshots
- **Comparison**: Subsequent runs compare against baselines
- **Updates**: Use `--update-snapshots` flag to update baselines after intentional changes
- **Threshold**: Configured pixel difference tolerance for minor rendering variations

### Screenshot Naming Convention
- `[page-type]-[theme].png` for theme tests
- `[page-type]-[viewport].png` for responsive tests
- `[component]-[context].png` for component tests

## Troubleshooting

### Common Issues

1. **Browser Installation**: If browsers fail to install, try:
   ```bash
   npx playwright install chromium
   ```

2. **Port Conflicts**: If Zola server fails to start:
   - Ensure port 1111 is available
   - Kill existing Zola processes

3. **Visual Test Failures**: When screenshots differ:
   - Review generated vs expected images in `test-results/`
   - Update snapshots if changes are intentional
   - Check for theme/viewport consistency

4. **NixOS Browser Issues**: If browsers don't launch:
   ```bash
   export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
   export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
   ```

### Debugging Tests

1. **Run in headed mode**: `npm run test:headed`
2. **Use debug mode**: `npm run test:debug`
3. **Add debug points**: `await page.pause()` in test code
4. **Check console**: `await page.screenshot({ path: 'debug.png' })`

## Best Practices

1. **Test Independence**: Each test should be self-contained
2. **Wait for Readiness**: Use `waitForPageReady()` helper
3. **Flexible Assertions**: Handle optional elements gracefully
4. **Visual Consistency**: Update all related snapshots together
5. **Mobile Testing**: Include responsive viewport tests
6. **Error Handling**: Test both success and failure scenarios

## Contributing

When adding new tests:
1. Follow existing patterns and naming conventions
2. Use helper functions from `helpers.ts`
3. Add appropriate visual regression tests
4. Update this README with new test categories
5. Ensure tests pass in CI environment
