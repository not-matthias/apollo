# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Apollo** is a modern, minimalistic blog theme for Zola (a static site generator). The repository includes the theme itself, demonstration content, and comprehensive UI testing infrastructure using Playwright.

- Theme Documentation: See `README.md` for installation and configuration options
- Configuration: `config.toml` contains site-wide settings and theme options
- Test Documentation: Detailed testing information in `tests/README.md`

## Development Environment Setup

The project uses a **Nix flake** for reproducible development. With direnv enabled, the environment is automatically loaded.

```bash
# Manual entry (if direnv not configured)
nix-shell

# Or use direnv
direnv allow
```

Dependencies provided via flake:
- **zola**: Static site generator
- **bun**: JavaScript runtime for Playwright tests and npm scripts
- **pre-commit**: Git hooks enforcement
- **just**: Task runner (alternative to Make)
- **treefmt**: Multi-language code formatter
- **prettier**, **alejandra**, **djlint**: Specific formatters
- **minify**: Asset minification tool

## Common Commands

### Build & Serve

```bash
# Build static site to ./dist
just build

# Serve locally with live reload (development)
bun run serve
# Server runs at http://127.0.0.1:1111

# Build and run Lighthouse performance audit
just lighthouse

# View Lighthouse results
just lighthouse-open

# Clean generated files
just clean
```

### Testing

All tests use **Playwright** and require the dev environment to be active. The Zola server starts automatically during testing.

**⚠️ IMPORTANT: Always run tests in Docker** to match the CI environment exactly and avoid browser compatibility issues on NixOS.

```bash
# Install dependencies first
bun install

# Run all tests in Docker (RECOMMENDED)
bun run test:docker-compose

# Run all tests locally (may have browser issues on NixOS)
bun test

# Run tests with interactive UI
bun run test:ui

# Run tests with browser visible (headed mode)
bun run test:headed

# Debug specific test (step through)
bun run test:debug

# Update visual regression baselines (after intentional changes)
# IMPORTANT: Always use Docker to ensure consistent screenshots
docker-compose -f docker-compose.test.yml run --rm playwright-tests npm run test:update-snapshots

# Run specific test suite
bunx playwright test tests/theme/         # Theme tests only
bunx playwright test tests/navigation/    # Navigation tests only
bunx playwright test tests/visual/        # Visual regression tests only
bunx playwright test tests/content/       # Content rendering tests only
```

Test reports are generated in `playwright-report/` and can be viewed with:
```bash
bunx playwright show-report
```

### Code Formatting

The project uses **treefmt** with language-specific formatters:

```bash
# Format all tracked files
treefmt

# Format specific file types
prettier --write "sass/**/*.scss"  # SCSS
djlint --reformat templates/       # HTML
alejandra --check *.nix            # Nix
```

Pre-commit hooks automatically run formatting on git commit (see `.pre-commit-config.yaml`).

## Project Architecture

### Directory Structure

```
apollo/
├── content/              # Site content (blog posts, projects, pages)
│   ├── posts/           # Blog post markdown files
│   ├── projects/        # Projects page content
│   ├── talks/          # Talks page content
│   └── _index.md       # Homepage
├── sass/                # Theme styling (SCSS)
│   ├── main.scss       # Main stylesheet entry point
│   ├── parts/          # Component styles
│   ├── theme/          # Theme-specific styles (light/dark)
│   └── fonts.scss      # Font definitions
├── static/             # Static assets (favicons, images, etc.)
├── tests/              # Playwright UI tests
│   ├── theme/          # Theme switching tests
│   ├── navigation/     # Menu and TOC tests
│   ├── content/        # Content rendering tests
│   ├── visual/         # Visual regression tests
│   ├── helpers.ts      # Common test utilities
│   └── screenshots/    # Baseline screenshots for visual tests
├── config.toml         # Zola configuration (site settings, theme options)
├── flake.nix          # Nix development environment
├── playwright.config.ts # Playwright test configuration
└── Justfile           # Task automation

```

### Key Configuration Files

**config.toml**: Site configuration and theme settings
- `theme = "toggle"`: Theme switching behavior (light/dark/auto/toggle)
- `build_search_index = true`: Enables site search
- `compile_sass = true`: Builds CSS from SCSS
- `taxonomies = [{ name = "tags" }]`: Tag system for posts
- `[extra]` section: Theme-specific features (MathJax, Mermaid, analytics, etc.)

**playwright.config.ts**: Test configuration
- Runs against multiple browsers (Chromium, Firefox, WebKit)
- Tests mobile viewports (iPhone 12, Pixel 5)
- Visual regression threshold: 2% max pixel difference
- Base URL: `http://127.0.0.1:1111` (Zola dev server)
- Auto-starts Zola before running tests

### Testing Architecture

**Test Organization**:
- **Theme Tests** (`tests/theme/`): Theme switcher functionality, CSS application, persistence
- **Navigation Tests** (`tests/navigation/`): Menu links, Table of Contents, responsive behavior
- **Content Tests** (`tests/content/`): Blog posts, pages, search, special features (MathJax, Mermaid)
- **Visual Tests** (`tests/visual/`): Visual regression with screenshot comparisons across themes and viewports

**Helper Utilities** (`tests/helpers.ts`):
- `waitForPageReady()`: Wait for Zola page to fully load
- Theme detection and manipulation functions
- Screenshot capture helpers with consistent naming
- Navigation verification utilities

**Visual Regression Testing**:
- Baselines stored in `tests/visual/[test-name].spec.ts-snapshots/`
- Pixel difference tolerance: 2% (configurable in Playwright config)
- Screenshot naming: `[page-type]-[theme]-[device].png`
- Use `--update-snapshots` flag to regenerate baselines after intentional design changes

## Important Notes

### Theme as Submodule

The Apollo theme itself is managed as a Git submodule (if this is a user's blog site) or is the theme source being developed. Check `.gitmodules` if unsure.

### Build Output

- **dist/**: Production-ready static files (minified)
- **public/**: Local development build (not minified)
- Both are excluded from git

### CI/CD

- GitHub Actions automatically runs tests on push and PRs
- Uses `.github/workflows/` for test and build automation
- Test artifacts (reports, screenshots) uploaded on failure
- Lighthouse CI runs performance audits

### Pre-commit Hooks

The following checks run before each commit (see `.pre-commit-config.yaml`):
- Large files check (>100KB)
- TOML/YAML validation
- Trailing whitespace removal
- Merge conflict detection
- **treefmt** formatting

### Content Organization

- Blog posts: `content/posts/*.md` (use frontmatter for metadata)
- Pages: Top-level markdown files in `content/`
- Features: Menu links configured in `config.toml` under `[extra.menu]`
- Tags/Taxonomies: Use `tags = ["tag-name"]` in post frontmatter

### Theme Features

Apollo includes:
- Light/dark/auto/toggle theme switching
- Syntax highlighting (CSS-based, dual themes)
- MathJax support for equations
- Mermaid diagram rendering
- Search functionality
- RSS feeds
- Table of Contents generation
- Social media links
- Analytics integration (GoatCounter, Umami, Google Analytics)

## Key Development Workflows

### Adding a New Blog Post

1. Create markdown file in `content/posts/`
2. Include frontmatter with `title`, `date`, optional `tags`
3. Run `bun run serve` to preview
4. Commit when ready

### Making Theme Changes

1. Edit SCSS in `sass/` directory
2. Changes auto-compile via `zola serve`
3. Run `bun test` to ensure visual tests pass
4. Update snapshots if changes are intentional: `bun run test:update-snapshots`
   - If Playwright issues occur on NixOS, use Docker instead: `npm run test:update-snapshots-docker`
5. Commit both code changes and snapshot updates

### Running Tests Locally

1. Ensure dev environment is active: `nix-shell`
2. Install dependencies: `bun install`
3. Run tests: `bun test`
4. Review failures in `playwright-report/`
5. Debug with `bun run test:headed` or `bun run test:debug`

### Deploying

1. Run full CI locally: `just ci` (builds + Lighthouse audit)
2. Push to main branch - GitHub Actions handles deployment
3. Monitor test results in PR/commit status

## Formatting & Standards

- **SCSS**: Prettier (configured in treefmt.toml)
- **HTML/Templates**: djlint with CSS and JS formatting
- **Nix**: alejandra
- **Auto-formatting**: Git pre-commit hooks enforce these

Run `treefmt` before committing to catch any formatting issues.
