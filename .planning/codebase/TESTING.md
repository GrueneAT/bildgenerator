# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Runner:**
- Jest 29.7.0 for unit and integration tests
- Playwright 1.56.1 for E2E and visual regression tests
- Config: `jest.config.js` and `playwright.config.js`

**Assertion Library:**
- Jest built-in assertions: `expect()`
- @testing-library/jest-dom for DOM assertions
- Playwright assertions: `expect()` from `@playwright/test`
- pixelmatch 5.3.0 for visual image comparison

**Run Commands:**
```bash
npm test                      # Run Jest tests (unit + integration)
npm run test:watch           # Jest watch mode
npm run test:coverage        # Generate coverage report
npm run test:e2e            # Run Playwright E2E tests
npm run test:visual         # Run visual regression tests (all projects)
npm run test:visual-fast    # Run fast visual tests only
npm run test:visual-ui      # Playwright test UI mode
npm run test:all            # Run Jest + E2E tests
```

## Test File Organization

**Location:**
- Unit tests: `tests/unit/*.test.js`
- Integration tests: `tests/integration/*.test.js`
- E2E tests: `e2e/*.spec.js`
- Visual regression tests: `visual-regression/tests/*.spec.js`
- Test fixtures: `tests/fixtures/`
- Test utilities: `visual-regression/tests/test-utils.js`

**Naming:**
- Test files: `{module-name}.test.js` for unit/integration, `{feature}.spec.js` for E2E and visual
- Test classes: `ValidationUtils.test.js`, `searchable-select-integration.test.js`, `complete-wizard-flow.spec.js`

**Structure:**
```
tests/
├── unit/                          # Unit tests for individual modules
│   ├── validation.test.js
│   ├── canvas-utils-snap.test.js
│   └── logo-toggle.test.js
├── integration/                   # Integration tests combining modules
│   ├── logo-processing-integration.test.js
│   ├── snapping-integration.test.js
│   └── searchable-select-integration.test.js
└── fixtures/                      # Test data and assets
    ├── test-image.jpg
    └── invalid-file.txt

e2e/                             # Playwright E2E tests
├── complete-wizard-flow.spec.js
├── canvas-operations.spec.js
├── template-operations.spec.js
└── ...

visual-regression/               # Visual regression tests
├── reference-images/            # Expected reference images
├── comparison-results/          # Actual screenshots and diffs
└── tests/
    ├── test-utils.js           # Shared test utilities
    ├── core-functionality.spec.js
    ├── templates.spec.js
    └── ...
```

## Test Structure

**Suite Organization:**
```javascript
describe('ValidationUtils', () => {
  let ValidationUtils;
  let LogoState;

  beforeEach(() => {
    // Setup mocks and load modules
    mockLocalStorage = { ... };
    global.localStorage = mockLocalStorage;

    // Load actual modules via require/eval
    const validationCode = fs.readFileSync(validationPath, 'utf8');
    eval(validationCode);
    ValidationUtils = global.ValidationUtils;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateStep1() - Original Behavior', () => {
    it('should validate successfully with template and logo', () => {
      // Test implementation
    });
  });
});
```

**Patterns:**
- Nested `describe()` blocks group related tests by functionality
- `beforeEach()` initializes test state and loads actual modules via `require()` or `eval()`
- `afterEach()` cleans up mocks and global state with `jest.restoreAllMocks()`
- Test isolation: each test gets fresh state via beforeEach
- Module loading via file system for integration tests to test real code

## Mocking

**Framework:** Jest mocking (jest.fn(), jest.mock())

**Patterns:**
```javascript
// Mock function
const mockFunction = jest.fn();

// Mock function with return value
const mockFunction = jest.fn(() => expectedValue);

// Mock jQuery element
const element = {
  hasClass: jest.fn(),
  addClass: jest.fn(),
  on: jest.fn(() => element)  // Return self for chaining
};

// Mock global objects
global.fabric = {
  Canvas: jest.fn(() => ({ ... })),
  Image: jest.fn(),
  util: { loadImage: jest.fn() }
};

// Mock localStorage
mockLocalStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; }
};
global.localStorage = mockLocalStorage;
```

**What to Mock:**
- External libraries: `fabric.js`, `jQuery`, `FontFaceObserver`, `QRCode`
- Browser APIs: `localStorage`, `HTMLCanvasElement`, `window`
- File system operations (use real files with fs.readFileSync in integration tests)
- Network requests (not applicable in this client-side app)

**What NOT to Mock:**
- Application code being tested - load via require() or eval() to test real implementations
- Canvas operations when testing canvas functionality - use mocked canvas instance
- Validation logic - test with real ValidationUtils module
- State modules - load real LogoState to test state transitions

**Setup Example (Jest):**
```javascript
// Setup.js - applies to all tests
require('@testing-library/jest-dom');

global.fabric = {
  Canvas: jest.fn(() => ({
    on: jest.fn(),
    renderAll: jest.fn(),
    getObjects: jest.fn(() => []),
    add: jest.fn(),
    remove: jest.fn(),
    width: 1080,
    height: 1920
  })),
  // ... more mocks
};

global.jQuery = jest.fn((selector) => {
  return {
    hasClass: jest.fn(),
    addClass: jest.fn(),
    on: jest.fn(() => element),
    // ... jQuery methods
  };
});

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and modules in isolation
- Example: `validation.test.js` tests ValidationUtils functions with mocked state
- Pattern: Load module, mock dependencies, call function, assert result
- Files: `tests/unit/*.test.js`
- Focus: Input validation, error handling, return values
- Example test:
  ```javascript
  it('should validate image types correctly', () => {
    expect(ValidationUtils.isValidImage('image/jpeg')).toBe(true);
    expect(ValidationUtils.isValidImage('image/gif')).toBe(false);
  });
  ```

**Integration Tests:**
- Scope: Multiple modules working together with real code
- Example: `searchable-select-integration.test.js` tests SearchableSelect with real DOM and jQuery
- Pattern: Create real DOM elements, instantiate class, interact, verify behavior
- Files: `tests/integration/*.test.js`
- Focus: Module interactions, state transitions, DOM manipulation
- Example test:
  ```javascript
  it('should find options when searching for text after %', () => {
    const html = searchableSelect.renderOptions('LIEZEN');
    expect(html).toContain('BEZIRK LIEZEN');
  });
  ```

**E2E Tests:**
- Scope: Complete user workflows through Playwright browser automation
- Example: `complete-wizard-flow.spec.js` runs through full image generation
- Pattern: Navigate page, interact with UI, wait for elements, assert state changes
- Files: `e2e/*.spec.js`
- Framework: Playwright with `test.step()` for workflow organization
- Example:
  ```javascript
  test('should complete full image generation workflow', async ({ page }) => {
    await test.step('Select template and logo', async () => {
      await page.selectOption('#canvas-template', 'post_45_border');
      // ... interact with page
    });
  });
  ```

**Visual Regression Tests:**
- Scope: Screen appearance and image rendering
- Example: `templates.spec.js` verifies correct template rendering
- Framework: Playwright + pixelmatch for pixel-level comparison
- Pattern: Navigate to state, take screenshot, compare with reference image
- Files: `visual-regression/tests/*.spec.js`
- Organization: Tests split into parallel projects for performance
  - **fast-tests**: Quick tests under 5 seconds (core-functionality, elements, layouts)
  - **medium-tests**: 5-10 seconds (text-system, positioning, background-images, qr-codes)
  - **complex-tests**: 10+ seconds (qr-generator, templates, error-handling, wizard-navigation)
  - **e2e-tests**: E2E workflows

**CRITICAL:** New visual test files MUST be added to `playwright.config.js` testMatch array in appropriate project or they'll be skipped in CI.

## Fixtures and Factories

**Test Data:**
```javascript
// From validation.test.js
const values = {
  '#canvas-template': 'post',
  '#logo-selection': 'Grüne Wien'
};

// From logo-processing-integration.test.js
mockCanvas = {
  width: 1080,
  height: 1080,
  remove: jest.fn(),
  add: jest.fn(),
  renderAll: jest.fn()
};

// From searchable-select-integration.test.js
const selectHTML = `
  <select id="logo-selection">
    <option value="">Select Logo</option>
    <optgroup label="Bezirke">
      <option value="BEZIRK % LIEZEN">BEZIRK LIEZEN</option>
    </optgroup>
  </select>
`;
```

**Location:**
- Inline in test files as template HTML and mock objects
- File fixtures in `tests/fixtures/` directory: `test-image.jpg`, `invalid-file.txt`
- Shared utilities in `visual-regression/tests/test-utils.js` for E2E/visual tests

**Shared Test Utilities** (`visual-regression/tests/test-utils.js`):
- `setupBasicTemplate(page, templateType)` - Initialize template with logo disabled
- `waitForWizardStep(page, stepNumber)` - Wait for specific wizard step
- `navigateToStep(page, fromStep, toStep)` - Navigate between wizard steps
- `navigateToDownloadStep(page)` - Navigate to final step
- `compareWithReference(page, testName)` - Compare screenshot with reference image
- Handles reference image generation mode: `GENERATE_REFERENCE_MODE` env variable

## Coverage

**Requirements:** None enforced (coverage thresholds all set to 0 in jest.config.js)

**View Coverage:**
```bash
npm run test:coverage
# Generates coverage report in coverage/ directory
# View HTML: open coverage/index.html
```

**Coverage Report:**
- Location: `coverage/` directory (git ignored)
- Formats: text, lcov, html
- Collected from: `resources/js/**/*.js` (excludes .min.js files)

## Common Patterns

**Async Testing:**
```javascript
// Playwright async/await
test('should handle async operations', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.selectOption('#select', 'value');
  await page.waitForTimeout(1000);
});

// Playwright test.step() for workflow organization
await test.step('Step description', async () => {
  // Step implementation
});

// Jest async testing (rarely used in this codebase)
test('async function', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

**Error Testing:**
```javascript
// Validation function error testing
it('should fail when template is missing', () => {
  global.jQuery = jest.fn((selector) => ({
    val: jest.fn(() => '')  // Empty value
  }));

  const result = ValidationUtils.validateStep1();

  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('Bitte wählen Sie eine Vorlage aus.');
});

// No specific error throwing tests - validation returns error objects
```

**State Transition Testing:**
```javascript
// Test state changes with enable/disable
it('should update validation when logo state changes', () => {
  global.jQuery = jest.fn((selector) => ({
    val: jest.fn(() => selector === '#canvas-template' ? 'post' : '')
  }));

  // Initially enabled - should fail
  LogoState.setLogoEnabled(true);
  let result = ValidationUtils.validateStep1();
  expect(result.isValid).toBe(false);

  // Disable logo - should pass
  LogoState.setLogoEnabled(false);
  result = ValidationUtils.validateStep1();
  expect(result.isValid).toBe(true);
});
```

## Visual Regression Specifics

**Reference Image Management:**
```bash
# Generate reference images (sets GENERATE_REFERENCE=true)
npm run generate-references

# Run visual tests normally (compares with references)
npm run test:visual

# Run specific visual test category
npm run test:visual-fast      # Fast tests only
npm run test:visual-medium    # Medium complexity tests
npm run test:visual-complex   # Complex tests only
```

**Image Comparison:**
- Uses pixelmatch for pixel-level comparison
- Reference images stored in `visual-regression/reference-images/`
- Actual screenshots captured on test failure in `visual-regression/comparison-results/`
- Comparison diffs generated automatically for analysis

**Browser Consistency:**
- Font rendering flags disabled for consistency: `--font-render-hinting=none`, `--disable-font-subpixel-positioning`
- Software rendering for deterministic output: `--disable-gpu`
- Consistent DPI: `--force-device-scale-factor=1`
- Chrome browser only for visual tests

## Test Dependencies

**npm Packages:**
- `@testing-library/jest-dom`: DOM assertion matchers
- `jest`: Test runner and assertion library
- `jest-environment-jsdom`: Browser DOM environment for Jest
- `@playwright/test`: E2E and visual testing framework
- `pixelmatch`: Pixel-level image comparison
- `pngjs`: PNG image processing for visual tests

**Global Mocks (setup.js):**
- fabric.js (canvas library)
- jQuery (DOM manipulation)
- FontFaceObserver (font loading)
- Canvas element and context
- Console methods
- localStorage

---

*Testing analysis: 2026-02-26*
