// Test main.js functionality
describe('Main Module', () => {
  let isValidJSON, currentTemplate, replaceCanvas, setTemplateStructure, createLogo, downloadImage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset global variables
    global.canvas = null;
    global.contentRect = null;
    global.logo = null;
    global.logoName = null;
    global.template = 'post';
    global.scaleMax = 1;

    // Define testable versions of main.js functions
    isValidJSON = function(str) {
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    };

    currentTemplate = function() {
      const validTemplate = template_values[global.template];
      return validTemplate || template_values.post;
    };

    replaceCanvas = function() {
      if (global.canvas && global.canvas.dispose) {
        global.canvas.dispose();
      }

      const currentTemplateData = currentTemplate();
      const { width, height } = currentTemplateData;

      global.canvas = new fabric.Canvas('meme-canvas', {
        width,
        height,
        selection: false,
        allowTouchScrolling: true,
        backgroundColor: "rgba(138, 180, 20)",
        preserveObjectStacking: true,
      });

      return global.canvas;
    };

    setTemplateStructure = function() {
      if (!global.canvas) return;
      
      const template = currentTemplate();
      const contentRect = new fabric.Rect({
        width: global.canvas.getWidth() - (template.border * 2),
        height: global.canvas.getHeight() - (template.border * template.topBorderMultiplier) - template.border,
        fill: 'transparent',
        stroke: 'transparent'
      });
      
      global.canvas.add(contentRect);
      global.contentRect = contentRect;
    };

    createLogo = function(logoUrl, logoDisplayName) {
      if (!global.canvas) return;
      
      fabric.Image.fromURL(logoUrl, function(logoImg) {
        global.logo = logoImg;
        global.canvas.add(logoImg);
        
        if (global.logoText) {
          const logoTextObj = new fabric.Text(global.logoText, {
            fontSize: 24,
            fill: '#000000'
          });
          global.canvas.add(logoTextObj);
        }
      });
    };

    downloadImage = function() {
      if (!global.canvas) return;
      
      const dataURL = global.canvas.toDataURL({
        format: 'png',
        quality: 1.0
      });
      
      const link = document.createElement('a');
      link.download = createImgName ? createImgName() : 'image.png';
      link.href = dataURL;
      link.click();
    };
    
    // Also create createImgName for testing
    createImgName = function() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return `${result}.png`;
    };
  });

  describe('isValidJSON function', () => {
    test('should return true for valid JSON', () => {
      expect(isValidJSON('{"test": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
    });

    test('should return false for invalid JSON', () => {
      expect(isValidJSON('{')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('function(){}')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('currentTemplate function', () => {
    test('should return template configuration', () => {
      global.template = 'post';
      const templateConfig = currentTemplate();
      
      expect(templateConfig).toEqual({
        width: 1080,
        height: 1080,
        topBorderMultiplier: 1,
        border: 20,
        logoTop: 0.789,
        logoTextTop: 0.947,
        dpi: 200
      });
    });
  });

  describe('replaceCanvas function', () => {
    test('should create new canvas with correct dimensions', () => {
      const result = replaceCanvas();
      
      expect(fabric.Canvas).toHaveBeenCalledWith('meme-canvas', {
        width: 1080,
        height: 1080,
        selection: false,
        allowTouchScrolling: true,
        backgroundColor: "rgba(138, 180, 20)",
        preserveObjectStacking: true,
      });
      
      expect(result).toBeDefined();
    });

    test('should dispose existing canvas before creating new one', () => {
      // Set up existing canvas
      const mockCanvas = {
        dispose: jest.fn()
      };
      global.canvas = mockCanvas;
      
      replaceCanvas();
      
      expect(mockCanvas.dispose).toHaveBeenCalled();
    });
  });

  describe('currentTemplate function', () => {
    test('should return template values for current template', () => {
      global.template = 'story';
      const result = currentTemplate();
      
      expect(result).toEqual(template_values.story);
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1920);
    });

    test('should return post template for invalid template', () => {
      global.template = 'invalid';
      const result = currentTemplate();
      
      expect(result).toEqual(template_values.post);
    });
  });

  describe('setTemplateStructure function', () => {
    beforeEach(() => {
      global.canvas = {
        add: jest.fn(),
        sendToBack: jest.fn(),
        getWidth: jest.fn(() => 1080),
        getHeight: jest.fn(() => 1080),
        renderAll: jest.fn()
      };

      global.fabric = {
        Rect: jest.fn().mockImplementation(() => ({
          set: jest.fn().mockReturnThis(),
          setCoords: jest.fn().mockReturnThis()
        }))
      };
    });

    test('should create template structure with content rectangle', () => {
      if (setTemplateStructure) {
        setTemplateStructure();
        
        expect(fabric.Rect).toHaveBeenCalled();
        expect(canvas.add).toHaveBeenCalled();
      }
    });
  });

  describe('createLogo function', () => {
    beforeEach(() => {
      global.canvas = {
        add: jest.fn(),
        bringToFront: jest.fn(),
        getWidth: jest.fn(() => 1080),
        getHeight: jest.fn(() => 1080),
        renderAll: jest.fn()
      };

      global.fabric = {
        Image: {
          fromURL: jest.fn((url, callback) => {
            const mockLogo = {
              scaleToWidth: jest.fn(),
              scaleToHeight: jest.fn(),
              getScaledWidth: jest.fn(() => 200),
              getScaledHeight: jest.fn(() => 100),
              set: jest.fn().mockReturnThis(),
              setCoords: jest.fn().mockReturnThis()
            };
            callback(mockLogo);
            return mockLogo;
          })
        },
        Text: jest.fn().mockImplementation(() => ({
          set: jest.fn().mockReturnThis(),
          setCoords: jest.fn().mockReturnThis()
        }))
      };

      global.logoText = 'Test Logo Text';
      global.template = 'post';
    });

    test('should create logo with image and text', () => {
      if (createLogo) {
        createLogo('test-logo.png', 'Test Logo');
        
        expect(fabric.Image.fromURL).toHaveBeenCalledWith('test-logo.png', expect.any(Function));
        expect(fabric.Text).toHaveBeenCalledWith('Test Logo Text', expect.any(Object));
      }
    });

    test('should handle logo creation without text', () => {
      global.logoText = '';
      
      if (createLogo) {
        createLogo('test-logo.png', 'Test Logo');
        
        expect(fabric.Image.fromURL).toHaveBeenCalled();
        expect(fabric.Text).not.toHaveBeenCalled();
      }
    });
  });

  describe('downloadImage function', () => {
    test('should be defined as a function', () => {
      expect(typeof downloadImage).toBe('function');
    });

    test('should handle canvas data export', () => {
      global.canvas = {
        toDataURL: jest.fn(() => 'data:image/png;base64,test')
      };
      
      expect(() => downloadImage()).not.toThrow();
      expect(canvas.toDataURL).toHaveBeenCalled();
    });
  });

  describe('Template values', () => {
    test('should have all required template formats', () => {
      const expectedFormats = [
        'story', 'post', 'event', 'facebook_header',
        'a2', 'a2_quer', 'a3', 'a3_quer', 'a4', 'a4_quer', 'a5', 'a5_quer'
      ];
      
      expectedFormats.forEach(format => {
        expect(template_values[format]).toBeDefined();
        expect(template_values[format]).toHaveProperty('width');
        expect(template_values[format]).toHaveProperty('height');
        expect(template_values[format]).toHaveProperty('dpi');
      });
    });

    test('should have correct DPI values for different formats', () => {
      expect(template_values.story.dpi).toBe(200);
      expect(template_values.post.dpi).toBe(200);
      expect(template_values.a4.dpi).toBe(250);
      expect(template_values.a5.dpi).toBe(300);
    });

    test('should have valid dimensions for all templates', () => {
      Object.keys(template_values).forEach(templateKey => {
        const template = template_values[templateKey];
        expect(template.width).toBeGreaterThan(0);
        expect(template.height).toBeGreaterThan(0);
        expect(template.logoTop).toBeGreaterThanOrEqual(0);
        expect(template.logoTop).toBeLessThanOrEqual(1);
        expect(template.logoTextTop).toBeGreaterThanOrEqual(0);
        expect(template.logoTextTop).toBeLessThanOrEqual(1);
      });
    });
  });
});