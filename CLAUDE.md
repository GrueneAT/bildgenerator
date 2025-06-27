# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based image generator for GRÜNE (Austrian Green Party) political materials. It's a client-side application that allows users to create social media graphics and political content with GRÜNE branding.

## Development Commands

### CSS Development

- `npm run build-css` - Build Tailwind CSS with watch mode for development
- `npm run build-css-prod` - Build minified CSS for production

### Local Development

- `make server` - Start Python HTTP server on port 8000 (automatically generates logo JSON files first)
- `make logo-json` - Generate logo index JSON files from image directories

### Logo Management

The `logo_json.py` script processes logo filenames and generates searchable JSON indexes for:

- `gemeinden-logos.json` - Municipal logos
- `bundeslaender-logos.json` - State/federal logos
- `domains-logos.json` - Domain-specific logos

## Architecture

### Core Technologies

- **Frontend**: Vanilla JavaScript with jQuery
- **CSS Framework**: Tailwind CSS with custom GRÜNE theme colors
- **Canvas**: Fabric.js for image manipulation and canvas operations
- **UI Components**: Bootstrap Select, Bootstrap Colorpicker
- **Build Tools**: Tailwind CSS, Python for logo processing

### Application Structure

**Main Application State** (`resources/js/main.js`):

- Global canvas and image objects
- Template configurations for different image formats (story, post, etc.)
- Core utility functions

**Wizard Interface** (`resources/js/wizard.js`):

- 4-step wizard navigation system
- Step validation and progression logic
- Advanced options and QR code integration

**Key JavaScript Modules**:

- `initialization.js` - App startup and DOM ready logic
- `handlers.js` - Event handlers for UI interactions
- `helpers.js` - Utility functions
- `choice-image.js` - Image selection and upload handling
- `modal.js` - Modal dialog management
- `searchable-select.js` - Enhanced select components

### Template System

The application supports multiple image formats defined in `template_values`:

- Story format (1080x1920)
- Post formats with configurable dimensions
- Custom border and logo positioning

### Logo System

Logos are organized in a hierarchical structure:

- `resources/images/logos/gemeinden/` - Municipal logos
- `resources/images/logos/bundeslaender/` - State logos
- `resources/images/logos/domains/` - Domain-specific logos
- JSON indexes provide searchable metadata

### Styling

- **Custom Theme**: GRÜNE brand colors (`gruene-primary`, `gruene-secondary`, `gruene-dark`)
- **Typography**: Gotham Narrow font family
- **Responsive Design**: Tailwind CSS utility classes

## File Organization

- `index.html` - Main application page
- `resources/js/` - All JavaScript modules
- `resources/css/` - Stylesheets (input.css for Tailwind source, output.css for compiled)
- `resources/images/logos/` - Logo assets with JSON indexes
- `vendors/` - Third-party libraries (Bootstrap, Fabric.js, jQuery, etc.)

## Development Notes

- The application is purely client-side with no backend dependencies
- Logo JSON files must be regenerated when logo images are added/modified
- Tailwind CSS requires compilation when utility classes are modified
- The wizard system enforces step-by-step user flow with validation
- NEVER use inline styles and ALWAYS use tailwind, add custom styles to css files ONLY when absolutely necessary
- In visual regression tests NEVER manipulate the canvas or other elements directly, ALWAYS use the available features in the same way a user would.
- When asked to create a Documentation file ALWYAS create the Documentation files in the root of the repository. They don't have to be created for each action.
- ALWAYS use pixelmatch when comparing visual regression images to reference images

## Visual Testing Management

### Playwright Configuration and Test Organization

The visual regression tests are organized into parallel projects for optimal CI performance:

- **fast-tests**: Quick tests (core-functionality, elements, layouts)
- **medium-tests**: Moderate tests (text-system, positioning, background-images, qr-codes)  
- **complex-tests**: Heavy tests (qr-generator, templates, error-handling, wizard-navigation)
- **e2e-tests**: End-to-end integration tests

### CRITICAL: Adding New Visual Test Files

**When creating new visual test files, you MUST update `playwright.config.js` to include them in the appropriate project category, otherwise they will be IGNORED in CI execution.**

**Steps for adding new visual tests:**

1. **Create the test file** in `visual-regression/tests/` 
2. **Categorize by complexity**:
   - **Fast** (< 5 seconds per test): Add to `fast-tests` project `testMatch` array
   - **Medium** (5-10 seconds per test): Add to `medium-tests` project `testMatch` array  
   - **Complex** (10+ seconds per test): Add to `complex-tests` project `testMatch` array
3. **Update the testMatch pattern** in the appropriate project in `playwright.config.js`

**Example of adding a new test file:**
```javascript
// If creating "performance.spec.js" (medium complexity)
{
  name: "medium-tests",
  testMatch: [
    "**/text-system.spec.js",
    "**/positioning.spec.js", 
    "**/background-images.spec.js",
    "**/qr-codes.spec.js",
    "**/performance.spec.js" // ADD NEW FILE HERE
  ],
  use: { ...devices["Desktop Chrome"] }
}
```

**Verification:** After adding a new test file, run `npm run test:visual` to ensure it executes in the parallel pipeline.

**Common Mistake:** Creating test files without updating `playwright.config.js` results in tests being skipped in CI, leading to false confidence in test coverage.
