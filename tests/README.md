# Test Suite Documentation

This directory contains the automated test suite for the GRÜNE Bildgenerator application.

## Test Structure

### Unit Tests
- **`helpers.test.js`** - Tests utility functions like `setValue`, `isImage`, `createImgName`, and `createShadow`
- **`main.test.js`** - Tests core canvas functionality, template management, and JSON validation
- **`handlers.test.js`** - Tests event handlers, font loading, and UI state management
- **`modal.test.js`** - Tests modal functionality and alert system

### Integration Tests
- **`integration.test.js`** - Tests complete user workflows including:
  - Canvas template switching
  - Text and image addition
  - Logo selection
  - Image generation and export
  - End-to-end meme creation process

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses jsdom environment for DOM testing
- Includes canvas mocking for Fabric.js compatibility
- Configured to collect coverage from JavaScript files
- Custom setup file for mocking dependencies

### Setup File (`setup.js`)
Provides mocks for:
- jQuery and DOM manipulation
- Fabric.js canvas library
- FontFaceObserver for font loading
- Browser APIs (FileReader, Image, etc.)
- Global application variables

## Mock Strategy

The test suite uses comprehensive mocking to isolate functionality:

1. **jQuery** - All DOM interactions are mocked
2. **Fabric.js** - Canvas operations are mocked with realistic return values
3. **Browser APIs** - File reading, image loading, and download functionality
4. **Global Variables** - Application state variables are properly initialized

## Coverage Goals

The test suite aims for:
- **Functions**: 90%+ coverage
- **Lines**: 85%+ coverage
- **Branches**: 80%+ coverage

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` branch
- Pushes to `main` and `develop` branches
- Multiple Node.js versions (18.x, 20.x)

Coverage reports are uploaded to Codecov for tracking.

## Adding New Tests

When adding new functionality:

1. Add unit tests for individual functions
2. Add integration tests for user workflows
3. Update mocks in `setup.js` if needed
4. Ensure coverage remains above target thresholds

## Testing Best Practices

1. **Isolation** - Each test is independent and doesn't affect others
2. **Mocking** - External dependencies are mocked for reliability
3. **Assertions** - Tests verify both positive and negative cases
4. **Descriptive Names** - Test names clearly describe what is being tested
5. **Setup/Teardown** - Proper cleanup between tests