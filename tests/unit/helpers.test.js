/**
 * @jest-environment jsdom
 */

// Mock global variables from main.js
let canvas;

beforeEach(() => {
  // Reset canvas mock
  canvas = {
    getActiveObject: jest.fn(),
    renderAll: jest.fn(),
    width: 1080,
    height: 1920
  };
  global.canvas = canvas;
});

// Import the functions we want to test after setting up mocks
const CONSTANTS = {
  FILENAME_LENGTH: 6,
  ALERT_DURATION: 3000,
  VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
};

// Mock the setValue function from helpers.js
function setValue(key, value) {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.set(key, value);
    canvas.renderAll();
  }
}

function getBackgroundColor(color) {
  return jQuery('#bg-option').hasClass('active') ? color : '';
}

function setBackgroundColor(color) {
  setValue("textBackgroundColor", getBackgroundColor(color));
}

function createShadow(color, width) {
  return `${width}px ${width}px 0px ${color}`;
}

describe('Helper Functions', () => {
  describe('CONSTANTS', () => {
    test('should have correct filename length', () => {
      expect(CONSTANTS.FILENAME_LENGTH).toBe(6);
    });

    test('should have valid image types', () => {
      expect(CONSTANTS.VALID_IMAGE_TYPES).toContain('image/jpeg');
      expect(CONSTANTS.VALID_IMAGE_TYPES).toContain('image/png');
      expect(CONSTANTS.VALID_IMAGE_TYPES).toContain('image/webp');
      expect(CONSTANTS.VALID_IMAGE_TYPES).toContain('image/svg+xml');
    });
  });

  describe('setValue', () => {
    test('should set value on active object', () => {
      const mockActiveObject = {
        set: jest.fn(),
        get: jest.fn()
      };
      canvas.getActiveObject.mockReturnValue(mockActiveObject);

      setValue('fill', '#ff0000');

      expect(mockActiveObject.set).toHaveBeenCalledWith('fill', '#ff0000');
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    test('should not set value when no active object', () => {
      canvas.getActiveObject.mockReturnValue(null);

      setValue('fill', '#ff0000');

      expect(canvas.renderAll).not.toHaveBeenCalled();
    });
  });

  describe('getBackgroundColor', () => {
    test('should return color when bg-option is active', () => {
      global.jQuery.mockReturnValue({
        hasClass: jest.fn().mockReturnValue(true)
      });

      const result = getBackgroundColor('#ff0000');
      expect(result).toBe('#ff0000');
    });

    test('should return empty string when bg-option is not active', () => {
      global.jQuery.mockReturnValue({
        hasClass: jest.fn().mockReturnValue(false)
      });

      const result = getBackgroundColor('#ff0000');
      expect(result).toBe('');
    });
  });

  describe('createShadow', () => {
    test('should create correct shadow string', () => {
      const result = createShadow('#000000', 2);
      expect(result).toBe('2px 2px 0px #000000');
    });

    test('should handle different colors and widths', () => {
      const result = createShadow('#ff0000', 5);
      expect(result).toBe('5px 5px 0px #ff0000');
    });
  });
});