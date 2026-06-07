/**
 * Unit Tests for Background Image Cover-Scaling
 *
 * These tests verify CanvasUtils.positionBackgroundImage() cover-scales the
 * uploaded background so it always fully covers the content rectangle (no green
 * border / gap) for any image vs. canvas aspect ratio, and that
 * enablePictureMove() clamps panning so the rect can never be uncovered.
 *
 * They exercise the real CanvasUtils functions (loaded via eval, the same
 * pattern as canvas-utils-snap.test.js), driving them with a minimal Fabric-like
 * mock — no application code is stubbed.
 */

const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../../resources/js/constants.js');
const canvasUtilsPath = path.join(__dirname, '../../resources/js/canvas-utils.js');

eval(fs.readFileSync(constantsPath, 'utf8'));
eval(fs.readFileSync(canvasUtilsPath, 'utf8'));

// Minimal Fabric.Image stand-in: tracks scale and exposes the same geometry
// helpers positionBackgroundImage relies on.
function makeImage(width, height) {
  return {
    width,
    height,
    scaleX: 1,
    scaleY: 1,
    left: 0,
    top: 0,
    selectable: false,
    lockMovementX: false,
    lockMovementY: false,
    clipPath: null,
    scale(s) {
      this.scaleX = s;
      this.scaleY = s;
      return this;
    },
    getScaledWidth() {
      return this.width * this.scaleX;
    },
    getScaledHeight() {
      return this.height * this.scaleY;
    },
    set(props) {
      Object.assign(this, props);
      return this;
    },
    setCoords() {
      return this;
    },
    setControlsVisibility() {
      return this;
    },
  };
}

function makeContentRect(left, top, width, height) {
  return { left, top, width, height };
}

describe('CanvasUtils.positionBackgroundImage() - cover scaling', () => {
  let movingHandler;

  beforeEach(() => {
    // A minimal fabric global: positionBackgroundImage builds a clip Rect.
    global.fabric = {
      Rect: function (opts) {
        Object.assign(this, opts);
      },
    };

    global.canvas = {
      add: jest.fn(),
      remove: jest.fn(),
      sendToBack: jest.fn(),
      on: jest.fn((evt, handler) => {
        if (evt === 'object:moving') movingHandler = handler;
      }),
      width: 1080,
      height: 1350,
    };
  });

  afterEach(() => {
    delete global.fabric;
    delete global.canvas;
    delete global.contentImage;
    delete global.contentRect;
    movingHandler = undefined;
  });

  // A portrait content rect with a landscape (wider) background — this is the
  // exact case the old scaleToHeight path under-covered, leaving side gaps.
  it('covers a portrait rect with a landscape image (no horizontal gap)', () => {
    global.contentRect = makeContentRect(0, 0, 1080, 1350);
    global.contentImage = makeImage(1600, 900); // 16:9 landscape

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    // Cover-scale = max(1080/1600, 1350/900) = max(0.675, 1.5) = 1.5
    expect(img.scaleX).toBeCloseTo(1.5, 5);
    expect(img.getScaledWidth()).toBeGreaterThanOrEqual(1080);
    expect(img.getScaledHeight()).toBeGreaterThanOrEqual(1350);
    // Image must fully span the rect on both axes.
    expect(img.left).toBeLessThanOrEqual(0);
    expect(img.top).toBeLessThanOrEqual(0);
    expect(img.left + img.getScaledWidth()).toBeGreaterThanOrEqual(1080);
    expect(img.top + img.getScaledHeight()).toBeGreaterThanOrEqual(1350);
  });

  it('covers a portrait rect with a portrait image (no vertical gap)', () => {
    global.contentRect = makeContentRect(0, 0, 1080, 1350);
    global.contentImage = makeImage(900, 1600); // taller than the rect

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    // Cover-scale = max(1080/900, 1350/1600) = max(1.2, 0.84375) = 1.2
    expect(img.scaleX).toBeCloseTo(1.2, 5);
    expect(img.getScaledWidth()).toBeGreaterThanOrEqual(1080);
    expect(img.getScaledHeight()).toBeGreaterThanOrEqual(1350);
    expect(img.left + img.getScaledWidth()).toBeGreaterThanOrEqual(1080);
    expect(img.top + img.getScaledHeight()).toBeGreaterThanOrEqual(1350);
  });

  it('covers a landscape rect with a portrait image (no horizontal gap)', () => {
    global.contentRect = makeContentRect(0, 0, 1920, 1005); // event header
    global.contentImage = makeImage(900, 1600); // portrait photo

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    // Cover-scale = max(1920/900, 1005/1600) = max(2.133, 0.628) = 2.133
    expect(img.scaleX).toBeCloseTo(1920 / 900, 5);
    expect(img.getScaledWidth()).toBeGreaterThanOrEqual(1920);
    expect(img.getScaledHeight()).toBeGreaterThanOrEqual(1005);
  });

  it('centers the image over the content rect, honouring a border inset', () => {
    // Bordered template: content rect inset from the canvas edges.
    global.contentRect = makeContentRect(20, 60, 1040, 1270);
    global.contentImage = makeImage(2000, 1000); // very wide

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    const sw = img.getScaledWidth();
    const sh = img.getScaledHeight();
    // Even split of the overflow around the rect center.
    expect(img.left).toBeCloseTo(20 + (1040 - sw) / 2, 3);
    expect(img.top).toBeCloseTo(60 + (1270 - sh) / 2, 3);
    // Rect fully covered.
    expect(img.left).toBeLessThanOrEqual(20);
    expect(img.left + sw).toBeGreaterThanOrEqual(20 + 1040);
    expect(img.top).toBeLessThanOrEqual(60);
    expect(img.top + sh).toBeGreaterThanOrEqual(60 + 1270);
  });

  it('locks the non-overflowing axis and frees the overflowing one', () => {
    global.contentRect = makeContentRect(0, 0, 1080, 1350);
    global.contentImage = makeImage(1600, 900); // overflows horizontally

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    // Width overflows -> horizontal pan allowed; height fits -> vertical locked.
    expect(img.lockMovementX).toBe(false);
    expect(img.lockMovementY).toBe(true);
  });

  it('locks both axes when the image aspect matches the rect exactly', () => {
    global.contentRect = makeContentRect(0, 0, 1080, 1350);
    global.contentImage = makeImage(1080, 1350); // exact match

    CanvasUtils.positionBackgroundImage();

    const img = global.contentImage;
    expect(img.lockMovementX).toBe(true);
    expect(img.lockMovementY).toBe(true);
  });
});

describe('CanvasUtils.enablePictureMove() - pan clamping keeps rect covered', () => {
  let movingHandler;
  let img;

  beforeEach(() => {
    const canvasInstance = {
      on: jest.fn((evt, handler) => {
        if (evt === 'object:moving') movingHandler = handler;
      }),
    };
    global.contentRect = makeContentRect(0, 0, 1080, 1350);
    // Cover-scaled landscape image: overflows horizontally only.
    img = makeImage(1600, 900);
    img.scale(1.5); // scaledWidth 2400, scaledHeight 1350
    global.contentImage = img;

    CanvasUtils.enablePictureMove(canvasInstance);
  });

  afterEach(() => {
    delete global.contentRect;
    delete global.contentImage;
    movingHandler = undefined;
  });

  it('clamps a rightward over-pan so the left edge stays flush', () => {
    img.left = 200; // dragged right -> would expose left gap (max allowed is 0)
    img.top = 0;
    movingHandler({ target: img });
    expect(img.left).toBe(0); // contentRect.left
  });

  it('clamps a leftward over-pan so the right edge stays flush', () => {
    // scaledWidth 2400, rect width 1080 -> min left = 1080 - 2400 = -1320
    img.left = -2000;
    img.top = 0;
    movingHandler({ target: img });
    expect(img.left).toBe(-1320);
  });

  it('keeps the locked axis pinned (no vertical gap)', () => {
    img.left = -100;
    img.top = 50; // height fits exactly; any non-zero top would expose a gap
    movingHandler({ target: img });
    expect(img.top).toBe(0);
  });

  it('leaves an in-range pan untouched', () => {
    img.left = -500; // within [-1320, 0]
    img.top = 0;
    movingHandler({ target: img });
    expect(img.left).toBe(-500);
    expect(img.top).toBe(0);
  });
});
