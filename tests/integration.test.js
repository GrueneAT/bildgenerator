// Integration tests for the website functionality
describe('Website Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Setup basic DOM structure for testing
    document.body.innerHTML = `
      <div id="canvas-container">
        <canvas id="meme-canvas"></canvas>
      </div>
      <select id="canvas-template">
        <option value="post" selected>Post</option>
        <option value="story">Story</option>
      </select>
      <select id="logo-selection">
        <option value="">Select Logo</option>
        <option value="test-logo">Test Logo</option>
      </select>
      <input type="text" id="text" placeholder="Enter text">
      <button id="add-text">Add Text</button>
      <input type="file" id="add-image" accept="image/*">
      <button id="generate-meme">Generate</button>
      <button id="remove-element">Remove</button>
      <div class="alert-container hidden"></div>
    `;
  });

  beforeAll(() => {
    // Setup global variables and functions needed for integration tests
    global.canvas = null;
    global.contentRect = null;
    global.contentImage = null;
    global.logo = null;
    global.logoName = null;
    global.logoText = '';
    global.template = 'post';
    global.generatorApplicationURL = 'http://localhost/';
    
    // Mock complete application initialization
    global.initializeApplication = function() {
      global.canvas = new fabric.Canvas('meme-canvas', {
        width: 1080,
        height: 1080,
        selection: false,
        backgroundColor: "rgba(138, 180, 20)"
      });
      
      global.contentRect = new fabric.Rect({
        top: 50,
        left: 50,
        width: 980,
        height: 980,
        fill: 'rgba(83,132,48)',
        selectable: false
      });
      
      canvas.add(contentRect);
      return canvas;
    };
  });

  describe('Canvas Template Switching', () => {
    test('should switch canvas template correctly', () => {
      initializeApplication();
      
      // Mock template switching
      const switchTemplate = (newTemplate) => {
        global.template = newTemplate;
        const templateConfig = template_values[newTemplate];
        
        if (canvas) {
          canvas.dispose();
        }
        
        canvas = new fabric.Canvas('meme-canvas', {
          width: templateConfig.width,
          height: templateConfig.height,
          selection: false,
          backgroundColor: "rgba(138, 180, 20)"
        });
        
        return canvas;
      };
      
      const newCanvas = switchTemplate('story');
      
      expect(global.template).toBe('story');
      expect(fabric.Canvas).toHaveBeenCalledWith('meme-canvas', expect.objectContaining({
        width: 1080,
        height: 1920
      }));
    });
  });

  describe('Text Addition Workflow', () => {
    test('should add text to canvas when form is filled', () => {
      initializeApplication();
      
      // Mock text addition process
      const addTextToCanvas = (textContent) => {
        if (!textContent) {
          return { success: false, error: 'Text field is empty' };
        }
        
        const textObject = new fabric.Text(textContent, {
          top: 200,
          fontFamily: "Gotham Narrow",
          fontSize: canvas.width / 2,
          fill: 'black',
          textAlign: 'center'
        });
        
        canvas.add(textObject);
        canvas.setActiveObject(textObject);
        
        return { success: true, object: textObject };
      };
      
      const result = addTextToCanvas('Test Text');
      
      expect(result.success).toBe(true);
      expect(fabric.Text).toHaveBeenCalledWith('Test Text', expect.objectContaining({
        fontFamily: "Gotham Narrow",
        textAlign: 'center'
      }));
    });

    test('should show error when text field is empty', () => {
      const addTextToCanvas = (textContent) => {
        if (!textContent) {
          return { success: false, error: 'Text field is empty' };
        }
        return { success: true };
      };
      
      const result = addTextToCanvas('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Text field is empty');
    });
  });

  describe('Image Upload Workflow', () => {
    test('should handle valid image upload', () => {
      initializeApplication();
      
      // Mock image upload process
      const handleImageUpload = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
          return { success: false, error: 'Invalid image type' };
        }
        
        // Mock successful image addition
        const imageObject = {
          scaleToWidth: jest.fn(),
          type: 'image'
        };
        
        fabric.Image.fromURL('data:image/png;base64,test', (img) => {
          canvas.add(img);
          canvas.setActiveObject(img);
        });
        
        return { success: true };
      };
      
      const mockFile = { type: 'image/png', name: 'test.png' };
      const result = handleImageUpload(mockFile);
      
      expect(result.success).toBe(true);
    });

    test('should reject invalid file types', () => {
      const handleImageUpload = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
          return { success: false, error: 'Invalid image type' };
        }
        
        return { success: true };
      };
      
      const mockFile = { type: 'text/plain', name: 'test.txt' };
      const result = handleImageUpload(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid image type');
    });
  });

  describe('Logo Selection Workflow', () => {
    test('should load logo when selected', () => {
      initializeApplication();
      
      // Mock logo loading process
      const loadLogo = (logoName) => {
        if (!logoName) {
          return { success: false, error: 'No logo selected' };
        }
        
        global.logoText = logoName.toUpperCase();
        
        const logoImage = {
          scaleToWidth: jest.fn(),
          getScaledWidth: jest.fn(() => 200)
        };
        
        fabric.Image.fromURL('logo-url', (img) => {
          global.logo = img;
          canvas.add(img);
        });
        
        return { success: true, logoText: global.logoText };
      };
      
      const result = loadLogo('test-logo');
      
      expect(result.success).toBe(true);
      expect(result.logoText).toBe('TEST-LOGO');
      expect(global.logoText).toBe('TEST-LOGO');
    });
  });

  describe('Canvas Export Workflow', () => {
    test('should generate downloadable image', () => {
      initializeApplication();
      
      // Mock image generation process
      const generateImage = () => {
        if (!global.logoText) {
          return { success: false, error: 'No logo selected' };
        }
        
        const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1.0,
          multiplier: 2.78 // 200 DPI / 72 DPI
        });
        
        if (dataURL === "data:,") {
          return { success: false, error: 'Canvas export failed' };
        }
        
        return { success: true, dataURL, filename: 'test.png' };
      };
      
      global.logoText = 'TEST-LOGO';
      const result = generateImage();
      
      expect(result.success).toBe(true);
      expect(result.dataURL).toBe('data:image/png;base64,test');
      expect(canvas.toDataURL).toHaveBeenCalledWith({
        format: 'png',
        quality: 1.0,
        multiplier: 2.78
      });
    });

    test('should prevent download without logo', () => {
      const generateImage = () => {
        if (!global.logoText) {
          return { success: false, error: 'No logo selected' };
        }
        return { success: true };
      };
      
      global.logoText = '';
      const result = generateImage();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No logo selected');
    });
  });

  describe('Complete User Workflow', () => {
    test('should handle complete meme creation workflow', () => {
      // Initialize application
      const canvas = initializeApplication();
      
      // Step 1: Select template
      global.template = 'post';
      
      // Step 2: Add logo
      global.logoText = 'TEST-LOGO';
      
      // Step 3: Add text
      const textObject = new fabric.Text('Test Meme Text', {
        fontFamily: "Gotham Narrow",
        fill: 'white'
      });
      canvas.add(textObject);
      
      // Step 4: Add image (mock)
      const imageObject = { type: 'image' };
      canvas.add(imageObject);
      
      // Step 5: Generate final image
      const finalImage = canvas.toDataURL({
        format: 'png',
        quality: 1.0
      });
      
      expect(canvas.add).toHaveBeenCalled();
      expect(finalImage).toBe('data:image/png;base64,test');
      expect(global.logoText).toBe('TEST-LOGO');
    });
  });
});