/**
 * Integration test for SearchableSelect component
 * This test verifies that the actual search functionality in searchable-select.js
 * works correctly with logo names containing % characters
 */

// Add TextEncoder/TextDecoder polyfill for Node
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    runScripts: 'dangerously'
});

global.window = dom.window;
global.document = window.document;
global.jQuery = global.$ = require('jquery');

// Load the actual searchable-select.js file
const searchableSelectCode = fs.readFileSync(
    path.join(__dirname, '../../resources/js/searchable-select.js'),
    'utf8'
);

// Execute the searchable-select.js code in our test environment
eval(searchableSelectCode);

// Extract SearchableSelect from the executed code and make it available globally
if (typeof SearchableSelect === 'undefined') {
    // The class should be defined in the global scope after eval
    const classMatch = searchableSelectCode.match(/class SearchableSelect[\s\S]*?^}/m);
    if (classMatch) {
        eval(`global.SearchableSelect = ${classMatch[0]}`);
    }
}

describe('SearchableSelect Integration Tests', () => {
    let $select;
    let searchableSelect;
    
    beforeEach(() => {
        // Reset the DOM
        document.body.innerHTML = '';
        
        // Create a select element with logo options similar to what main.js generates
        const selectHTML = `
            <select id="logo-selection">
                <option value="">Select Logo</option>
                <optgroup label="Bezirke">
                    <option value="BEZIRK % LIEZEN">BEZIRK LIEZEN</option>
                    <option value="BEZIRK % DEUTSCHLANDSBERG">BEZIRK DEUTSCHLANDSBERG</option>
                    <option value="BEZIRK % GRAZ-UMGEBUNG">BEZIRK GRAZ-UMGEBUNG</option>
                    <option value="BEZIRK NEUSIEDL">BEZIRK NEUSIEDL</option>
                </optgroup>
                <optgroup label="Gemeinden">
                    <option value="HORITSCHON%UNTERPETERSDORF">HORITSCHON UNTERPETERSDORF</option>
                    <option value="FRANKENAU%UNTERPULLENDORF">FRANKENAU UNTERPULLENDORF</option>
                    <option value="HOFSTÄTTEN%AN DER RAAB">HOFSTÄTTEN AN DER RAAB</option>
                    <option value="BRUCK AN DER GROSSGLOCKNERSTRASSE">BRUCK AN DER GROSSGLOCKNERSTRASSE</option>
                    <option value="EISENSTADT">EISENSTADT</option>
                    <option value="ALBERSCHWENDE AKTIV">ALBERSCHWENDE AKTIV</option>
                </optgroup>
                <optgroup label="Andere">
                    <option value="GRÜNE LISTE%HAUSMANNSTÄTTEN">GRÜNE LISTE HAUSMANNSTÄTTEN</option>
                    <option value="GENERATION PLUS%OBERÖSTERREICH">GENERATION PLUS OBERÖSTERREICH</option>
                </optgroup>
            </select>
        `;
        
        document.body.innerHTML = selectHTML;
        $select = jQuery('#logo-selection');
        
        // Initialize SearchableSelect
        searchableSelect = new SearchableSelect($select[0]);
    });
    
    describe('renderOptions method', () => {
        test('should find options when searching for text after %', () => {
            // Test searching for "LIEZEN"
            const html = searchableSelect.renderOptions('LIEZEN');
            expect(html).toContain('BEZIRK LIEZEN');
            expect(html).toContain('data-value="BEZIRK % LIEZEN"');
        });
        
        test('should find options when searching for text after % without spaces', () => {
            // Test searching for "UNTERPETERSDORF"
            const html = searchableSelect.renderOptions('UNTERPETERSDORF');
            expect(html).toContain('HORITSCHON UNTERPETERSDORF');
            expect(html).toContain('data-value="HORITSCHON%UNTERPETERSDORF"');
        });
        
        test('should find "HAUSMANNSTÄTTEN" when searching for it', () => {
            const html = searchableSelect.renderOptions('HAUSMANNSTÄTTEN');
            expect(html).toContain('GRÜNE LISTE HAUSMANNSTÄTTEN');
            expect(html).toContain('data-value="GRÜNE LISTE%HAUSMANNSTÄTTEN"');
        });
        
        test('should find "OBERÖSTERREICH" when searching for it', () => {
            const html = searchableSelect.renderOptions('OBERÖSTERREICH');
            expect(html).toContain('GENERATION PLUS OBERÖSTERREICH');
            expect(html).toContain('data-value="GENERATION PLUS%OBERÖSTERREICH"');
        });
        
        test('should find "ALBERSCHWENDE" when searching for it', () => {
            const html = searchableSelect.renderOptions('ALBERSCHWENDE');
            expect(html).toContain('ALBERSCHWENDE AKTIV');
            expect(html).toContain('data-value="ALBERSCHWENDE AKTIV"');
        });
        
        test('should find options with partial search', () => {
            const html = searchableSelect.renderOptions('UNTER');
            expect(html).toContain('HORITSCHON UNTERPETERSDORF');
            expect(html).toContain('FRANKENAU UNTERPULLENDORF');
        });
        
        test('should be case-insensitive', () => {
            const html = searchableSelect.renderOptions('liezen');
            expect(html).toContain('BEZIRK LIEZEN');
            expect(html).toContain('data-value="BEZIRK % LIEZEN"');
        });
        
        test('should find multiple matches for "BEZIRK"', () => {
            const html = searchableSelect.renderOptions('BEZIRK');
            expect(html).toContain('BEZIRK LIEZEN');
            expect(html).toContain('BEZIRK DEUTSCHLANDSBERG');
            expect(html).toContain('BEZIRK GRAZ-UMGEBUNG');
            expect(html).toContain('BEZIRK NEUSIEDL');
        });
        
        test('should show no results message when no matches found', () => {
            const html = searchableSelect.renderOptions('NOTFOUND');
            expect(html).toContain('No results found');
        });
        
        test('should show all options when search is empty', () => {
            const html = searchableSelect.renderOptions('');
            // Should contain all groups
            expect(html).toContain('Bezirke');
            expect(html).toContain('Gemeinden');
            expect(html).toContain('Andere');
            // Should contain all options
            expect(html).toContain('BEZIRK LIEZEN');
            expect(html).toContain('EISENSTADT');
            expect(html).toContain('ALBERSCHWENDE AKTIV');
        });
    });
    
    describe('Search input interaction', () => {
        test('should update options when typing in search input', () => {
            // Open the dropdown
            searchableSelect.open();
            
            // Type in search input
            const searchInput = searchableSelect.searchInput;
            searchInput.val('LIEZEN');
            searchInput.trigger('input');
            
            // Check that options were filtered
            const visibleOptions = searchableSelect.optionsContainer.html();
            expect(visibleOptions).toContain('BEZIRK LIEZEN');
            expect(visibleOptions).not.toContain('EISENSTADT');
        });
        
        test('should handle special characters in search', () => {
            searchableSelect.open();
            
            const searchInput = searchableSelect.searchInput;
            searchInput.val('HOFSTÄTTEN');
            searchInput.trigger('input');
            
            const visibleOptions = searchableSelect.optionsContainer.html();
            expect(visibleOptions).toContain('HOFSTÄTTEN AN DER RAAB');
        });
    });
    
    describe('Option selection', () => {
        test('should select option when clicked', () => {
            searchableSelect.open();
            
            // Search for LIEZEN
            searchableSelect.searchInput.val('LIEZEN');
            searchableSelect.searchInput.trigger('input');
            
            // Click the option
            const option = searchableSelect.optionsContainer.find('[data-value="BEZIRK % LIEZEN"]');
            expect(option.length).toBe(1);
            
            option.trigger('click');
            
            // Check that the value was selected
            expect($select.val()).toBe('BEZIRK % LIEZEN');
            expect(searchableSelect.textElement.text()).toBe('BEZIRK LIEZEN');
        });
    });
});

// SearchableSelect is defined by eval() above, no need to export