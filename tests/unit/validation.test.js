/**
 * Unit Tests for ValidationUtils
 *
 * Tests validation functions including the enhanced
 * validateStep1() with logo toggle support.
 */

const fs = require('fs');
const path = require('path');

describe('ValidationUtils', () => {
  let ValidationUtils;
  let LogoState;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      }
    };
    global.localStorage = mockLocalStorage;

    // Load logo-state.js first
    const logoStatePath = path.join(__dirname, '../../resources/js/logo-state.js');
    const logoStateCode = fs.readFileSync(logoStatePath, 'utf8');
    eval(logoStateCode);
    LogoState = global.LogoState;

    // Mock jQuery selectors for validation
    global.jQuery = jest.fn((selector) => {
      const values = {
        '#canvas-template': 'post',
        '#logo-selection': 'Grüne Wien'
      };

      return {
        val: jest.fn(() => values[selector] || '')
      };
    });
    global.$ = global.jQuery;

    // Load validation.js
    const validationPath = path.join(__dirname, '../../resources/js/validation.js');
    const validationCode = fs.readFileSync(validationPath, 'utf8');
    eval(validationCode);
    ValidationUtils = global.ValidationUtils;

    // Reset localStorage
    mockLocalStorage.clear();
    LogoState.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateStep1() - Original Behavior', () => {
    it('should validate successfully with template and logo', () => {
      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? 'post' : 'Grüne Wien')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when template is missing', () => {
      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? '' : 'Grüne Wien')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bitte wählen Sie eine Vorlage aus.');
    });

    it('should fail when logo is missing (logo enabled)', () => {
      LogoState.setLogoEnabled(true);

      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? 'post' : '')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bitte wählen Sie ein Logo aus.');
    });

    it('should fail when both template and logo are missing', () => {
      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => '')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Bitte wählen Sie eine Vorlage aus.');
      expect(result.errors).toContain('Bitte wählen Sie ein Logo aus.');
    });
  });

  describe('validateStep1() - With Logo Toggle (New Feature)', () => {
    it('should bypass logo validation when logo is disabled', () => {
      LogoState.setLogoEnabled(false);

      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? 'post' : '')
      }));

      const result = ValidationUtils.validateStep1();

      // Should pass even without logo
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should still validate template when logo is disabled', () => {
      LogoState.setLogoEnabled(false);

      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => '')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Bitte wählen Sie eine Vorlage aus.']);
      expect(result.errors).not.toContain('Bitte wählen Sie ein Logo aus.');
    });

    it('should require logo when logo is enabled', () => {
      LogoState.setLogoEnabled(true);

      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? 'post' : '')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bitte wählen Sie ein Logo aus.');
    });

    it('should validate successfully with template only when logo disabled', () => {
      LogoState.setLogoEnabled(false);

      global.jQuery = jest.fn((selector) => ({
        val: jest.fn(() => selector === '#canvas-template' ? 'story' : '')
      }));

      const result = ValidationUtils.validateStep1();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateStep1() - State Transitions', () => {
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

      // Re-enable logo - should fail again
      LogoState.setLogoEnabled(true);
      result = ValidationUtils.validateStep1();
      expect(result.isValid).toBe(false);
    });
  });

  describe('Other Validation Functions (Regression Tests)', () => {
    it('should validate image types correctly', () => {
      expect(ValidationUtils.isValidImage('image/jpeg')).toBe(true);
      expect(ValidationUtils.isValidImage('image/png')).toBe(true);
      expect(ValidationUtils.isValidImage('image/webp')).toBe(true);
      expect(ValidationUtils.isValidImage('image/svg+xml')).toBe(true);
      expect(ValidationUtils.isValidImage('image/gif')).toBe(false);
      expect(ValidationUtils.isValidImage('application/pdf')).toBe(false);
    });

    it('should validate text input', () => {
      expect(ValidationUtils.validateTextInput('Hello').isValid).toBe(true);
      expect(ValidationUtils.validateTextInput('').isValid).toBe(false);
      expect(ValidationUtils.validateTextInput('   ').isValid).toBe(false);
      expect(ValidationUtils.validateTextInput(null).isValid).toBe(false);
    });

    it('should validate file size', () => {
      const smallFile = { size: 5 * 1024 * 1024 }; // 5MB
      const largeFile = { size: 15 * 1024 * 1024 }; // 15MB

      expect(ValidationUtils.validateFileSize(smallFile, 10).isValid).toBe(true);
      expect(ValidationUtils.validateFileSize(largeFile, 10).isValid).toBe(false);
    });

    it('should validate JSON strings', () => {
      expect(ValidationUtils.isValidJSON('{"key": "value"}')).toBe(true);
      expect(ValidationUtils.isValidJSON('[1, 2, 3]')).toBe(true);
      expect(ValidationUtils.isValidJSON('not json')).toBe(false);
      expect(ValidationUtils.isValidJSON('{"incomplete":')).toBe(false);
    });
  });
});
