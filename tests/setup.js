require('@testing-library/jest-dom');

// Mock global objects that are available in the browser
global.fabric = {
  Canvas: jest.fn(() => ({
    on: jest.fn(),
    renderAll: jest.fn(),
    getObjects: jest.fn(() => []),
    add: jest.fn(),
    remove: jest.fn(),
    width: 1080,
    height: 1920
  })),
  Image: jest.fn(),
  Text: jest.fn(),
  Rect: jest.fn(() => ({
    set: jest.fn(),
    setCoords: jest.fn()
  })),
  Circle: jest.fn(),
  util: {
    loadImage: jest.fn()
  }
};

// Create a comprehensive jQuery mock
const jQueryMock = jest.fn((selector) => {
  const element = {
    hasClass: jest.fn(),
    addClass: jest.fn(),
    removeClass: jest.fn(),
    on: jest.fn(() => element),
    off: jest.fn(() => element),
    val: jest.fn(),
    text: jest.fn(),
    html: jest.fn(),
    css: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    attr: jest.fn(),
    prop: jest.fn(),
    find: jest.fn(() => ({
      attr: jest.fn().mockReturnValue('png')
    })),
    parent: jest.fn(),
    closest: jest.fn(),
    width: jest.fn().mockReturnValue(1080),
    height: jest.fn().mockReturnValue(600),
    ready: jest.fn(),
    data: jest.fn()
  };
  return element;
});

global.jQuery = jQueryMock;
global.$ = global.jQuery;

global.FontFaceObserver = jest.fn(() => ({
  load: jest.fn().mockResolvedValue()
}));

// Mock canvas element
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn()
  }))
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock canvas object
global.canvas = {
  width: 1080,
  height: 1920,
  renderAll: jest.fn(),
  getActiveObject: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  getObjects: jest.fn(() => [])
};

// Mock window object
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock jQuery with comprehensive methods
global.jQuery.mockImplementation((selector) => {
  const element = {
    hasClass: jest.fn(),
    addClass: jest.fn(),
    removeClass: jest.fn(),
    on: jest.fn(() => element),
    off: jest.fn(() => element),
    val: jest.fn(),
    text: jest.fn(),
    html: jest.fn(),
    css: jest.fn(),
    hide: jest.fn(),
    show: jest.fn(),
    attr: jest.fn(),
    prop: jest.fn(),
    find: jest.fn(() => ({
      attr: jest.fn().mockReturnValue('post')
    })),
    parent: jest.fn(),
    closest: jest.fn(),
    ready: jest.fn(),
    data: jest.fn()
  };
  return element;
});

// Add jQuery.fn for plugins
global.jQuery.fn = {};

// Mock document for ready function
global.document = {
  ...global.document,
  ready: jest.fn()
};

// Set default template to prevent main.js errors
global.template = 'post';