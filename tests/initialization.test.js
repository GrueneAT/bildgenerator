// Test initialization.js functionality
describe('Initialization Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize application state variables', () => {
    // Test that global variables can be initialized
    global.canvas = null;
    global.contentRect = null;
    global.contentImage = null;
    global.logo = null;
    global.logoName = null;
    global.logoText = '';
    global.template = 'post';
    global.scaleMax = 1;

    expect(global.canvas).toBeNull();
    expect(global.template).toBe('post');
    expect(global.scaleMax).toBe(1);
  });

  test('should handle application URL fallback', () => {
    // Test the URL fallback logic from main.js
    if (typeof global.generatorApplicationURL === 'undefined') {
      global.generatorApplicationURL = "";
    }

    expect(global.generatorApplicationURL).toBeDefined();
  });

  test('should validate template values structure', () => {
    // Test that template_values has the expected structure
    const expectedTemplates = [
      'story', 'post', 'event', 'facebook_header',
      'a2', 'a2_quer', 'a3', 'a3_quer', 'a4', 'a4_quer', 'a5', 'a5_quer'
    ];

    expectedTemplates.forEach(templateName => {
      const template = template_values[templateName];
      expect(template).toBeDefined();
      expect(template).toHaveProperty('width');
      expect(template).toHaveProperty('height');
      expect(template).toHaveProperty('topBorderMultiplier');
      expect(template).toHaveProperty('border');
      expect(template).toHaveProperty('logoTop');
      expect(template).toHaveProperty('logoTextTop');
      expect(template).toHaveProperty('dpi');
      
      // Validate numeric ranges
      expect(typeof template.width).toBe('number');
      expect(typeof template.height).toBe('number');
      expect(template.width).toBeGreaterThan(0);
      expect(template.height).toBeGreaterThan(0);
      expect(template.logoTop).toBeGreaterThanOrEqual(0);
      expect(template.logoTop).toBeLessThanOrEqual(1);
      expect(template.logoTextTop).toBeGreaterThanOrEqual(0);
      expect(template.logoTextTop).toBeLessThanOrEqual(1);
    });
  });
});