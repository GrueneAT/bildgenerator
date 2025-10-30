/**
 * Integration test for logo text processing in main.js
 * This test verifies that the actual addLogo() function correctly processes
 * logo text with % characters and long names
 */

// Add TextEncoder/TextDecoder polyfill for Node
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Setup DOM environment with Canvas support
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    runScripts: 'dangerously',
    resources: 'usable'
});

global.window = dom.window;
global.document = window.document;
global.jQuery = global.$ = require('jquery');
global.Image = window.Image;

// Mock fabric.js since it requires canvas
global.fabric = {
    Object: {
        prototype: {
            set: jest.fn()
        }
    },
    Image: {
        fromURL: jest.fn((url, callback) => {
            // Mock image object
            const mockImage = {
                getScaledWidth: () => 200,
                getScaledHeight: () => 100,
                scaleToWidth: jest.fn(),
                set: jest.fn()
            };
            if (callback) {
                callback(mockImage);
            }
        })
    },
    Text: jest.fn(function(text, options) {
        this.text = text;
        this.options = options;
        this.width = 100;
        this.height = 20;
        this.top = options.top || 0;
        this.scaleToWidth = jest.fn();
        this.getScaledHeight = () => 20;
        this.set = jest.fn();
    }),
    Rect: jest.fn(function(options) {
        this.options = options;
        this.set = jest.fn();
    })
};

// Mock canvas
global.canvas = {
    width: 1080,
    height: 1080,
    remove: jest.fn(),
    add: jest.fn(),
    bringToFront: jest.fn(),
    renderAll: jest.fn(),
    getActiveObject: jest.fn(),
    on: jest.fn(),
    centerObjectH: jest.fn()
};

// Mock global variables that main.js expects
global.logo = null;
global.logoName = null;
global.logoText = '';
global.contentRect = {
    width: 800,
    height: 800
};
global.contentImage = null;
global.template = 'post';
global.generatorApplicationURL = '/';

// Mock AppConstants
global.AppConstants = {
    LOGO: {
        SCALE_RATIO: 10,
        MAX_TEXT_LENGTH: 16,
        FILES: {
            LONG: 'logo_long.png',
            SHORT: 'logo_short.png'
        },
        TEXT_SCALE_LONG: 0.9,
        TEXT_SCALE_SHORT: 1.0,
        WIDTH_SCALE: 0.95
    },
    FONTS: {
        DEFAULT_LOGO: 'Gotham'
    },
    COLORS: {
        WHITE: '#FFFFFF'
    }
};

// Mock currentTemplate function
global.currentTemplate = () => ({
    logoTextTop: 0.9
});

// Mock CanvasUtils
global.CanvasUtils = {
    bringLogoToFront: jest.fn(),
    disableScalingControls: jest.fn()
};

// Load LogoState module (required by main.js addLogo function)
const logoStatePath = path.join(__dirname, '../../resources/js/logo-state.js');
const logoStateCode = fs.readFileSync(logoStatePath, 'utf8');
eval(logoStateCode);
global.LogoState.initialize();

// Read the actual main.js file
const mainJsPath = path.join(__dirname, '../../resources/js/main.js');
const mainJsCode = fs.readFileSync(mainJsPath, 'utf8');

// Extract just the addLogo function
const addLogoMatch = mainJsCode.match(/function addLogo\(\) \{[\s\S]*?\n\}/);
if (!addLogoMatch) {
    throw new Error('Could not find addLogo function in main.js');
}

// Execute the addLogo function in our test environment
let addLogo;
eval('addLogo = ' + addLogoMatch[0]);

describe('Logo Processing Integration Tests', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <select id="logo-selection">
                <option value="">Select Logo</option>
            </select>
        `;
        
        // Reset mocks
        jest.clearAllMocks();
        global.logo = null;
        global.logoName = null;
        global.logoText = '';
    });
    
    describe('addLogo function - % character handling', () => {
        test('should replace % with newline and trim whitespace for "BEZIRK % LIEZEN"', () => {
            // Set the selected option
            jQuery('#logo-selection').html(`
                <option value="BEZIRK % LIEZEN" selected>BEZIRK LIEZEN</option>
            `);
            
            // Call addLogo
            addLogo();
            
            // Check that logoText was processed correctly
            expect(global.logoText).toBe('BEZIRK\nLIEZEN');
            
            // Check that fabric.Text was called with the correct text
            expect(fabric.Text).toHaveBeenCalled();
            const textCall = fabric.Text.mock.calls[0];
            expect(textCall[0]).toBe('BEZIRK\nLIEZEN');
        });
        
        test('should handle % without spaces for "HORITSCHON%UNTERPETERSDORF"', () => {
            jQuery('#logo-selection').html(`
                <option value="HORITSCHON%UNTERPETERSDORF" selected>HORITSCHON UNTERPETERSDORF</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('HORITSCHON\nUNTERPETERSDORF');
            expect(fabric.Text.mock.calls[0][0]).toBe('HORITSCHON\nUNTERPETERSDORF');
        });
        
        test('should handle mixed spacing for "GRÜNE LISTE%HAUSMANNSTÄTTEN"', () => {
            jQuery('#logo-selection').html(`
                <option value="GRÜNE LISTE%HAUSMANNSTÄTTEN" selected>GRÜNE LISTE HAUSMANNSTÄTTEN</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('GRÜNE LISTE\nHAUSMANNSTÄTTEN');
        });
        
        test('should handle multiple spaces around % for "SANKT MICHAEL %  IN OBERSTEIERMARK"', () => {
            jQuery('#logo-selection').html(`
                <option value="SANKT MICHAEL %  IN OBERSTEIERMARK" selected>SANKT MICHAEL IN OBERSTEIERMARK</option>
            `);
            
            addLogo();
            
            // Should trim the extra spaces
            expect(global.logoText).toBe('SANKT MICHAEL\nIN OBERSTEIERMARK');
        });
    });
    
    describe('addLogo function - long name handling', () => {
        test('should break long names at last space for "BRUCK AN DER GROSSGLOCKNERSTRASSE"', () => {
            jQuery('#logo-selection').html(`
                <option value="BRUCK AN DER GROSSGLOCKNERSTRASSE" selected>BRUCK AN DER GROSSGLOCKNERSTRASSE</option>
            `);
            
            addLogo();
            
            // Should break at last space since it's > 16 characters
            expect(global.logoText).toBe('BRUCK AN DER\nGROSSGLOCKNERSTRASSE');
        });
        
        test('should not break short names like "EISENSTADT"', () => {
            jQuery('#logo-selection').html(`
                <option value="EISENSTADT" selected>EISENSTADT</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('EISENSTADT');
            expect(global.logoText).not.toContain('\n');
        });
        
        test('should not break names exactly 16 characters', () => {
            const name16 = 'ABCDEFGHIJKLMNOP'; // exactly 16 characters
            jQuery('#logo-selection').html(`
                <option value="${name16}" selected>${name16}</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe(name16);
            expect(global.logoText).not.toContain('\n');
        });
    });
    
    describe('addLogo function - priority handling', () => {
        test('% should take priority over length-based breaking', () => {
            // Very long name with % 
            const longNameWithPercent = 'SEHR LANGER NAME % MIT PROZENTZEICHEN UND VIELEN WÖRTERN';
            jQuery('#logo-selection').html(`
                <option value="${longNameWithPercent}" selected>SEHR LANGER NAME MIT PROZENTZEICHEN UND VIELEN WÖRTERN</option>
            `);
            
            addLogo();
            
            // Should use % for breaking, not length
            expect(global.logoText).toBe('SEHR LANGER NAME\nMIT PROZENTZEICHEN UND VIELEN WÖRTERN');
        });
    });
    
    describe('addLogo function - logo file selection', () => {
        test('should use long logo file for names with %', () => {
            jQuery('#logo-selection').html(`
                <option value="BEZIRK % LIEZEN" selected>BEZIRK LIEZEN</option>
            `);
            
            addLogo();
            
            // Check that fabric.Image.fromURL was called with long logo file
            expect(fabric.Image.fromURL).toHaveBeenCalled();
            const urlCall = fabric.Image.fromURL.mock.calls[0][0];
            expect(urlCall).toContain('logo_long.png');
        });
        
        test('should use long logo file for long names', () => {
            jQuery('#logo-selection').html(`
                <option value="BRUCK AN DER GROSSGLOCKNERSTRASSE" selected>BRUCK AN DER GROSSGLOCKNERSTRASSE</option>
            `);
            
            addLogo();
            
            const urlCall = fabric.Image.fromURL.mock.calls[0][0];
            expect(urlCall).toContain('logo_long.png');
        });
        
        test('should use short logo file for short names', () => {
            jQuery('#logo-selection').html(`
                <option value="EISENSTADT" selected>EISENSTADT</option>
            `);
            
            addLogo();
            
            const urlCall = fabric.Image.fromURL.mock.calls[0][0];
            expect(urlCall).toContain('logo_short.png');
        });
    });
    
    describe('addLogo function - edge cases', () => {
        test('should handle empty selection', () => {
            jQuery('#logo-selection').html(`
                <option value="" selected>Select Logo</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('');
        });
        
        test('should handle lowercase input by converting to uppercase', () => {
            jQuery('#logo-selection').html(`
                <option value="bezirk % liezen" selected>bezirk liezen</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('BEZIRK\nLIEZEN');
        });
        
        test('should preserve special characters', () => {
            jQuery('#logo-selection').html(`
                <option value="GRÜNE/DIE%ALTERNATIVE" selected>GRÜNE/DIE ALTERNATIVE</option>
            `);
            
            addLogo();
            
            expect(global.logoText).toBe('GRÜNE/DIE\nALTERNATIVE');
        });
    });
});

// addLogo is defined by eval() above, no need to export