/**
 * @jest-environment jsdom
 */

// Mock global canvas variable
let canvas;

beforeEach(() => {
  canvas = {
    width: 1080,
    height: 1920,
    renderAll: jest.fn()
  };
  global.canvas = canvas;
});

// Mock the scaleElementToFit function from main.js
function scaleElementToFit(element, maxWidthRatio = 0.5, maxHeightRatio = 0.4) {
  const maxWidth = canvas.width * maxWidthRatio;
  const maxHeight = canvas.height * maxHeightRatio;

  const elementWidth = element.width || element.getScaledWidth();
  const elementHeight = element.height || element.getScaledHeight();

  const widthScale = maxWidth / elementWidth;
  const heightScale = maxHeight / elementHeight;

  const scale = Math.min(widthScale, heightScale);

  if (element.type === "text") {
    if (widthScale < heightScale) {
      element.scaleToWidth(maxWidth);
    } else {
      element.scaleToHeight(maxHeight);
    }
  } else if (element.scaleToWidth && element.scaleToHeight) {
    if (widthScale < heightScale) {
      element.scaleToWidth(maxWidth);
    } else {
      element.scaleToHeight(maxHeight);
    }
  } else {
    element.scale(scale);
  }
}

describe('Canvas Operations', () => {
  describe('scaleElementToFit', () => {
    test('should scale text element to fit width when width is limiting factor', () => {
      const mockTextElement = {
        type: 'text',
        width: 800,
        height: 200,
        getScaledWidth: () => 800,
        getScaledHeight: () => 200,
        scaleToWidth: jest.fn(),
        scaleToHeight: jest.fn()
      };

      scaleElementToFit(mockTextElement);

      // maxWidth = 1080 * 0.5 = 540
      // maxHeight = 1920 * 0.4 = 768
      // widthScale = 540/800 = 0.675
      // heightScale = 768/200 = 3.84
      // widthScale < heightScale, so should scale to width
      expect(mockTextElement.scaleToWidth).toHaveBeenCalledWith(540);
      expect(mockTextElement.scaleToHeight).not.toHaveBeenCalled();
    });

    test('should scale text element to fit height when height is limiting factor', () => {
      const mockTextElement = {
        type: 'text',
        width: 300,
        height: 900,
        getScaledWidth: () => 300,
        getScaledHeight: () => 900,
        scaleToWidth: jest.fn(),
        scaleToHeight: jest.fn()
      };

      scaleElementToFit(mockTextElement);

      // maxWidth = 1080 * 0.5 = 540
      // maxHeight = 1920 * 0.4 = 768
      // widthScale = 540/300 = 1.8
      // heightScale = 768/900 = 0.853
      // heightScale < widthScale, so should scale to height
      expect(mockTextElement.scaleToHeight).toHaveBeenCalledWith(768);
      expect(mockTextElement.scaleToWidth).not.toHaveBeenCalled();
    });

    test('should scale image element using scaleToWidth/scaleToHeight methods', () => {
      const mockImageElement = {
        type: 'image',
        width: 600,
        height: 400,
        getScaledWidth: () => 600,
        getScaledHeight: () => 400,
        scaleToWidth: jest.fn(),
        scaleToHeight: jest.fn()
      };

      scaleElementToFit(mockImageElement);

      // maxWidth = 540, maxHeight = 768
      // widthScale = 540/600 = 0.9
      // heightScale = 768/400 = 1.92
      // widthScale < heightScale, so should scale to width
      expect(mockImageElement.scaleToWidth).toHaveBeenCalledWith(540);
    });

    test('should use scale method for elements without scaleToWidth/scaleToHeight', () => {
      const mockCircleElement = {
        type: 'circle',
        width: 200,
        height: 200,
        getScaledWidth: () => 200,
        getScaledHeight: () => 200,
        scale: jest.fn()
      };

      scaleElementToFit(mockCircleElement);

      // maxWidth = 540, maxHeight = 768
      // widthScale = 540/200 = 2.7
      // heightScale = 768/200 = 3.84
      // scale = min(2.7, 3.84) = 2.7
      expect(mockCircleElement.scale).toHaveBeenCalledWith(2.7);
    });

    test('should use custom ratios when provided', () => {
      const mockElement = {
        type: 'image',
        width: 400,
        height: 300,
        getScaledWidth: () => 400,
        getScaledHeight: () => 300,
        scaleToWidth: jest.fn(),
        scaleToHeight: jest.fn()
      };

      scaleElementToFit(mockElement, 0.8, 0.6);

      // maxWidth = 1080 * 0.8 = 864
      // maxHeight = 1920 * 0.6 = 1152
      // widthScale = 864/400 = 2.16
      // heightScale = 1152/300 = 3.84
      // widthScale < heightScale, so should scale to width
      expect(mockElement.scaleToWidth).toHaveBeenCalledWith(864);
    });
  });
});