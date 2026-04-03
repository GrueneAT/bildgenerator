# Codebase Map — bildgenerator

> Generated: 2026-04-03 | Use `/issue:map` to regenerate

## Overview

Browser-based image generator for GRÜNE (Austrian Green Party) political materials. Vanilla JavaScript + jQuery frontend using Fabric.js for canvas manipulation, Tailwind CSS for styling. No backend — purely client-side. Deployed to GitHub Pages via CI/CD.

**Stack:** JavaScript (ES6), jQuery, Fabric.js, Tailwind CSS, Bootstrap Select/Colorpicker
**Build:** Node.js scripts (JS/CSS bundling), Tailwind CLI
**Tests:** Jest (unit/integration), Playwright (visual regression + e2e)
**CI/CD:** GitHub Actions → GitHub Pages

## Application Code (`resources/js/`)

| Module | LOC | Purpose |
|---|---|---|
| `qrcode/qrcode-wizard.js` | 541 | QR code wizard UI flow |
| `qrcode/qrcode-helpers.js` | 504 | QR code utility functions |
| `qrcode/qrcode-generator.js` | 484 | QR code canvas generation |
| `qrcode/qrcode-handlers.js` | 348 | QR code event handlers |
| `main.js` | 430 | Global state, template configs, core utils |
| `event-handlers.js` | 430 | UI event handler registration |
| `wizard.js` | 429 | 4-step wizard navigation and validation |
| `canvas-utils.js` | 405 | Canvas snapping, alignment, manipulation |
| `searchable-select.js` | 310 | Enhanced select component with search |
| `constants.js` | 278 | Template definitions, sizing constants |
| `alert-system.js` | 243 | Toast/alert notification system |
| `validation.js` | 192 | Input validation logic |
| `handlers.js` | 103 | Legacy event handlers |
| `helpers.js` | 70 | General utility functions |
| `modal.js` | 56 | Modal dialog management |
| `logo-state.js` | 46 | Logo visibility/selection state |
| `choice-image.js` | 45 | Image selection and upload |
| `initialization.js` | 20 | App bootstrap/DOM ready |
| **Total** | **4,934** | |

## Stylesheets (`resources/css/`)

| File | LOC | Purpose |
|---|---|---|
| `style.css` | 514 | Custom GRÜNE styles and overrides |
| `input.css` | 208 | Tailwind CSS source with directives |
| `lato-font.css` | 90 | Lato font-face declarations |
| `fonts.css` | 26 | Gotham Narrow font-face declarations |
| `output.css` | 0 | Compiled Tailwind output (generated) |

## HTML Entry Points

| File | LOC | Purpose |
|---|---|---|
| `index.html` | 1,229 | Development entry point |
| `index-production.html` | 1,758 | Production build with bundled assets |

## Vendor Libraries (`vendors/`)

| Library | Purpose |
|---|---|
| `jquery` | DOM manipulation (loaded separately) |
| `fabric-js` | Canvas rendering and manipulation |
| `mustache` | Template rendering |
| `fontfaceobserver` | Font loading detection |
| `imagesloaded` | Image loading callbacks |
| `masonry` | Grid layout |
| `fontawesome` | Icon set |
| `qrcode.min.js` | QR code generation |

## Logo System (`resources/images/logos/`)

| Directory | Purpose |
|---|---|
| `gemeinden/` | Municipal logos |
| `bundeslaender/` | State/federal logos |
| `domains/` | Domain-specific logos |
| `index/` | JSON indexes (`gemeinden-logos.json`, `bundeslaender-logos.json`, `domains-logos.json`) |
| `index.json` | Master logo index |

## Tests

### Unit & Integration (`tests/`) — 1,913 LOC

| File | LOC | Purpose |
|---|---|---|
| `unit/canvas-utils-snap.test.js` | 452 | Canvas snapping logic |
| `integration/snapping-integration.test.js` | 397 | Snapping end-to-end |
| `integration/logo-processing-integration.test.js` | 339 | Logo loading and processing |
| `unit/validation.test.js` | 230 | Input validation |
| `integration/searchable-select-integration.test.js` | 203 | Searchable select component |
| `unit/logo-toggle.test.js` | 148 | Logo toggle visibility |
| `setup.js` | 144 | Jest test setup/mocks |

### Visual Regression (`visual-regression/tests/`) — 3,810 LOC

| File | LOC | Category |
|---|---|---|
| `qr-generator.spec.js` | 541 | complex |
| `positioning.spec.js` | 536 | medium |
| `qr-transparency.spec.js` | 479 | complex |
| `logo-text-positioning.spec.js` | 409 | medium |
| `logo-toggle.spec.js` | 362 | medium |
| `error-handling.spec.js` | 359 | complex |
| `test-utils.js` | 292 | shared utilities |
| `templates.spec.js` | 197 | complex |
| `text-system.spec.js` | 161 | medium |
| `background-images.spec.js` | 152 | medium |
| `wizard-navigation.spec.js` | 98 | complex |
| `layouts.spec.js` | 80 | fast |
| `elements.spec.js` | 54 | fast |
| `qr-codes.spec.js` | 47 | medium |
| `core-functionality.spec.js` | 43 | fast |

### E2E (`e2e/`) — 885 LOC

| File | LOC | Purpose |
|---|---|---|
| `canvas-operations.spec.js` | 248 | Canvas drag/drop/resize |
| `complete-wizard-flow.spec.js` | 186 | Full wizard walkthrough |
| `qr-code-integration.spec.js` | 144 | QR code full flow |
| `template-operations.spec.js` | 70 | Template switching |
| `responsive-design.spec.js` | 48 | Responsive breakpoints |
| `basic-functionality.spec.js` | 47 | Smoke tests |
| `accessibility.spec.js` | 45 | A11y checks |
| `wizard-flow.spec.js` | 34 | Wizard step navigation |
| `logo-selection.spec.js` | 32 | Logo picker |
| `image-generation.spec.js` | 31 | Image export |

## Build Scripts (`scripts/`) — 1,036 LOC

| Script | LOC | Purpose |
|---|---|---|
| `validate-deployment.sh` | 385 | Post-deploy validation checks |
| `build-js.js` | 218 | Bundle vendor + app JS |
| `build.js` | 171 | Master build orchestrator |
| `build-css.js` | 127 | Bundle vendor + app CSS |
| `generate-reference-images.sh` | 80 | Visual regression baselines |
| `inject-build-timestamp.js` | 55 | Cache-busting timestamps |

## Commands

### Development (6)
- `make docker-dev` — Docker dev server with file watching
- `make dev` — Local dev server with auto-rebuild
- `make server` — Python HTTP server on :8000
- `make logo-json` — Regenerate logo JSON indexes
- `npm run build-css` — Tailwind CSS watch mode
- `npm run build` — Full production build

### Testing (20+)
- `npm test` — Jest unit/integration tests
- `npm run test:e2e` — Playwright e2e tests
- `npm run test:visual` — All visual regression (fast + medium + complex)
- `npm run test:visual-fast` / `test:visual-medium` / `test:visual-complex` — By category
- `npm run test:visual-parallel` — Visual tests with 6 workers
- Individual visual test commands per spec file

### Build (6)
- `npm run build` — Full build (JS + CSS + HTML)
- `npm run build:js` — Bundle JS only
- `npm run build:css` — Bundle CSS only
- `npm run build:clean` — Clean rebuild
- `npm run validate:deployment` — Post-deploy checks

## CI/CD (`.github/workflows/static.yml`)

GitHub Actions pipeline:
1. **Unit tests** — Jest with coverage
2. **Visual regression** — Playwright parallel projects (fast/medium/complex)
3. **E2E tests** — Playwright e2e project
4. **Build** — Production bundle
5. **Deploy** — GitHub Pages (main branch only)

Supports manual baseline update via `workflow_dispatch`.

## Architecture Patterns

- **No framework** — vanilla JS with jQuery, no SPA router or state management
- **Module pattern** — each JS file exports functions via global scope (no ES modules/bundler)
- **4-step wizard** — step-by-step user flow: template → image → text/logo → export
- **Canvas-first** — Fabric.js canvas is the core; all visual output is canvas-rendered
- **Template system** — predefined formats (story, post, event, print) with size/border configs
- **QR subsystem** — self-contained module set (`qrcode/`) with its own wizard, handlers, helpers
- **Logo hierarchy** — Gemeinden → Bundesländer → Domains, searchable via JSON indexes
- **Dual HTML** — `index.html` (dev, individual scripts) / `index-production.html` (bundled)
- **CSS: Tailwind + custom** — no inline styles; custom styles only in `style.css`
- **Testing pyramid** — Jest unit/integration → Playwright visual regression → Playwright e2e
- **Visual test categories** — fast/medium/complex projects for parallel CI execution
