# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- JavaScript (ES2017+) - Client-side application logic, build scripts
- HTML5 - Application markup
- CSS3 - Styling with Tailwind CSS framework

**Secondary:**
- Python 3.x - Logo processing and utility scripts (`logo_json.py`, `embed_logos.py`)
- Shell (Bash) - Build automation, deployment validation

## Runtime

**Environment:**
- Node.js 20.x - NPM package management and build tooling
- Python 3.x - Logo processing and deployment tools
- Browser (Client-side) - No backend runtime

**Package Manager:**
- npm (with package-lock.json)
- Lockfile: Present at `/root/workspace/package-lock.json`

## Frameworks

**Core:**
- Fabric.js (canvas manipulation library) - Handles canvas drawing, image manipulation, and layer management
- Tailwind CSS 3.4.0 - Utility-first CSS framework for styling
- jQuery 3.7.1 - DOM manipulation and event handling (kept separate from vendor bundle)

**Testing:**
- Jest 29.7.0 - Unit and integration testing framework
- @playwright/test 1.56.1 - End-to-end and visual regression testing
- @testing-library/dom 9.3.3 - DOM testing utilities

**Build/Dev:**
- esbuild 0.25.5 - JavaScript bundler and minifier
- PostCSS 8.5.6 - CSS processor with autoprefixer and cssnano
- Tailwindcss CLI - CSS framework compilation
- Babel 7.27.x - JavaScript transpiler (@babel/core, @babel/preset-env)
- Chokidar 3.0.0 - File system watcher for development

## Key Dependencies

**Critical:**
- fabric.js - Canvas manipulation, essential for image generation and editing
- qrcode.js - QR code generation capability
- mustache.js - Template rendering for dynamic UI
- imagesloaded - Image loading detection and progress tracking
- masonry - Grid layout library for logo positioning

**Infrastructure:**
- fontfaceobserver - Font loading detection for consistent typography
- cssnano - CSS optimization and minification
- autoprefixer - CSS vendor prefix handling
- esbuild - Fast JavaScript bundling and minification
- pixelmatch - Visual regression test image comparison
- pngjs - PNG image processing for visual regression tests

**Development:**
- jest-environment-jsdom - DOM environment for Jest tests
- babel-jest - Jest transformer for JavaScript code
- @tailwindcss/forms - Tailwind CSS forms plugin for better form styling
- terser-webpack-plugin - JavaScript minification fallback
- nodemon - Development server auto-restart on file changes

## Vendor Libraries (Bundled)

Located in `/root/workspace/vendors/`, bundled into `build/vendors.min.js`:

- Mustache.js - Template rendering
- ImagesLoaded - Image load detection
- Masonry - Grid layouts
- Fabric.js - Canvas manipulation (primary)
- FontFaceObserver - Font loading detection
- QRCode.js - QR code generation
- FontAwesome CSS - Icon library

jQuery is bundled separately as `build/jquery.min.js` due to its core role.

## Configuration

**Environment:**
- No runtime environment variables required
- Application is purely client-side (no backend)
- Development mode detection via `window.location.hostname` check (shows timestamp banner on localhost)
- Pre-deployment SEO configuration: search engines blocked via meta tags

**Build:**
- `tailwind.config.js` - Tailwind CSS theme configuration with GRÜNE brand colors
- `jest.config.js` - Unit test configuration (jsdom environment, code coverage)
- `playwright.config.js` - E2E and visual regression test configuration with parallel execution
- `postcss.config.js` - PostCSS pipeline (Tailwind, Autoprefixer, cssnano)
- `.prettierrc` / `.eslintrc` - Code formatting rules (if present)

**Logo Processing:**
- Python scripts generate JSON indexes: `gemeinden-logos.json`, `bundeslaender-logos.json`, `domains-logos.json`
- Located: `resources/images/logos/index/`
- Generated via `make logo-json` target

## Platform Requirements

**Development:**
- Node.js 20.x with npm
- Python 3.x (for logo processing)
- Make (for build targets)
- Docker (optional - `Dockerfile.claude` provided for containerized development)

**Production:**
- Static file serving (HTTP server)
- Deployment: GitHub Pages (via Actions workflow)
- No server-side code execution required
- No database or external API dependencies

## Build Output

**Production Assets** (in `build/` directory):
- `app.min.css` - Single bundled CSS file (Tailwind + custom styles + vendor CSS)
- `app.min.js` - Minified application JavaScript (esbuild processed)
- `vendors.min.js` - Pre-minified vendor libraries
- `jquery.min.js` - jQuery (separate for legacy compatibility)
- `index.html` - Production HTML with production asset references
- `index-production.html` - Version with embedded logo data (GitHub Pages deployment)
- Source maps: `*.min.js.map`, `*.min.css.map`

**Development Watch Targets:**
- CSS: Auto-rebuild on `resources/css/` changes via `npm run watch:css`
- JS: Timestamp injection on `resources/js/` changes via `npm run watch:js`
- Logo JSON: Regenerated on demand via `make logo-json`

## Deployment

**Hosting Platform:**
- GitHub Pages (production)
- Development server: Python `http.server 8000` (localhost)

**CI/CD Pipeline:**
- GitHub Actions (`.github/workflows/static.yml`)
- Runs on: Ubuntu latest
- Steps: Test → Visual Regression → E2E → Build → Deploy → Post-validation
- Parallel test execution with 6 workers for visual regression tests
- Artifacts retained: 7-14 days depending on test type

## Code Style

**Formatting & Linting:**
- Tailwind CSS utility classes for styling (inline in HTML)
- Custom CSS only when Tailwind utilities insufficient (`resources/css/style.css`)
- JavaScript: ES2017+ syntax, no inline styles
- Build process enforces minification and tree-shaking

**Asset Optimization:**
- CSS compression: cssnano with aggressive optimization
- JS compression: esbuild with whitespace minification, identifier preservation
- Vendor bundle: Pre-minified files concatenated (not re-minified to preserve integrity)
- Console/debugger statements removed from production builds

---

*Stack analysis: 2026-02-26*
