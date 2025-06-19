/**
 * @jest-environment jsdom
 */

// Mock QRCode library
global.QRCode = {
  toDataURL: jest.fn((text, options, callback) => {
    const mockQRDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    if (typeof options === 'function') {
      // QRCode.toDataURL(text, callback)
      callback = options;
      options = {};
    }
    
    setTimeout(() => {
      if (text && text.length > 0) {
        callback(null, mockQRDataURL);
      } else {
        callback(new Error('Empty text provided'));
      }
    }, 10);
  }),
  
  toString: jest.fn((text, options, callback) => {
    const mockSVG = '<svg>mock-qr-svg</svg>';
    
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    setTimeout(() => {
      if (text && text.length > 0) {
        callback(null, mockSVG);
      } else {
        callback(new Error('Empty text provided'));
      }
    }, 10);
  })
};

// Mock canvas and fabric
let canvas = {
  add: jest.fn(),
  renderAll: jest.fn(),
  remove: jest.fn(),
  getObjects: jest.fn(() => [])
};

global.fabric = {
  Image: {
    fromURL: jest.fn((url, callback) => {
      const mockImage = {
        type: 'image',
        scale: jest.fn(),
        set: jest.fn(),
        center: jest.fn()
      };
      setTimeout(() => callback(mockImage), 10);
    })
  }
};

// QR Code generation functions
function generateQRCode(text, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      width: 256,
      height: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...options
    };
    
    QRCode.toDataURL(text, defaultOptions, (error, url) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          dataURL: url,
          text: text,
          options: defaultOptions
        });
      }
    });
  });
}

function generateQRCodeSVG(text, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      type: 'svg',
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };
    
    QRCode.toString(text, defaultOptions, (error, svg) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          svg: svg,
          text: text,
          options: defaultOptions
        });
      }
    });
  });
}

function addQRCodeToCanvas(text, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const qrResult = await generateQRCode(text, options.qrOptions);
      
      fabric.Image.fromURL(qrResult.dataURL, (qrImage) => {
        if (!qrImage) {
          reject(new Error('Failed to create QR code image'));
          return;
        }
        
        // Apply positioning and scaling
        if (options.scale) qrImage.scale(options.scale);
        if (options.left !== undefined) qrImage.set('left', options.left);
        if (options.top !== undefined) qrImage.set('top', options.top);
        if (options.center) qrImage.center();
        
        // Add to canvas
        canvas.add(qrImage);
        canvas.renderAll();
        
        resolve({
          qrImage: qrImage,
          qrData: qrResult
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateQRText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text must be a non-empty string' };
  }
  
  if (text.length > 4000) {
    return { valid: false, error: 'Text too long for QR code' };
  }
  
  return { valid: true };
}

function removeQRCodeFromCanvas() {
  const objects = canvas.getObjects();
  const qrCodes = objects.filter(obj => obj.type === 'image' && obj.isQRCode);
  
  qrCodes.forEach(qr => {
    canvas.remove(qr);
  });
  
  canvas.renderAll();
  return qrCodes.length;
}

describe('QR Code Generation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canvas.getObjects.mockReturnValue([]);
    
    // Reset QRCode mock to default implementation
    QRCode.toDataURL.mockImplementation((text, options, callback) => {
      const mockQRDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      
      setTimeout(() => {
        if (text && text.length > 0) {
          callback(null, mockQRDataURL);
        } else {
          callback(new Error('Empty text provided'));
        }
      }, 10);
    });
  });

  describe('QR Code generation', () => {
    test('should generate QR code successfully', async () => {
      const result = await generateQRCode('https://example.com');
      
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          width: 256,
          height: 256,
          errorCorrectionLevel: 'M'
        }),
        expect.any(Function)
      );
      
      expect(result).toHaveProperty('dataURL');
      expect(result).toHaveProperty('text', 'https://example.com');
      expect(result).toHaveProperty('options');
    });

    test('should generate QR code with custom options', async () => {
      const options = {
        width: 512,
        color: { dark: '#ff0000', light: '#ffffff' }
      };
      
      await generateQRCode('test text', options);
      
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'test text',
        expect.objectContaining(options),
        expect.any(Function)
      );
    });

    test('should handle QR code generation error', async () => {
      // Save original implementation
      const originalImpl = QRCode.toDataURL;
      
      QRCode.toDataURL.mockImplementation((text, options, callback) => {
        setTimeout(() => callback(new Error('QR generation failed')), 10);
      });
      
      await expect(generateQRCode('test')).rejects.toThrow('QR generation failed');
      
      // Restore original implementation
      QRCode.toDataURL = originalImpl;
    });

    test('should generate SVG QR code', async () => {
      const result = await generateQRCodeSVG('https://example.com');
      
      expect(QRCode.toString).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          type: 'svg',
          width: 256
        }),
        expect.any(Function)
      );
      
      expect(result).toHaveProperty('svg', '<svg>mock-qr-svg</svg>');
      expect(result).toHaveProperty('text', 'https://example.com');
    });
  });

  describe('Canvas integration', () => {
    test('should add QR code to canvas successfully', async () => {
      const result = await addQRCodeToCanvas('https://example.com', {
        scale: 0.5,
        center: true
      });
      
      expect(fabric.Image.fromURL).toHaveBeenCalled();
      expect(result.qrImage.scale).toHaveBeenCalledWith(0.5);
      expect(result.qrImage.center).toHaveBeenCalled();
      expect(canvas.add).toHaveBeenCalledWith(result.qrImage);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    test('should position QR code correctly', async () => {
      await addQRCodeToCanvas('test', { left: 100, top: 200 });
      
      expect(fabric.Image.fromURL).toHaveBeenCalled();
      const imageCallback = fabric.Image.fromURL.mock.calls[0][1];
      const mockImage = {
        scale: jest.fn(),
        set: jest.fn(),
        center: jest.fn()
      };
      
      imageCallback(mockImage);
      
      expect(mockImage.set).toHaveBeenCalledWith('left', 100);
      expect(mockImage.set).toHaveBeenCalledWith('top', 200);
    });

    test('should handle canvas integration failure', async () => {
      // Save original implementation  
      const originalImpl = fabric.Image.fromURL;
      
      fabric.Image.fromURL.mockImplementation((url, callback) => {
        setTimeout(() => callback(null), 10);
      });
      
      await expect(addQRCodeToCanvas('test')).rejects.toThrow('Failed to create QR code image');
      
      // Restore original implementation
      fabric.Image.fromURL = originalImpl;
    });
  });

  describe('Text validation', () => {
    test('should validate valid text', () => {
      const result = validateQRText('https://example.com');
      expect(result.valid).toBe(true);
    });

    test('should reject empty text', () => {
      const result = validateQRText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text must be a non-empty string');
    });

    test('should reject non-string input', () => {
      const result = validateQRText(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text must be a non-empty string');
    });

    test('should reject text that is too long', () => {
      const longText = 'a'.repeat(4001);
      const result = validateQRText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Text too long for QR code');
    });
  });

  describe('URL validation', () => {
    test('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('https://www.example.com/path?query=1')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('')).toBe(false);
      // Note: ftp:// is actually a valid URL scheme, just not for web browsing
      expect(validateURL('invalid-url-format')).toBe(false);
    });
  });

  describe('QR Code management', () => {
    test('should remove QR codes from canvas', () => {
      const mockQRCodes = [
        { type: 'image', isQRCode: true },
        { type: 'image', isQRCode: true }
      ];
      const mockOtherObjects = [
        { type: 'text' },
        { type: 'image', isQRCode: false }
      ];
      
      canvas.getObjects.mockReturnValue([...mockQRCodes, ...mockOtherObjects]);
      
      const removedCount = removeQRCodeFromCanvas();
      
      expect(removedCount).toBe(2);
      expect(canvas.remove).toHaveBeenCalledTimes(2);
      expect(canvas.remove).toHaveBeenCalledWith(mockQRCodes[0]);
      expect(canvas.remove).toHaveBeenCalledWith(mockQRCodes[1]);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    test('should handle no QR codes to remove', () => {
      canvas.getObjects.mockReturnValue([
        { type: 'text' },
        { type: 'image', isQRCode: false }
      ]);
      
      const removedCount = removeQRCodeFromCanvas();
      
      expect(removedCount).toBe(0);
      expect(canvas.remove).not.toHaveBeenCalled();
      expect(canvas.renderAll).toHaveBeenCalled();
    });
  });
});