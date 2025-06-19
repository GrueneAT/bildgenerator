# Testing Guide for GRÜNE Image Generator

This document describes the comprehensive test suite implementation for the GRÜNE Image Generator application.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── helpers.test.js      # Utility functions
│   ├── canvas-operations.test.js # Canvas scaling & positioning
│   ├── template-system.test.js   # Template configurations
│   ├── logo-system.test.js      # Logo loading & search
│   └── wizard-navigation.test.js # Step validation logic
├── integration/             # Integration tests
│   ├── image-upload.test.js     # File handling
│   ├── canvas-rendering.test.js # Fabric.js integration  
│   └── qr-generation.test.js    # QR code functionality
└── fixtures/               # Test data
    ├── test-image.jpg
    └── invalid-file.txt

e2e/                        # End-to-end browser tests
├── wizard-flow.spec.js     # Complete user journeys
├── image-generation.spec.js # Canvas operations
├── logo-selection.spec.js  # Logo search & selection
├── responsive-design.spec.js # Mobile/desktop layouts
└── accessibility.spec.js   # Screen reader & keyboard nav
```

## Running Tests

### Unit & Integration Tests (Jest)
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### End-to-End Tests (Playwright)
```bash
npm run test:e2e           # Run all e2e tests
npm run test:e2e-ui        # Interactive mode
npm run test:all           # Run all test types
```

## Test Coverage Areas

### JavaScript Unit Tests
- **Helper Functions** (`helpers.js:30`) - `createShadow()`, color utilities
- **Canvas Operations** (`main.js:17`) - `scaleElementToFit()` scaling logic
- **Wizard Navigation** (`wizard.js:6`) - Step validation & progression
- **Logo System** - JSON parsing, search functionality
- **Template System** - Dimension calculations, template validation

### Integration Tests
- **File Upload** - Type validation, size limits, FileReader integration
- **Canvas Rendering** - Fabric.js object manipulation, export functionality
- **QR Generation** - QR code creation, canvas integration

### End-to-End Browser Tests
- **Complete User Flows**: Template → Image → Logo → Text → Download
- **Logo Search**: Search by name/keywords, category filtering
- **Canvas Interactions**: Text editing, color changes, positioning
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Accessibility**: Keyboard navigation, screen reader support

## Browser Support

Tests run against:
- **Chromium** (primary)
- **Firefox** 
- **WebKit/Safari**
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

## Accessibility Testing

Comprehensive accessibility tests cover:
- Keyboard navigation through all wizard steps
- Screen reader announcements and ARIA labels
- Focus management and modal interaction
- Color contrast and visual indicators
- Touch target sizes on mobile devices

## Test Data

- **Mock Templates**: Story (1080x1920), Post Square (1080x1080), Post Landscape (1200x630)
- **Mock Logos**: Wien, Graz, Salzburg (Gemeinden), Steiermark, Tirol (Bundesländer)
- **Test Images**: Valid JPEG for upload testing
- **Invalid Files**: Text file for error handling tests

## Development Setup

The devcontainer includes:
- Jest with jsdom environment
- Playwright with browser drivers
- Python support for logo processing scripts
- VS Code extensions for testing

## Key Testing Patterns

1. **Fabric.js Mocking**: Canvas operations mocked for unit tests
2. **File API Mocking**: FileReader and File objects for upload tests  
3. **DOM Manipulation**: jsdom environment for jQuery interactions
4. **Visual Regression**: Playwright screenshots for UI consistency
5. **Cross-browser**: Multi-browser test execution in CI/CD

## Continuous Integration

Tests are designed to run in headless mode with:
- Parallel execution for performance
- Retry logic for flaky network-dependent tests
- Artifact collection (screenshots, videos) on failures
- Coverage reporting and quality gates

This test suite ensures the GRÜNE Image Generator maintains high quality across all user interactions while supporting the vanilla JavaScript + jQuery architecture.