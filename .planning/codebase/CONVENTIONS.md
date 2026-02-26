# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- Lowercase with hyphens: `alert-system.js`, `canvas-utils.js`, `logo-state.js`
- Test files: `.test.js` suffix for unit and integration tests, `.spec.js` for Playwright tests
- Organized by function in resources/js directory: `qrcode/qrcode-generator.js`, `qrcode/qrcode-handlers.js`

**Functions:**
- camelCase for all function declarations and definitions
- Verb-first naming: `enableSnap()`, `validateStep1()`, `renderOptions()`, `createCustomSelect()`
- Private helper functions use camelCase with underscore prefix if convention followed: most functions in module objects don't use underscore (e.g., `storeOriginalOptions()`)

**Variables:**
- camelCase for all variable declarations: `canvas`, `contentRect`, `logoName`, `scaleMax`, `isOpen`, `selectedValue`
- UPPERCASE for constants in uppercase constant objects: `AppConstants.CANVAS.SCALE_MAX_MULTIPLIER`, `AppConstants.COLORS.BACKGROUND_PRIMARY`
- State variables at module level use camelCase: `canvas`, `contentImage`, `logo`, `template`

**Types/Classes:**
- PascalCase for class names: `SearchableSelect`, `TemplateConstants`, `ValidationUtils`, `CanvasUtils`, `AlertSystem`, `LogoState`
- Module objects use PascalCase: `AlertSystem`, `ValidationUtils`, `CanvasUtils`, `LogoState`
- Avoid ES6 class syntax; use module objects with methods or class declarations where needed

## Code Style

**Formatting:**
- No official ESLint or Prettier configuration in repository
- Indentation: 4 spaces (observed in most files)
- Line length: No strict limit observed, but code kept reasonably readable
- Semicolons: Required at end of statements
- Trailing commas in objects: Present in most structures

**Linting:**
- No linting tool configured - code style is manual
- Files should follow observed patterns for consistency
- Testing library imports use `require()` syntax for Jest compatibility

**Commenting Style:**
- JSDoc for function documentation:
  ```javascript
  /**
   * Calculate the optimal logo top position based on template configuration
   * For bordered templates: border should cut through pink bar at BORDER_CUT_RATIO of logo height
   */
  ```
- Inline comments for clarification and debugging:
  ```javascript
  console.log('[replaceCanvas] Initializing canvas features with canvas:', canvas ? 'defined' : 'undefined');
  ```
- Use descriptive bracket notation in console logs: `[FunctionName.methodName]` format for debugging
- TODOs not heavily used; inline comments preferred

## Import Organization

**Order:**
1. External libraries: `require()` statements come first
2. File system utilities: `const fs = require('fs')`
3. Path utilities: `const path = require('path')`
4. Test/assertion libraries: `require('@testing-library/jest-dom')`
5. Custom modules: loaded via `eval()` for integration tests or global references
6. Playwright imports: `import { test, expect } from '@playwright/test'`

**Path Aliases:**
- Module alias configured in Jest: `^@/(.*)$` maps to `<rootDir>/resources/$1`
- Use `@/js/` for JavaScript modules in tests: `@/js/validation`, `@/js/helpers`
- Not heavily used in practice; most code uses relative or global scope

## Error Handling

**Patterns:**
- Try/catch blocks for validation (e.g., JSON parsing in `ValidationUtils.isValidJSON()`)
- Validation functions return objects with `{ isValid: boolean, errors: array, error: string }` structure
- Console logging for debugging: `console.log()`, `console.warn()`, `console.error()`
- Error messages in German for user-facing content (Austrian context)
- Silent failures acceptable when error is logged or handled gracefully
- Canvas operations check for undefined/null before proceeding
- Function parameter validation before use: `if (!target || typeof target.getCenterPoint !== 'function')`

**Example error response:**
```javascript
{
  isValid: false,
  error: 'Text field is empty'
}

// Or for multiple errors:
{
  isValid: false,
  errors: ['Bitte wählen Sie eine Vorlage aus.', 'Bitte wählen Sie ein Logo aus.']
}
```

## Logging

**Framework:** console methods (console.log, console.warn, console.error)

**Patterns:**
- Styled console logs for visual debugging: `console.log('%c[SNAP] CENTER SNAP', 'background: #8ab414; color: white; font-weight: bold; padding: 2px 6px;', ...)`
- Module prefix convention in logs: `[ModuleName.functionName]` for identification
- Conditional debug logs wrapped in feature checks:
  ```javascript
  if (console.log) {
    console.log('[CanvasUtils.enableSnap] Snap zone calculated:', snapZone);
  }
  ```
- Console methods mocked in tests to reduce noise
- No logging library (winston, pino); native console only

## Function Design

**Size:** Generally kept under 50 lines; longer functions broken into helper functions within module objects

**Parameters:**
- Positional parameters for required values
- Options objects for multiple optional parameters: `(element, options = {})`
- Canvas instance passed as parameter to avoid scope issues: `enableSnap(canvasInstance, snapZone)`
- Default values in object parameters: `{ placeholder: 'Select an option...', searchPlaceholder: 'Search...' }`

**Return Values:**
- Functions in utility modules return data directly or utility objects
- Validation functions return result objects: `{ isValid: boolean, errors?: array, error?: string }`
- No explicit return for void operations (canvas mutations, DOM updates)
- Chainable methods return `this` or `element` for jQuery compatibility

## Module Design

**Exports:**
- No ES6 export syntax; modules use global assignment: `const CanvasUtils = { ... }; global.CanvasUtils = CanvasUtils;`
- Functions not explicitly exported; accessed via module namespace: `CanvasUtils.enableSnap()`, `ValidationUtils.validateStep1()`
- In Playwright tests: ES6 import/export used (`export async function setupBasicTemplate()`)

**Barrel Files:**
- No barrel export pattern observed
- Each module is self-contained with its own global assignment

**Module Organization:**
- Constants at top: `const AppConstants = { ... }`
- Utility modules grouped by responsibility: `CanvasUtils` for canvas operations, `ValidationUtils` for validation
- Event handlers in separate modules: `event-handlers.js`, `handlers.js` for DOM events
- QR code functionality grouped in `qrcode/` subdirectory with specialized modules

## Object and Data Structures

**Constant Objects:**
- Namespace everything under PascalCase objects: `AppConstants`, `TemplateConstants`
- Nested structure for organization:
  ```javascript
  const AppConstants = {
    FILE: { FILENAME_LENGTH: 6, MAX_SIZE_MB: 10, ... },
    CANVAS: { SCALE_MAX_MULTIPLIER: 0.002, ... },
    COLORS: { BACKGROUND_PRIMARY: '...', ... }
  }
  ```

**Template Configuration:**
- Templates stored in TemplateConstants with properties: `{ width, height, border, topBorderMultiplier, name }`
- Social media formats (story, post, event) and print formats (A2-A5)

## Global State Management

**Global Variables:**
- Top-level canvas variables: `canvas`, `contentRect`, `contentImage`, `logo`, `logoName`, `logoText`, `scaleMax`, `template`
- Global state objects: `LogoState` with methods for managing logo toggle state
- All global state namespaced under module objects or explicit assignments
- Initialization check pattern: `if (typeof generatorApplicationURL === "undefined")`

**State Mutations:**
- Direct property assignment for canvas updates: `canvas.renderAll()`
- setters in state modules: `LogoState.setLogoEnabled(true)`, `LogoState.initialize()`
- localStorage for persistence: stored with keys like logo toggle state

## DOM Manipulation

**jQuery Usage:**
- jQuery used throughout for DOM queries: `jQuery('#element-id')`, `jQuery('.class')`
- Method chaining: `jQuery(element).find().attr()`
- Conditional element creation: `jQuery('<div class="..."></div>')`
- Event binding: `jQuery(element).on('click', handler)`, `.off()` for unbinding
- Attribute access: `.attr()`, `.val()`, `.css()`, `.html()`, `.text()`

---

*Convention analysis: 2026-02-26*
