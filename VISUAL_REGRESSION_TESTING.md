# Visual Regression Testing

This document explains how to use the visual regression testing suite for the GRÜNE Image Generator.

## Overview

The visual regression tests use Playwright to capture screenshots of the canvas output and compare them with reference images using pixel-perfect comparison with pixelmatch.

## Test Structure

The tests are organized into the following categories:

- **`background-images.spec.js`** - Tests for background image upload and handling
- **`core-functionality.spec.js`** - Basic application functionality tests
- **`elements.spec.js`** - Shape elements (circles, crosses) tests
- **`error-handling.spec.js`** - Error scenarios and edge cases
- **`layouts.spec.js`** - Basic and combined layout tests
- **`positioning.spec.js`** - Element positioning and scaling tests
- **`qr-codes.spec.js`** - QR code generation and styling tests
- **`templates.spec.js`** - All template format tests (A2-A5, social media)
- **`text-system.spec.js`** - Text rendering, colors, and alignment tests
- **`wizard-navigation.spec.js`** - Step-by-step wizard navigation tests

## Running Tests

### Prerequisites

1. Make sure the development server is running (or use `make server`)
2. Install Playwright dependencies: `npm install @playwright/test`
3. Install additional dependencies: `npm install pixelmatch pngjs`

### Generate Reference Images (First Time Setup)

Before running comparison tests, you need to generate reference images:

```bash
# Generate all reference images
GENERATE_REFERENCE=true npx playwright test visual-regression/

# Generate reference images for specific test files
GENERATE_REFERENCE=true npx playwright test visual-regression/tests/templates.spec.js
GENERATE_REFERENCE=true npx playwright test visual-regression/tests/text-system.spec.js
```

This will create reference images in `visual-regression/reference-images/` directory.

### Run Visual Regression Tests

After reference images are generated, run the comparison tests:

```bash
# Run all visual regression tests
npx playwright test visual-regression/

# Run specific test category
npx playwright test visual-regression/tests/templates.spec.js
npx playwright test visual-regression/tests/background-images.spec.js

# Run tests with UI (for debugging)
npx playwright test visual-regression/ --ui

# Run tests in headed mode (see browser)
npx playwright test visual-regression/ --headed
```

### Test Results

- **✓ Pass**: Images match perfectly (0 different pixels)
- **❌ Fail**: Visual differences detected
  - Comparison images saved to `visual-regression/comparison-results/`
  - Diff images highlight the differences
  - Percentage of different pixels is reported

## Test Configuration

The tests are configured in `playwright.config.js`:

- **Base URL**: `http://localhost:8000`
- **Browser**: Desktop Chrome
- **Headless**: `true` (for CI/CD)
- **Screenshot**: Only on failure
- **Server**: Automatically starts with `make server`

## Understanding Test Output

When tests fail, you'll see output like:

```
❌ Visual differences detected for template-story
Different pixels: 245 (0.05%)
Reference image: visual-regression/reference-images/template-story-reference.png
Comparison image: visual-regression/comparison-results/template-story-comparison.png
Diff image created: visual-regression/comparison-results/template-story-diff.png
```

## Updating Reference Images

When you make intentional visual changes to the application:

1. Run the tests to see failures
2. Review the diff images to confirm changes are expected
3. Regenerate reference images:
   ```bash
   GENERATE_REFERENCE=true npx playwright test visual-regression/tests/affected-test.spec.js
   ```

## Test Coverage

The visual regression tests cover:

### Templates (13 tests)
- All social media formats (post, story, event, facebook header)
- All print formats (A2-A5, portrait and landscape)
- Template switching with content preservation

### Text System (7 tests)
- Text rendering and positioning
- Color variations (yellow, white, black)
- Text alignment (left, center, right)
- Multi-line text handling

### Background Images (4 tests)
- JPEG and PNG upload
- Image scaling and auto-fit
- Boundary clipping

### Elements (1 test)
- Shape elements (circles, crosses)
- Element positioning

### QR Codes (2 tests)
- Black and green QR codes
- QR code positioning

### Layouts (2 tests)
- Basic template layout
- Combined layout with all features

### Wizard Navigation (8 tests)
- Step-by-step navigation
- Back navigation
- Step validation
- Progress indicators
- Content persistence

### Error Handling (10 tests)
- Empty inputs
- Long content
- Multiple rapid additions
- Invalid QR codes
- Boundary handling
- Template switching with content
- Rapid user interactions
- Missing logo handling

### Positioning (7 tests)
- Precise element positioning
- Element scaling
- Layer ordering
- Multi-element layouts
- Responsive positioning

## Maintenance

### When to Update Tests

- New features added to the application
- Visual design changes
- Template modifications
- Bug fixes that affect visual output

### Best Practices

1. **Run tests frequently** during development
2. **Generate reference images** after confirmed visual changes
3. **Review diff images** carefully before updating references
4. **Keep test names descriptive** for easy identification
5. **Use consistent positioning** in tests for reliable comparisons

## Troubleshooting

### Common Issues

1. **Server not running**: Make sure `make server` is running on port 8000
2. **Missing reference images**: Run with `GENERATE_REFERENCE=true` first
3. **Flaky tests**: Check for timing issues, increase `waitForTimeout` values
4. **Large diffs**: May indicate font rendering differences across systems

### Debug Tips

- Use `--headed` to see browser interactions
- Use `--ui` for interactive debugging
- Check console logs in test output
- Verify logo JSON files are generated (`make logo-json`)

## CI/CD Integration

For continuous integration:

```yaml
# Example GitHub Actions step
- name: Run Visual Regression Tests
  run: |
    make logo-json
    npx playwright test visual-regression/
```

Set `GENERATE_REFERENCE=true` initially to create baseline images in CI.