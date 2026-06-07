/**
 * Unit Tests for the text-font OPTIONS map.
 *
 * Validates the descriptive font picker contract: option ids resolve to the
 * right family/weight/style, the default text font matches the standard
 * option, and labels never use the brand names.
 */

const fs = require('fs');
const path = require('path');

describe('AppConstants.FONTS.OPTIONS', () => {
  let FONTS;

  beforeEach(() => {
    // Load the real constants.js (defines window.AppConstants).
    const constantsPath = path.join(__dirname, '../../resources/js/constants.js');
    const constantsCode = fs.readFileSync(constantsPath, 'utf8');
    eval(constantsCode);
    FONTS = window.AppConstants.FONTS;
  });

  function lookup(id) {
    return FONTS.OPTIONS.find(o => o.id === id);
  }

  it('exposes exactly two options with ids standard and accent', () => {
    expect(FONTS.OPTIONS).toHaveLength(2);
    expect(FONTS.OPTIONS.map(o => o.id)).toEqual(['standard', 'accent']);
  });

  it('resolves the standard option to Barlow 900 upright', () => {
    const opt = lookup('standard');
    expect(opt.family).toBe('Barlow Semi Condensed');
    expect(opt.weight).toBe(900);
    expect(opt.style).toBe('normal');
  });

  it('resolves the accent option to Vollkorn 900 upright (no italic)', () => {
    const opt = lookup('accent');
    expect(opt.family).toBe('Vollkorn');
    expect(opt.weight).toBe(900);
    expect(opt.style).toBe('normal');
  });

  it('keeps DEFAULT_TEXT in sync with the standard option family', () => {
    expect(FONTS.DEFAULT_TEXT).toBe(lookup('standard').family);
  });

  it('falls back to the first (standard) option for an unknown id', () => {
    const opt = FONTS.OPTIONS.find(o => o.id === 'does-not-exist')
      || FONTS.OPTIONS[0];
    expect(opt.id).toBe('standard');
  });

  it('labels both options descriptively, never by brand name', () => {
    for (const opt of FONTS.OPTIONS) {
      expect(opt.label).not.toMatch(/Vollkorn|Barlow/i);
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  it('preloads each font family, including Vollkorn', () => {
    const families = FONTS.PRELOAD_FONTS.map(d => d.family);
    expect(families).toContain('Barlow Semi Condensed');
    expect(families).toContain('Vollkorn');
    // Every preload entry must carry a family (the preload trap fix).
    expect(FONTS.PRELOAD_FONTS.every(d => typeof d.family === 'string')).toBe(true);
  });
});
