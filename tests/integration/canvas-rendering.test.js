/**
 * @jest-environment jsdom
 */

// Mock fabric.js objects
const mockFabricCanvas = {
  width: 1080,
  height: 1920,
  backgroundColor: '#ffffff',
  objects: [],
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  renderAll: jest.fn(),
  setDimensions: jest.fn(),
  setBackgroundColor: jest.fn(),
  getObjects: jest.fn(() => []),
  getActiveObject: jest.fn(),
  setActiveObject: jest.fn(),
  discardActiveObject: jest.fn(),
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-canvas-data'),
  loadFromJSON: jest.fn(),
  toJSON: jest.fn(() => ({ objects: [] }))
};

const mockFabricImage = {
  type: 'image',
  left: 0,
  top: 0,
  width: 400,
  height: 300,
  scaleX: 1,
  scaleY: 1,
  set: jest.fn(),
  get: jest.fn(),
  scale: jest.fn(),
  scaleToWidth: jest.fn(),
  scaleToHeight: jest.fn(),
  center: jest.fn(),
  centerH: jest.fn(),
  centerV: jest.fn(),
  getScaledWidth: jest.fn(() => 400),
  getScaledHeight: jest.fn(() => 300)
};

const mockFabricText = {
  type: 'text',
  left: 0,
  top: 0,
  width: 200,
  height: 50,
  text: 'Sample Text',
  fontSize: 24,
  fontFamily: 'Arial',
  fill: '#000000',
  set: jest.fn(),
  get: jest.fn(),
  scale: jest.fn(),
  scaleToWidth: jest.fn(),
  scaleToHeight: jest.fn(),
  center: jest.fn(),
  getScaledWidth: jest.fn(() => 200),
  getScaledHeight: jest.fn(() => 50)
};

// Mock global fabric object
global.fabric = {
  Canvas: jest.fn(() => mockFabricCanvas),
  Image: {
    fromURL: jest.fn((url, callback) => {
      setTimeout(() => callback(mockFabricImage), 10);
    })
  },
  Text: jest.fn(() => mockFabricText),
  Rect: jest.fn(() => ({
    type: 'rect',
    width: 100,
    height: 100,
    fill: '#000000'
  }))
};

// Mock canvas functions
let canvas = mockFabricCanvas;

function initializeCanvas(containerId, width = 1080, height = 1920) {
  canvas = new fabric.Canvas(containerId);
  canvas.setDimensions({ width, height });
  canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
  return canvas;
}

function addImageToCanvas(imageUrl, options = {}) {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img) {
        reject(new Error('Failed to load image'));
        return;
      }
      
      // Apply options
      if (options.scale) img.scale(options.scale);
      if (options.left !== undefined) img.set('left', options.left);
      if (options.top !== undefined) img.set('top', options.top);
      if (options.center) img.center();
      
      canvas.add(img);
      canvas.renderAll();
      resolve(img);
    }, options);
  });
}

function addTextToCanvas(text, options = {}) {
  const textObj = new fabric.Text(text, {
    fontSize: options.fontSize || 24,
    fontFamily: options.fontFamily || 'Arial',
    fill: options.fill || '#000000',
    left: options.left || 0,
    top: options.top || 0,
    ...options
  });
  
  if (options.center) textObj.center();
  
  canvas.add(textObj);
  canvas.renderAll();
  return textObj;
}

function exportCanvasAsImage(format = 'png', quality = 1.0) {
  const options = {
    format: format,
    quality: quality,
    multiplier: 1
  };
  
  return canvas.toDataURL(options);
}

function clearCanvas() {
  canvas.clear();
  canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
}

function resizeCanvas(width, height) {
  canvas.setDimensions({ width, height });
  canvas.renderAll();
}

describe('Canvas Rendering Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    canvas = mockFabricCanvas;
    
    // Reset fabric.Image.fromURL to default implementation
    fabric.Image.fromURL.mockImplementation((url, callback) => {
      setTimeout(() => callback(mockFabricImage), 10);
    });
  });

  describe('Canvas initialization', () => {
    test('should initialize canvas with default dimensions', () => {
      const result = initializeCanvas('canvas-container');
      
      expect(fabric.Canvas).toHaveBeenCalledWith('canvas-container');
      expect(result.setDimensions).toHaveBeenCalledWith({ width: 1080, height: 1920 });
      expect(result.setBackgroundColor).toHaveBeenCalled();
    });

    test('should initialize canvas with custom dimensions', () => {
      initializeCanvas('canvas-container', 800, 600);
      
      expect(canvas.setDimensions).toHaveBeenCalledWith({ width: 800, height: 600 });
    });
  });

  describe('Image handling', () => {
    test('should add image to canvas successfully', async () => {
      const imageUrl = 'test-image.jpg';
      const options = { scale: 0.5, center: true };
      
      const result = await addImageToCanvas(imageUrl, options);
      
      expect(fabric.Image.fromURL).toHaveBeenCalledWith(imageUrl, expect.any(Function), options);
      expect(result.scale).toHaveBeenCalledWith(0.5);
      expect(result.center).toHaveBeenCalled();
      expect(canvas.add).toHaveBeenCalledWith(result);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    test('should handle image loading failure', async () => {
      // Mock failed image loading
      fabric.Image.fromURL.mockImplementation((url, callback) => {
        setTimeout(() => callback(null), 10);
      });
      
      await expect(addImageToCanvas('invalid-image.jpg')).rejects.toThrow('Failed to load image');
    });

    test('should position image correctly', async () => {
      const options = { left: 100, top: 200 };
      
      const result = await addImageToCanvas('test.jpg', options);
      
      expect(fabric.Image.fromURL).toHaveBeenCalledWith('test.jpg', expect.any(Function), options);
      expect(result.set).toHaveBeenCalledWith('left', 100);
      expect(result.set).toHaveBeenCalledWith('top', 200);
    });
  });

  describe('Text handling', () => {
    test('should add text to canvas with default options', () => {
      const result = addTextToCanvas('Hello World');
      
      expect(fabric.Text).toHaveBeenCalledWith('Hello World', expect.objectContaining({
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
        left: 0,
        top: 0
      }));
      expect(canvas.add).toHaveBeenCalledWith(result);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    test('should add text with custom styling', () => {
      const options = {
        fontSize: 36,
        fontFamily: 'Gotham Narrow Bold',
        fill: '#ff0000',
        left: 50,
        top: 100
      };
      
      addTextToCanvas('Custom Text', options);
      
      expect(fabric.Text).toHaveBeenCalledWith('Custom Text', expect.objectContaining(options));
    });

    test('should center text when requested', () => {
      const result = addTextToCanvas('Centered Text', { center: true });
      
      expect(result.center).toHaveBeenCalled();
    });
  });

  describe('Canvas export', () => {
    test('should export canvas as PNG by default', () => {
      const result = exportCanvasAsImage();
      
      expect(canvas.toDataURL).toHaveBeenCalledWith({
        format: 'png',
        quality: 1.0,
        multiplier: 1
      });
      expect(result).toBe('data:image/png;base64,mock-canvas-data');
    });

    test('should export canvas with custom format and quality', () => {
      exportCanvasAsImage('jpeg', 0.8);
      
      expect(canvas.toDataURL).toHaveBeenCalledWith({
        format: 'jpeg',
        quality: 0.8,
        multiplier: 1
      });
    });
  });

  describe('Canvas manipulation', () => {
    test('should clear canvas correctly', () => {
      clearCanvas();
      
      expect(canvas.clear).toHaveBeenCalled();
      expect(canvas.setBackgroundColor).toHaveBeenCalledWith('#ffffff', expect.any(Function));
    });

    test('should resize canvas', () => {
      resizeCanvas(800, 600);
      
      expect(canvas.setDimensions).toHaveBeenCalledWith({ width: 800, height: 600 });
      expect(canvas.renderAll).toHaveBeenCalled();
    });
  });

  describe('Canvas state management', () => {
    test('should save and load canvas state', () => {
      const mockState = { objects: [{ type: 'text', text: 'test' }] };
      
      canvas.toJSON.mockReturnValue(mockState);
      const state = canvas.toJSON();
      
      expect(state).toEqual(mockState);
      
      canvas.loadFromJSON(state);
      expect(canvas.loadFromJSON).toHaveBeenCalledWith(state);
    });

    test('should handle object selection', () => {
      const mockObject = { type: 'text', text: 'test' };
      
      canvas.setActiveObject(mockObject);
      expect(canvas.setActiveObject).toHaveBeenCalledWith(mockObject);
      
      canvas.getActiveObject.mockReturnValue(mockObject);
      const activeObject = canvas.getActiveObject();
      expect(activeObject).toBe(mockObject);
      
      canvas.discardActiveObject();
      expect(canvas.discardActiveObject).toHaveBeenCalled();
    });
  });
});