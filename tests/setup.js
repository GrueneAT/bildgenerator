// Test setup file
require('@testing-library/jest-dom');

// Mock jQuery
global.jQuery = jest.fn(() => ({
  val: jest.fn(),
  attr: jest.fn(),
  find: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  off: jest.fn().mockReturnThis(),
  addClass: jest.fn().mockReturnThis(),
  removeClass: jest.fn().mockReturnThis(),
  hasClass: jest.fn(),
  prop: jest.fn().mockReturnThis(),
  trigger: jest.fn().mockReturnThis(),
  width: jest.fn(),
  height: jest.fn(),
  css: jest.fn().mockReturnThis(),
  fadeIn: jest.fn().mockReturnThis(),
  fadeOut: jest.fn().mockReturnThis(),
  html: jest.fn().mockReturnThis(),
  ready: jest.fn(callback => callback()),
  getJSON: jest.fn(),
  parseJSON: jest.fn(),
  each: jest.fn()
}));

global.$ = global.jQuery;

// Mock Fabric.js
global.fabric = {
  Canvas: jest.fn().mockImplementation(() => ({
    width: 1080,
    height: 1080,
    add: jest.fn(),
    remove: jest.fn(),
    renderAll: jest.fn(),
    dispose: jest.fn(),
    getActiveObject: jest.fn(),
    setActiveObject: jest.fn(),
    centerObject: jest.fn(),
    centerObjectH: jest.fn(),
    bringToFront: jest.fn(),
    sendToBack: jest.fn(),
    getObjects: jest.fn(() => []),
    on: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,test')
  })),
  Rect: jest.fn(),
  Text: jest.fn(),
  Circle: jest.fn(),
  Image: {
    fromURL: jest.fn((url, callback) => {
      const mockImage = {
        scaleToWidth: jest.fn(),
        scaleToHeight: jest.fn(),
        getScaledWidth: jest.fn(() => 100),
        getScaledHeight: jest.fn(() => 100),
        scale: jest.fn().mockReturnThis(),
        setCoords: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        get: jest.fn(),
        lockMovementX: false,
        lockMovementY: false,
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        selectable: true
      };
      callback(mockImage);
      return mockImage;
    })
  },
  Object: {
    prototype: {
      set: jest.fn()
    }
  }
};

// Mock FontFaceObserver
global.FontFaceObserver = jest.fn().mockImplementation(() => ({
  load: jest.fn().mockResolvedValue()
}));

// Mock template values
global.template_values = {
  story: {
    width: 1080,
    height: 1920,
    topBorderMultiplier: 2,
    border: 10,
    logoTop: 0.830,
    logoTextTop: 0.9423,
    dpi: 200
  },
  post: {
    width: 1080,
    height: 1080,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.789,
    logoTextTop: 0.947,
    dpi: 200
  },
  event: {
    width: 1200,
    height: 628,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.678,
    logoTextTop: 0.9,
    dpi: 200
  },
  facebook_header: {
    width: 1958,
    height: 745,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.6,
    logoTextTop: 0.872,
    dpi: 150
  },
  a2: {
    width: 4961,
    height: 7016,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.826,
    logoTextTop: 0.964,
    dpi: 150
  },
  a2_quer: {
    width: 7016,
    height: 4961,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.739,
    logoTextTop: 0.9257,
    dpi: 150
  },
  a3: {
    width: 3508,
    height: 4961,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.826,
    logoTextTop: 0.964,
    dpi: 200
  },
  a3_quer: {
    width: 4961,
    height: 3508,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.739,
    logoTextTop: 0.9257,
    dpi: 200
  },
  a4: {
    width: 2480,
    height: 3508,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.826,
    logoTextTop: 0.964,
    dpi: 250
  },
  a4_quer: {
    width: 3508,
    height: 2480,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.739,
    logoTextTop: 0.9257,
    dpi: 250
  },
  a5: {
    width: 1748,
    height: 2480,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.826,
    logoTextTop: 0.964,
    dpi: 300
  },
  a5_quer: {
    width: 2480,
    height: 1748,
    topBorderMultiplier: 1,
    border: 20,
    logoTop: 0.739,
    logoTextTop: 0.9257,
    dpi: 300
  }
};

// Mock global variables
global.canvas = null;
global.contentRect = null;
global.contentImage = null;
global.logo = null;
global.logoName = null;
global.logoText = '';
global.template = 'post';
global.generatorApplicationURL = 'http://localhost/';

// Mock DOM methods
global.document = {
  createElement: jest.fn(() => ({
    click: jest.fn(),
    href: '',
    download: ''
  })),
  addEventListener: jest.fn()
};

global.window = {
  confirm: jest.fn(() => true),
  alert: jest.fn()
};

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  onload: null,
  result: 'data:image/png;base64,test'
}));

// Mock Image constructor
global.Image = jest.fn().mockImplementation(() => ({
  onload: null,
  src: ''
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock showTailwindAlert function
global.showTailwindAlert = jest.fn();