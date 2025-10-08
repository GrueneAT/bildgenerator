/**
 * Integration Tests for Snapping Functionality
 *
 * These tests run in a real browser environment (jsdom) and verify:
 * 1. Event handlers are properly registered on the canvas
 * 2. Snapping functions are called when expected
 * 3. The implementation actually works in the bundled application
 */

const fs = require('fs');
const path = require('path');

// Load the actual bundled code
const constantsPath = path.join(__dirname, '../../resources/js/constants.js');
const canvasUtilsPath = path.join(__dirname, '../../resources/js/canvas-utils.js');

// Execute to define globals
eval(fs.readFileSync(constantsPath, 'utf8'));
eval(fs.readFileSync(canvasUtilsPath, 'utf8'));

describe('Snapping Integration Tests', () => {
  let mockCanvas;
  let mockTextObject;
  let mockImageObject;
  let mockCircleObject;
  let registeredHandlers;

  beforeEach(() => {
    registeredHandlers = {
      'object:moving': [],
      'object:rotating': []
    };

    // Mock canvas that tracks event registration
    mockCanvas = {
      width: 1080,
      height: 1920,
      on: jest.fn((event, handler) => {
        if (!registeredHandlers[event]) {
          registeredHandlers[event] = [];
        }
        registeredHandlers[event].push(handler);
      })
    };

    // Mock fabric objects
    mockTextObject = {
      type: 'text',
      angle: 0,
      left: 500,
      top: 450,
      getCenterPoint: jest.fn(() => ({ x: 540, y: 500 })),
      set: jest.fn(function(props) {
        Object.assign(this, props);
      }),
      setCoords: jest.fn()
    };

    mockImageObject = {
      type: 'image',
      angle: 0,
      left: 300,
      top: 400,
      getCenterPoint: jest.fn(() => ({ x: 350, y: 450 })),
      set: jest.fn(function(props) {
        Object.assign(this, props);
      }),
      setCoords: jest.fn()
    };

    mockCircleObject = {
      type: 'circle',
      angle: 0,
      left: 600,
      top: 700,
      getCenterPoint: jest.fn(() => ({ x: 650, y: 750 })),
      set: jest.fn(function(props) {
        Object.assign(this, props);
      }),
      setCoords: jest.fn()
    };

    // Clear globals
    global.contentImage = undefined;
    global.logo = undefined;
    global.logoName = undefined;

    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Integration: Event Handler Registration', () => {
    test('INTEGRATION: enableSnap() registers object:moving handler in canvas', () => {
      CanvasUtils.enableSnap(mockCanvas);

      expect(mockCanvas.on).toHaveBeenCalledWith('object:moving', expect.any(Function));
      expect(registeredHandlers['object:moving'].length).toBe(1);
    });

    test('INTEGRATION: enableRotationSnap() registers object:rotating handler in canvas', () => {
      CanvasUtils.enableRotationSnap(mockCanvas);

      expect(mockCanvas.on).toHaveBeenCalledWith('object:rotating', expect.any(Function));
      expect(registeredHandlers['object:rotating'].length).toBe(1);
    });

    test('INTEGRATION: Both snap functions can be enabled simultaneously', () => {
      CanvasUtils.enableSnap(mockCanvas);
      CanvasUtils.enableRotationSnap(mockCanvas);

      expect(registeredHandlers['object:moving'].length).toBe(1);
      expect(registeredHandlers['object:rotating'].length).toBe(1);
    });
  });

  describe('Integration: Center Snapping Behavior', () => {
    test('INTEGRATION: Center snap is triggered when object moves near center', () => {
      // Setup: Position object near center (within snap zone)
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 530, y: 500 }));
      mockTextObject.left = 490;

      CanvasUtils.enableSnap(mockCanvas);
      const handler = registeredHandlers['object:moving'][0];

      // Simulate fabric.js firing the event
      handler({ target: mockTextObject });

      // Verify: Position was adjusted
      expect(mockTextObject.set).toHaveBeenCalled();
      expect(mockTextObject.setCoords).toHaveBeenCalled();
    });

    test('INTEGRATION: Center snap is NOT triggered when object is far from center', () => {
      // Setup: Position object far from center
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 200, y: 500 }));
      mockTextObject.set = jest.fn();

      CanvasUtils.enableSnap(mockCanvas);
      const handler = registeredHandlers['object:moving'][0];

      // Simulate fabric.js firing the event
      handler({ target: mockTextObject });

      // Verify: No position adjustment
      expect(mockTextObject.set).not.toHaveBeenCalled();
    });

    test('INTEGRATION: Center snap works for images', () => {
      mockImageObject.getCenterPoint = jest.fn(() => ({ x: 535, y: 600 }));
      mockImageObject.left = 495;

      CanvasUtils.enableSnap(mockCanvas);
      const handler = registeredHandlers['object:moving'][0];

      handler({ target: mockImageObject });

      expect(mockImageObject.set).toHaveBeenCalled();
      expect(mockImageObject.setCoords).toHaveBeenCalled();
    });

    test('INTEGRATION: Center snap works for circles', () => {
      mockCircleObject.getCenterPoint = jest.fn(() => ({ x: 545, y: 750 }));
      mockCircleObject.left = 505;

      CanvasUtils.enableSnap(mockCanvas);
      const handler = registeredHandlers['object:moving'][0];

      handler({ target: mockCircleObject });

      expect(mockCircleObject.set).toHaveBeenCalled();
      expect(mockCircleObject.setCoords).toHaveBeenCalled();
    });
  });

  describe('Integration: Rotation Snapping Behavior', () => {
    test('INTEGRATION: Rotation snap is triggered when angle is near snap point', () => {
      // Setup: Angle near 90° (within 2° tolerance)
      mockTextObject.angle = 88;
      mockTextObject.getCenterPoint = jest.fn()
        .mockReturnValueOnce({ x: 540, y: 500 })  // Before snap
        .mockReturnValueOnce({ x: 540, y: 500 }); // After snap

      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      // Simulate fabric.js firing the event during rotation
      handler({ target: mockTextObject });

      // Verify: Angle was snapped and position adjusted
      expect(mockTextObject.set).toHaveBeenCalledWith({ angle: 90 });
      expect(mockTextObject.set).toHaveBeenCalledWith({
        left: expect.any(Number),
        top: expect.any(Number)
      });
      expect(mockTextObject.setCoords).toHaveBeenCalled();
    });

    test('INTEGRATION: Rotation snap is NOT triggered when angle is far from snap points', () => {
      // Setup: Angle far from snap points (45° is halfway between 0° and 90°)
      mockTextObject.angle = 45;
      mockTextObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      handler({ target: mockTextObject });

      // Verify: No snapping occurred
      expect(mockTextObject.set).not.toHaveBeenCalled();
    });

    test('INTEGRATION: Rotation snap works for all snap angles (0°, 90°, 180°, 270°)', () => {
      const testCases = [
        { testAngle: 1, expectedSnap: 0 },
        { testAngle: 89, expectedSnap: 90 },
        { testAngle: 179, expectedSnap: 180 },
        { testAngle: 269, expectedSnap: 270 }
      ];

      testCases.forEach(({ testAngle, expectedSnap }) => {
        mockImageObject.angle = testAngle;
        mockImageObject.set = jest.fn();
        mockImageObject.getCenterPoint = jest.fn(() => ({ x: 350, y: 450 }));

        CanvasUtils.enableRotationSnap(mockCanvas);
        const handler = registeredHandlers['object:rotating'][0];

        handler({ target: mockImageObject });

        expect(mockImageObject.set).toHaveBeenCalledWith({ angle: expectedSnap });

        // Reset for next iteration
        registeredHandlers['object:rotating'] = [];
      });
    });

    test('INTEGRATION: Rotation snap preserves center point for images', () => {
      mockImageObject.angle = 88;
      mockImageObject.left = 300;
      mockImageObject.top = 400;

      const centerBefore = { x: 350, y: 450 };
      const centerAfter = { x: 355, y: 455 }; // Simulated shift

      mockImageObject.getCenterPoint = jest.fn()
        .mockReturnValueOnce(centerBefore)
        .mockReturnValueOnce(centerAfter);

      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      handler({ target: mockImageObject });

      // Verify: Position was adjusted to restore center
      const positionCall = mockImageObject.set.mock.calls.find(
        call => call[0].left !== undefined && call[0].top !== undefined
      );
      expect(positionCall).toBeDefined();
      expect(positionCall[0].left).toBe(295); // 300 + (350 - 355)
      expect(positionCall[0].top).toBe(395);  // 400 + (450 - 455)
    });
  });

  describe('Integration: Protected Objects', () => {
    test('INTEGRATION: contentImage is excluded from center snapping', () => {
      global.contentImage = mockImageObject;
      mockImageObject.getCenterPoint = jest.fn(() => ({ x: 535, y: 600 }));
      mockImageObject.set = jest.fn();

      CanvasUtils.enableSnap(mockCanvas);
      const handler = registeredHandlers['object:moving'][0];

      handler({ target: mockImageObject });

      expect(mockImageObject.set).not.toHaveBeenCalled();
    });

    test('INTEGRATION: logo is excluded from rotation snapping', () => {
      global.logo = mockImageObject;
      mockImageObject.angle = 88;
      mockImageObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      handler({ target: mockImageObject });

      expect(mockImageObject.set).not.toHaveBeenCalled();
    });

    test('INTEGRATION: logoName is excluded from both snapping types', () => {
      global.logoName = mockTextObject;

      // Test center snap exclusion
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 535, y: 500 }));
      mockTextObject.set = jest.fn();

      CanvasUtils.enableSnap(mockCanvas);
      const centerHandler = registeredHandlers['object:moving'][0];
      centerHandler({ target: mockTextObject });
      expect(mockTextObject.set).not.toHaveBeenCalled();

      // Test rotation snap exclusion
      mockTextObject.angle = 88;
      mockTextObject.set = jest.fn();

      CanvasUtils.enableRotationSnap(mockCanvas);
      const rotationHandler = registeredHandlers['object:rotating'][0];
      rotationHandler({ target: mockTextObject });
      expect(mockTextObject.set).not.toHaveBeenCalled();
    });
  });

  describe('Integration: Real-World Scenarios', () => {
    test('INTEGRATION: User adds text and rotates it near 90°', () => {
      // Simulate application startup
      CanvasUtils.enableSnap(mockCanvas);
      CanvasUtils.enableRotationSnap(mockCanvas);

      const centerHandler = registeredHandlers['object:moving'][0];
      const rotationHandler = registeredHandlers['object:rotating'][0];

      // User adds text (positioned near center)
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 530, y: 500 }));
      mockTextObject.left = 490;

      // User drags text - should snap to center
      centerHandler({ target: mockTextObject });
      expect(mockTextObject.set).toHaveBeenCalled();

      // User rotates text to 88°
      mockTextObject.angle = 88;
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 540, y: 500 }));

      // Rotation snap should trigger
      rotationHandler({ target: mockTextObject });
      expect(mockTextObject.set).toHaveBeenCalledWith({ angle: 90 });
    });

    test('INTEGRATION: Multiple objects can be snapped independently', () => {
      CanvasUtils.enableSnap(mockCanvas);
      CanvasUtils.enableRotationSnap(mockCanvas);

      const centerHandler = registeredHandlers['object:moving'][0];
      const rotationHandler = registeredHandlers['object:rotating'][0];

      // Snap text to center
      mockTextObject.getCenterPoint = jest.fn(() => ({ x: 535, y: 500 }));
      centerHandler({ target: mockTextObject });
      expect(mockTextObject.set).toHaveBeenCalled();

      // Snap image angle
      mockImageObject.angle = 179;
      mockImageObject.getCenterPoint = jest.fn(() => ({ x: 350, y: 450 }));
      rotationHandler({ target: mockImageObject });
      expect(mockImageObject.set).toHaveBeenCalledWith({ angle: 180 });

      // Snap circle to center
      mockCircleObject.getCenterPoint = jest.fn(() => ({ x: 542, y: 750 }));
      centerHandler({ target: mockCircleObject });
      expect(mockCircleObject.set).toHaveBeenCalled();
    });
  });

  describe('Integration: Error Conditions', () => {
    test('INTEGRATION: Handles null/undefined target gracefully', () => {
      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      expect(() => {
        handler({ target: null });
      }).not.toThrow();

      expect(() => {
        handler({ target: undefined });
      }).not.toThrow();
    });

    test('INTEGRATION: Handles objects without getCenterPoint method', () => {
      const brokenObject = {
        type: 'rect',
        angle: 88
      };

      CanvasUtils.enableRotationSnap(mockCanvas);
      const handler = registeredHandlers['object:rotating'][0];

      // Should not throw, just skip
      expect(() => {
        handler({ target: brokenObject });
      }).not.toThrow();
    });
  });
});
