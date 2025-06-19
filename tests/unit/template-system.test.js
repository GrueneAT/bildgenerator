/**
 * @jest-environment jsdom
 */

// Mock template values as they would exist in main.js
const mockTemplateValues = {
  'story': {
    width: 1080,
    height: 1920,
    border: 50,
    logoPosition: 'bottom-right'
  },
  'post-square': {
    width: 1080,
    height: 1080,
    border: 40,
    logoPosition: 'bottom-left'
  },
  'post-landscape': {
    width: 1200,
    height: 630,
    border: 30,
    logoPosition: 'top-right'
  }
};

function getTemplateConfig(templateName) {
  return mockTemplateValues[templateName] || null;
}

function calculateContentArea(template) {
  if (!template) return null;
  
  const contentWidth = template.width - (template.border * 2);
  const contentHeight = template.height - (template.border * 2);
  
  return {
    width: contentWidth,
    height: contentHeight,
    x: template.border,
    y: template.border
  };
}

function isValidTemplate(templateName) {
  return Object.keys(mockTemplateValues).includes(templateName);
}

describe('Template System', () => {
  describe('getTemplateConfig', () => {
    test('should return story template configuration', () => {
      const config = getTemplateConfig('story');
      
      expect(config).toEqual({
        width: 1080,
        height: 1920,
        border: 50,
        logoPosition: 'bottom-right'
      });
    });

    test('should return post-square template configuration', () => {
      const config = getTemplateConfig('post-square');
      
      expect(config).toEqual({
        width: 1080,
        height: 1080,
        border: 40,
        logoPosition: 'bottom-left'
      });
    });

    test('should return null for non-existent template', () => {
      const config = getTemplateConfig('non-existent');
      
      expect(config).toBeNull();
    });
  });

  describe('calculateContentArea', () => {
    test('should calculate correct content area for story template', () => {
      const template = getTemplateConfig('story');
      const contentArea = calculateContentArea(template);
      
      expect(contentArea).toEqual({
        width: 980,  // 1080 - (50 * 2)
        height: 1820, // 1920 - (50 * 2)
        x: 50,
        y: 50
      });
    });

    test('should calculate correct content area for post-square template', () => {
      const template = getTemplateConfig('post-square');
      const contentArea = calculateContentArea(template);
      
      expect(contentArea).toEqual({
        width: 1000, // 1080 - (40 * 2)
        height: 1000, // 1080 - (40 * 2)
        x: 40,
        y: 40
      });
    });

    test('should return null for invalid template', () => {
      const contentArea = calculateContentArea(null);
      
      expect(contentArea).toBeNull();
    });
  });

  describe('isValidTemplate', () => {
    test('should return true for valid templates', () => {
      expect(isValidTemplate('story')).toBe(true);
      expect(isValidTemplate('post-square')).toBe(true);
      expect(isValidTemplate('post-landscape')).toBe(true);
    });

    test('should return false for invalid templates', () => {
      expect(isValidTemplate('invalid-template')).toBe(false);
      expect(isValidTemplate('')).toBe(false);
      expect(isValidTemplate(null)).toBe(false);
    });
  });

  describe('Template dimensions', () => {
    test('story template should have correct aspect ratio', () => {
      const template = getTemplateConfig('story');
      const aspectRatio = template.width / template.height;
      
      // Story format should be 9:16 aspect ratio
      expect(aspectRatio).toBeCloseTo(9/16, 2);
    });

    test('post-square template should be square', () => {
      const template = getTemplateConfig('post-square');
      
      expect(template.width).toBe(template.height);
    });

    test('post-landscape template should be landscape', () => {
      const template = getTemplateConfig('post-landscape');
      
      expect(template.width).toBeGreaterThan(template.height);
    });
  });
});