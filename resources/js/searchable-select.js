// Searchable Select Component
class SearchableSelect {
    constructor(element, options = {}) {
        this.element = jQuery(element);
        this.options = {
            placeholder: 'Select an option...',
            searchPlaceholder: 'Search...',
            noResultsText: 'No results found',
            ...options
        };
        
        this.isOpen = false;
        this.selectedValue = '';
        this.selectedText = '';
        this.originalOptions = [];
        
        this.init();
    }
    
    init() {
        // Store original options
        this.storeOriginalOptions();
        
        // Create custom select structure
        this.createCustomSelect();
        
        // Hide original select
        this.element.hide();
        
        // Bind events
        this.bindEvents();
        
        // Set initial value
        const initialValue = this.element.val();
        if (initialValue) {
            this.selectOption(initialValue);
        }
    }
    
    storeOriginalOptions() {
        this.originalOptions = [];
        
        this.element.find('optgroup, option').each((index, el) => {
            const $el = jQuery(el);
            
            if (el.tagName === 'OPTGROUP') {
                this.originalOptions.push({
                    type: 'group',
                    label: $el.attr('label'),
                    options: []
                });
            } else {
                const option = {
                    type: 'option',
                    value: $el.attr('value') || '',
                    text: $el.text(),
                    selected: $el.prop('selected')
                };
                
                if (this.originalOptions.length > 0 && this.originalOptions[this.originalOptions.length - 1].type === 'group') {
                    this.originalOptions[this.originalOptions.length - 1].options.push(option);
                } else {
                    this.originalOptions.push(option);
                }
            }
        });
    }
    
    createCustomSelect() {
        const customSelect = `
            <div class="searchable-select">
                <button type="button" class="searchable-select-button" aria-expanded="false">
                    <span class="searchable-select-text">${this.options.placeholder}</span>
                    <span class="searchable-select-chevron">
                        <svg class="h-5 w-5 text-gray-400 transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </span>
                </button>
                <div class="searchable-select-dropdown hidden">
                    <input type="text" class="searchable-select-search" placeholder="${this.options.searchPlaceholder}">
                    <div class="searchable-select-options">
                        ${this.renderOptions()}
                    </div>
                </div>
            </div>
        `;
        
        this.customSelect = jQuery(customSelect);
        this.element.after(this.customSelect);
        
        // Cache elements
        this.button = this.customSelect.find('.searchable-select-button');
        this.dropdown = this.customSelect.find('.searchable-select-dropdown');
        this.searchInput = this.customSelect.find('.searchable-select-search');
        this.optionsContainer = this.customSelect.find('.searchable-select-options');
        this.textElement = this.customSelect.find('.searchable-select-text');
    }
    
    renderOptions(searchTerm = '') {
        let html = '';
        
        this.originalOptions.forEach(item => {
            if (item.type === 'group') {
                const groupOptions = item.options.filter(opt => {
                    // Search in both display text and original value (which may contain %)
                    const searchLower = searchTerm.toLowerCase();
                    const textMatch = opt.text.toLowerCase().includes(searchLower);
                    const valueMatch = opt.value.toLowerCase().includes(searchLower);
                    // Also search in value with % replaced by space for better matching
                    const valueWithSpace = opt.value.replace(/%/g, ' ').toLowerCase();
                    const valueSpaceMatch = valueWithSpace.includes(searchLower);
                    return textMatch || valueMatch || valueSpaceMatch;
                });
                
                if (groupOptions.length > 0) {
                    html += `<div class="searchable-select-option-group">${item.label}</div>`;
                    groupOptions.forEach(option => {
                        const selectedClass = option.value === this.selectedValue ? 'selected' : '';
                        html += `<div class="searchable-select-option ${selectedClass}" data-value="${option.value}">${option.text}</div>`;
                    });
                }
            } else if (item.type === 'option') {
                // Search in both display text and original value (which may contain %)
                const searchLower = searchTerm.toLowerCase();
                const textMatch = item.text.toLowerCase().includes(searchLower);
                const valueMatch = item.value.toLowerCase().includes(searchLower);
                // Also search in value with % replaced by space for better matching
                const valueWithSpace = item.value.replace(/%/g, ' ').toLowerCase();
                const valueSpaceMatch = valueWithSpace.includes(searchLower);
                
                if (textMatch || valueMatch || valueSpaceMatch) {
                    const selectedClass = item.value === this.selectedValue ? 'selected' : '';
                    html += `<div class="searchable-select-option ${selectedClass}" data-value="${item.value}">${item.text}</div>`;
                }
            }
        });
        
        if (html === '' && searchTerm !== '') {
            html = `<div class="px-3 py-2 text-gray-500 text-sm">${this.options.noResultsText}</div>`;
        }
        
        return html;
    }
    
    bindEvents() {
        // Toggle dropdown
        this.button.on('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        // Close on outside click
        jQuery(document).on('click', (e) => {
            if (!this.customSelect.is(e.target) && this.customSelect.has(e.target).length === 0) {
                this.close();
            }
        });
        
        // Search functionality
        this.searchInput.on('input', (e) => {
            const searchTerm = e.target.value;
            this.optionsContainer.html(this.renderOptions(searchTerm));
            this.bindOptionEvents();
        });
        
        // Keyboard navigation
        this.searchInput.on('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
        
        // Initial option events
        this.bindOptionEvents();
    }
    
    bindOptionEvents() {
        this.optionsContainer.find('.searchable-select-option').off('click').on('click', (e) => {
            const value = jQuery(e.target).data('value');
            const text = jQuery(e.target).text();
            
            this.selectOption(value, text);
            this.close();
        });
    }
    
    selectOption(value, text = null) {
        this.selectedValue = value;
        
        if (text === null) {
            // Find text from original options
            const findOption = (items) => {
                for (let item of items) {
                    if (item.type === 'group') {
                        const found = findOption(item.options);
                        if (found) return found;
                    } else if (item.value === value) {
                        return item;
                    }
                }
                return null;
            };
            
            const option = findOption(this.originalOptions);
            text = option ? option.text : value;
        }
        
        this.selectedText = text;
        this.textElement.text(text || this.options.placeholder);
        
        // Update original select
        this.element.val(value);
        
        // Trigger change event
        this.element.trigger('change');
        
        // Update option states
        this.updateOptionStates();
    }
    
    updateOptionStates() {
        this.optionsContainer.find('.searchable-select-option').removeClass('selected');
        this.optionsContainer.find(`[data-value="${this.selectedValue}"]`).addClass('selected');
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.dropdown.removeClass('hidden');
        this.button.attr('aria-expanded', 'true');
        this.customSelect.find('.searchable-select-chevron svg').addClass('rotate-180');
        this.isOpen = true;
        
        // Focus search input
        setTimeout(() => {
            this.searchInput.focus();
        }, 10);
        
        // Clear search
        this.searchInput.val('');
        this.optionsContainer.html(this.renderOptions());
        this.bindOptionEvents();
    }
    
    close() {
        this.dropdown.addClass('hidden');
        this.button.attr('aria-expanded', 'false');
        this.customSelect.find('.searchable-select-chevron svg').removeClass('rotate-180');
        this.isOpen = false;
    }
    
    // Method to refresh options (useful when options are added dynamically)
    refresh() {
        this.storeOriginalOptions();
        this.optionsContainer.html(this.renderOptions());
        this.bindOptionEvents();
    }
    
    // Method to add options programmatically
    addOption(value, text, groupLabel = null) {
        const option = jQuery(`<option value="${value}">${text}</option>`);
        
        if (groupLabel) {
            let optgroup = this.element.find(`optgroup[label="${groupLabel}"]`);
            if (optgroup.length === 0) {
                optgroup = jQuery(`<optgroup label="${groupLabel}"></optgroup>`);
                this.element.append(optgroup);
            }
            optgroup.append(option);
        } else {
            this.element.append(option);
        }
        
        this.refresh();
    }
    
    // Method to clear all options
    clearOptions() {
        this.element.empty().append('<option value="">Select an option...</option>');
        this.selectedValue = '';
        this.selectedText = '';
        this.textElement.text(this.options.placeholder);
        this.refresh();
    }
}

// jQuery plugin wrapper
jQuery.fn.searchableSelect = function(options) {
    return this.each(function() {
        if (!jQuery(this).data('searchable-select')) {
            jQuery(this).data('searchable-select', new SearchableSelect(this, options));
        }
    });
};

// Auto-initialize searchable selects
jQuery(function() {
    // Initialize logo selection as searchable
    jQuery('#logo-selection').searchableSelect({
        placeholder: 'Logo Auswählen',
        searchPlaceholder: 'Logo suchen...',
        noResultsText: 'Keine Logos gefunden'
    });
});