/**
 * Unit Tests for Canvas Snap Functionality
 *
 * These tests verify that snap functions:
 * 1. Accept canvas instance as parameter (fixing scope issue)
 * 2. Register event handlers correctly
 * 3. Execute snap logic when conditions are met
 */

// Setup test environment
const fs = require('fs');
const path = require('path');

// Load dependencies in correct order
const constantsPath = path.join(__dirname, '../../resources/js/constants.js');
const canvasUtilsPath = path.join(__dirname, '../../resources/js/canvas-utils.js');

// Execute constants.js to define AppConstants
eval(fs.readFileSync(constantsPath, 'utf8'));

// Execute canvas-utils.js to define CanvasUtils
eval(fs.readFileSync(canvasUtilsPath, 'utf8'));

describe('CanvasUtils Snap Functionality', () => {
  let mockCanvas;
  let mockObject;

  beforeEach(() => {
    // Mock canvas instance
    mockCanvas = {
      width: 1080,
      height: 1920,
      on: jest.fn(),
      centerObjectH: jest.fn(),
      requestRenderAll: jest.fn()
    };

    // Mock canvas object (text, image, shape)
    mockObject = {
      getCenterPoint: jest.fn(() => ({ x: 540, y: 500 })),
      setCoords: jest.fn(),
      set: jest.fn(),
      angle: 0,
      left: 500,
      top: 450,
      type: 'text'
    };

    // Clear global variables
    global.contentImage = undefined;
    global.logo = undefined;
    global.logoName = undefined;

    // Clear console.log mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('enableSnap() - Center Snapping', () => {
    it('should accept canvas instance as parameter (scope fix)', () => {
      // This test verifies the root cause fix - function should accept canvas
      expect(() => {
        CanvasUtils.enableSnap(mockCanvas);
      }).not.toThrow();
    });

    it('should register object:moving event handler on provided canvas', () => {
      CanvasUtils.enableSnap(mockCanvas);

      expect(mockCanvas.on).toHaveBeenCalledWith(
        'object:moving',
        expect.any(Function)
      );
    });

    it('should log initialization with canvas status', () => {
      CanvasUtils.enableSnap(mockCanvas);

      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableSnap] Initializing snap with canvas:',
        'defined'
      );
    });

    it('should calculate correct snap zone from canvas width', () => {
      CanvasUtils.enableSnap(mockCanvas);

      // Default snap zone should be canvas.width / 20 = 1080 / 20 = 54
      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableSnap] Snap zone calculated:',
        54
      );
    });

    it('should snap object to center when within snap zone', () => {
      // Object at center (540, 500) should snap with default snap zone (54)
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.left = 500;
      mockObject.top = 450;

      CanvasUtils.enableSnap(mockCanvas);

      // Get the registered handler and call it
      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      // New implementation uses set() with delta calculation, not centerObjectH()
      expect(mockObject.set).toHaveBeenCalledWith({ left: expect.any(Number) });
      expect(mockObject.setCoords).toHaveBeenCalled();
    });

    it('should snap object near center (within snap zone)', () => {
      // Object at 530 (center-10) should snap with default snap zone (54)
      mockObject.getCenterPoint = jest.fn(() => ({ x: 530, y: 500 }));
      mockObject.left = 490;
      mockObject.top = 450;

      CanvasUtils.enableSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      // Should call set() to adjust position
      expect(mockObject.set).toHaveBeenCalled();
      expect(mockObject.setCoords).toHaveBeenCalled();
    });

    it('should NOT snap object when outside snap zone', () => {
      // Object at 200 (center-340) should NOT snap with default snap zone (54)
      mockObject.getCenterPoint = jest.fn(() => ({ x: 200, y: 500 }));
      mockObject.set = jest.fn(); // Reset mock

      CanvasUtils.enableSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      // Should not call set() when outside snap zone
      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should skip snapping for contentImage (background)', () => {
      global.contentImage = mockObject;
      mockObject.set = jest.fn();

      CanvasUtils.enableSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should respect custom snap zone parameter', () => {
      const customSnapZone = 100;
      CanvasUtils.enableSnap(mockCanvas, customSnapZone);

      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableSnap] Snap zone calculated:',
        customSnapZone
      );
    });
  });

  describe('enableRotationSnap() - Angle Snapping', () => {
    it('should accept canvas instance as parameter (scope fix)', () => {
      // This test verifies the root cause fix - function should accept canvas
      expect(() => {
        CanvasUtils.enableRotationSnap(mockCanvas);
      }).not.toThrow();
    });

    it('should register object:rotating event handler on provided canvas', () => {
      CanvasUtils.enableRotationSnap(mockCanvas);

      expect(mockCanvas.on).toHaveBeenCalledWith(
        'object:rotating',
        expect.any(Function)
      );
    });

    it('should log initialization with canvas status', () => {
      CanvasUtils.enableRotationSnap(mockCanvas);

      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableRotationSnap] Initializing rotation snap with canvas:',
        'defined'
      );
    });

    it('should use default tolerance and snap angles from constants', () => {
      CanvasUtils.enableRotationSnap(mockCanvas);

      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableRotationSnap] Tolerance:',
        2,
        'Snap angles:',
        [0, 90, 180, 270]
      );
    });

    it('should snap to 0° when angle is 1° (within tolerance)', () => {
      mockObject.angle = 1;
      const centerBefore = { x: 540, y: 500 };
      mockObject.getCenterPoint = jest.fn()
        .mockReturnValueOnce(centerBefore) // Before snap
        .mockReturnValueOnce(centerBefore); // After snap (should be same)

      mockObject.set = jest.fn(function(props) {
        if (props.angle !== undefined) mockObject.angle = props.angle;
        if (props.left !== undefined) mockObject.left = props.left;
        if (props.top !== undefined) mockObject.top = props.top;
      });

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      // Should set angle to 0
      expect(mockObject.set).toHaveBeenCalledWith({ angle: 0 });
      // Should also set position to preserve center
      expect(mockObject.set).toHaveBeenCalledWith({
        left: expect.any(Number),
        top: expect.any(Number)
      });
      expect(mockObject.setCoords).toHaveBeenCalled();
    });

    it('should snap to 90° when angle is 89° (within tolerance)', () => {
      mockObject.angle = 89;
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.set = jest.fn(function(props) {
        if (props.angle !== undefined) mockObject.angle = props.angle;
      });

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).toHaveBeenCalledWith({ angle: 90 });
    });

    it('should snap to 180° when angle is 181°', () => {
      mockObject.angle = 181;
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).toHaveBeenCalledWith({ angle: 180 });
    });

    it('should snap to 270° when angle is 269°', () => {
      mockObject.angle = 269;
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).toHaveBeenCalledWith({ angle: 270 });
    });

    it('should NOT snap when angle difference exceeds tolerance', () => {
      mockObject.angle = 45; // 45 degrees from nearest snap (0 or 90)
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should skip rotation snap for contentImage', () => {
      global.contentImage = mockObject;
      mockObject.angle = 1;
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should skip rotation snap for logo', () => {
      global.logo = mockObject;
      mockObject.angle = 1;
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should skip rotation snap for logoName', () => {
      global.logoName = mockObject;
      mockObject.angle = 1;
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).not.toHaveBeenCalled();
    });

    it('should handle negative angles correctly', () => {
      mockObject.angle = -1; // Should normalize to 359° and snap to 0°
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).toHaveBeenCalledWith({ angle: 0 });
    });

    it('should handle angles > 360° correctly', () => {
      mockObject.angle = 361; // Should normalize to 1° and snap to 0°
      mockObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));
      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      expect(mockObject.set).toHaveBeenCalledWith({ angle: 0 });
    });

    it('should preserve center point during rotation snap', () => {
      mockObject.angle = 88;
      mockObject.left = 500;
      mockObject.top = 450;

      const centerBefore = { x: 540, y: 500 };
      const centerAfter = { x: 545, y: 505 }; // Simulated shift after rotation

      mockObject.getCenterPoint = jest.fn()
        .mockReturnValueOnce(centerBefore)  // Before angle change
        .mockReturnValueOnce(centerAfter);  // After angle change

      mockObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas, 2);

      const handler = mockCanvas.on.mock.calls[0][1];
      handler({ target: mockObject });

      // Should set angle
      expect(mockObject.set).toHaveBeenCalledWith({ angle: 90 });

      // Should adjust position to restore center (delta = -5, -5)
      expect(mockObject.set).toHaveBeenCalledWith({
        left: 495,  // 500 + (540 - 545)
        top: 445    // 450 + (500 - 505)
      });
    });

    it('should respect custom tolerance parameter', () => {
      const customTolerance = 5;
      CanvasUtils.enableRotationSnap(mockCanvas, customTolerance);

      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableRotationSnap] Tolerance:',
        customTolerance,
        'Snap angles:',
        [0, 90, 180, 270]
      );
    });
  });

  describe('enablePictureMove() - Background Image Constraints', () => {
    it('should accept canvas instance as parameter (scope fix)', () => {
      // This test verifies the root cause fix - function should accept canvas
      expect(() => {
        CanvasUtils.enablePictureMove(mockCanvas);
      }).not.toThrow();
    });

    it('should register object:moving event handler on provided canvas', () => {
      CanvasUtils.enablePictureMove(mockCanvas);

      expect(mockCanvas.on).toHaveBeenCalledWith(
        'object:moving',
        expect.any(Function)
      );
    });
  });

  describe('Scope Issue Regression Tests', () => {
    it('should work with different canvas instances', () => {
      const canvas1 = { ...mockCanvas, width: 1080, on: jest.fn() };
      const canvas2 = { ...mockCanvas, width: 1920, on: jest.fn() };

      CanvasUtils.enableSnap(canvas1);
      CanvasUtils.enableSnap(canvas2);

      // Both canvases should have handlers registered
      expect(canvas1.on).toHaveBeenCalled();
      expect(canvas2.on).toHaveBeenCalled();
    });

    it('should not fail when global canvas is undefined', () => {
      // This was the original bug - functions should work even if global canvas is undefined
      global.canvas = undefined;

      expect(() => {
        CanvasUtils.enableSnap(mockCanvas);
        CanvasUtils.enableRotationSnap(mockCanvas);
        CanvasUtils.enablePictureMove(mockCanvas);
      }).not.toThrow();
    });

    it('should use provided canvas instance, not global canvas', () => {
      global.canvas = { width: 999, on: jest.fn() };
      const localCanvas = { width: 1080, on: jest.fn() };

      CanvasUtils.enableSnap(localCanvas);

      // Should calculate snap zone from localCanvas, not global.canvas
      expect(console.log).toHaveBeenCalledWith(
        '[CanvasUtils.enableSnap] Snap zone calculated:',
        54 // 1080 / 20, not 999 / 20
      );

      // Should register handler on localCanvas, not global.canvas
      expect(localCanvas.on).toHaveBeenCalled();
      expect(global.canvas.on).not.toHaveBeenCalled();
    });
  });
});
