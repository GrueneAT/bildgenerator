require('@testing-library/jest-dom');

// Mock global objects that are available in the browser
global.fabric = {
  Canvas: jest.fn(),
  Image: jest.fn(),
  Text: jest.fn(),
  Rect: jest.fn(),
  Circle: jest.fn()
};

global.jQuery = jest.fn(() => ({
  hasClass: jest.fn(),
  addClass: jest.fn(),
  removeClass: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  val: jest.fn(),
  text: jest.fn(),
  html: jest.fn(),
  css: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  attr: jest.fn(),
  prop: jest.fn(),
  find: jest.fn(),
  parent: jest.fn(),
  closest: jest.fn()
}));

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