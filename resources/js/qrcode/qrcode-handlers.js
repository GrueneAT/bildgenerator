// QR Code Event Handlers
let qrHandlersInitialized = false;

// Initialize all QR Code event handlers
function initializeQRHandlers() {
    if (qrHandlersInitialized) {
        console.log('QR Handlers already initialized');
        return;
    }
    
    setupTabNavigationHandlers();
    setupQRDownloadHandler();
    
    qrHandlersInitialized = true;
    console.log('QR Code Handlers initialized');
}

// Setup Tab Navigation Handlers
function setupTabNavigationHandlers() {
    // Desktop tab handlers
    jQuery('#tab-generator').on('click', function() {
        switchToTab('generator');
    });
    
    jQuery('#tab-qrcode').on('click', function() {
        switchToTab('qrcode');
    });
    
    // Mobile tab handlers
    jQuery('#tab-generator-mobile').on('click', function() {
        switchToTab('generator');
    });
    
    jQuery('#tab-qrcode-mobile').on('click', function() {
        switchToTab('qrcode');
    });
}

// Switch between tabs
function switchToTab(tab) {
    // Update tab button states
    updateTabButtonStates(tab);
    
    // Show/hide containers
    if (tab === 'generator') {
        jQuery('#generator').removeClass('d-none').show();
        jQuery('#qrcode-container').addClass('d-none').hide();
        
        // Update page title context
        document.title = 'Grüner Bildgenerator';
        
    } else if (tab === 'qrcode') {
        jQuery('#generator').addClass('d-none').hide();
        jQuery('#qrcode-container').removeClass('d-none').show();
        
        // Initialize QR wizard if needed
        if (typeof initializeQRWizard === 'function') {
            initializeQRWizard();
        }
        
        // Initialize QR generator if needed
        if (typeof initializeQRGenerator === 'function') {
            initializeQRGenerator();
        }
        
        // Update page title context
        document.title = 'QR-Code Generator - Grüne';
    }
    
    // Store current tab in localStorage
    localStorage.setItem('gruener-generator-current-tab', tab);
    
    console.log('Switched to tab:', tab);
}

// Update tab button visual states
function updateTabButtonStates(activeTab) {
    // Desktop tabs
    const desktopTabs = ['#tab-generator', '#tab-qrcode'];
    desktopTabs.forEach(tabSelector => {
        const tab = jQuery(tabSelector);
        const isActive = (activeTab === 'generator' && tabSelector.includes('generator')) ||
                        (activeTab === 'qrcode' && tabSelector.includes('qrcode'));
        
        if (isActive) {
            tab.removeClass('bg-gray-200 text-gray-700')
               .addClass('bg-gruene-primary text-white active');
        } else {
            tab.removeClass('bg-gruene-primary text-white active')
               .addClass('bg-gray-200 text-gray-700');
        }
    });
    
    // Mobile tabs
    const mobileTabs = ['#tab-generator-mobile', '#tab-qrcode-mobile'];
    mobileTabs.forEach(tabSelector => {
        const tab = jQuery(tabSelector);
        const isActive = (activeTab === 'generator' && tabSelector.includes('generator')) ||
                        (activeTab === 'qrcode' && tabSelector.includes('qrcode'));
        
        if (isActive) {
            tab.removeClass('bg-gray-200 text-gray-700')
               .addClass('bg-gruene-primary text-white active');
        } else {
            tab.removeClass('bg-gruene-primary text-white active')
               .addClass('bg-gray-200 text-gray-700');
        }
    });
}

// Setup QR Download Handler
function setupQRDownloadHandler() {
    jQuery('#qr-download').on('click', function() {
        if (typeof downloadQRCode === 'function') {
            downloadQRCode();
        } else {
            console.error('downloadQRCode function not found');
            showQRAlert('Download-Funktion nicht verfügbar', 'error');
        }
    });
}

// Handle URL hash changes for direct linking
function handleQRHashNavigation() {
    const hash = window.location.hash;
    
    if (hash === '#qrcode') {
        switchToTab('qrcode');
    } else if (hash === '#generator' || hash === '') {
        switchToTab('generator');
    }
}

// Setup hash navigation
function setupQRHashNavigation() {
    // Handle initial hash
    handleQRHashNavigation();
    
    // Handle hash changes
    jQuery(window).on('hashchange', handleQRHashNavigation);
    
    // Update hash when tabs are clicked
    jQuery('#tab-generator, #tab-generator-mobile').on('click', function() {
        window.location.hash = '#generator';
    });
    
    jQuery('#tab-qrcode, #tab-qrcode-mobile').on('click', function() {
        window.location.hash = '#qrcode';
    });
}

// Restore last used tab
function restoreLastTab() {
    const savedTab = localStorage.getItem('gruener-generator-current-tab');
    
    // Check URL hash first
    const hash = window.location.hash;
    if (hash === '#qrcode') {
        switchToTab('qrcode');
        return;
    }
    
    // Then check saved preference
    if (savedTab && (savedTab === 'generator' || savedTab === 'qrcode')) {
        switchToTab(savedTab);
    } else {
        // Default to generator
        switchToTab('generator');
    }
}

// Handle browser back/forward buttons
function setupQRBrowserNavigation() {
    window.addEventListener('popstate', function(event) {
        handleQRHashNavigation();
    });
}

// Keyboard shortcuts for tab navigation
function setupQRKeyboardShortcuts() {
    jQuery(document).on('keydown', function(e) {
        // Only handle if no input is focused
        if (jQuery('input:focus, textarea:focus, select:focus').length > 0) {
            return;
        }
        
        // Alt+1 for Generator, Alt+2 for QR Code
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            switchToTab('generator');
            window.location.hash = '#generator';
        } else if (e.altKey && e.key === '2') {
            e.preventDefault();
            switchToTab('qrcode');
            window.location.hash = '#qrcode';
        }
    });
}

// Enhanced error handling for QR operations
function setupQRErrorHandling() {
    // Global error handler for QR-related errors
    window.addEventListener('error', function(event) {
        if (event.filename && event.filename.includes('qrcode')) {
            console.error('QR Code related error:', event.error);
            
            // Show user-friendly error message
            if (typeof showQRAlert === 'function') {
                showQRAlert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', 'error');
            }
        }
    });
    
    // Promise rejection handler for QR operations
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && typeof event.reason === 'object' && event.reason.message) {
            if (event.reason.message.includes('QR') || event.reason.message.includes('qr')) {
                console.error('QR Code promise rejection:', event.reason);
                
                if (typeof showQRAlert === 'function') {
                    showQRAlert('Fehler bei der QR-Code Verarbeitung: ' + event.reason.message, 'error');
                }
                
                event.preventDefault(); // Prevent browser default handling
            }
        }
    });
}

// Initialize responsive behavior for QR interface
function setupQRResponsiveBehavior() {
    function handleResize() {
        const width = window.innerWidth;
        
        // Handle mobile/desktop tab visibility
        if (width >= 768) { // md breakpoint
            // Desktop - show desktop tabs, hide mobile tabs
            jQuery('.nav-tab').removeClass('hidden').show();
            jQuery('.nav-tab-mobile').addClass('hidden').hide();
        } else {
            // Mobile - show mobile tabs, hide desktop tabs
            jQuery('.nav-tab').addClass('hidden').hide();
            jQuery('.nav-tab-mobile').removeClass('hidden').show();
        }
        
        // Adjust QR preview size on mobile
        if (width < 640) { // sm breakpoint
            jQuery('.qr-preview-container canvas').css({
                'max-width': '280px',
                'max-height': '280px'
            });
        } else {
            jQuery('.qr-preview-container canvas').css({
                'max-width': '300px',
                'max-height': '300px'
            });
        }
    }
    
    // Initial setup
    handleResize();
    
    // Handle window resize
    jQuery(window).on('resize', debounce(handleResize, 250));
}

// Form validation helpers
function setupQRFormValidation() {
    // Real-time validation for URL fields
    jQuery(document).on('input', 'input[type="url"]', function() {
        const input = jQuery(this);
        const value = input.val().trim();
        
        if (value && !isValidURL(value)) {
            input.addClass('border-red-300 focus:border-red-500');
            
            // Show validation hint
            let hint = input.next('.validation-hint');
            if (hint.length === 0) {
                hint = jQuery('<div class="validation-hint text-xs text-red-600 mt-1">Gültige URL eingeben (z.B. https://www.beispiel.de)</div>');
                input.after(hint);
            }
        } else {
            input.removeClass('border-red-300 focus:border-red-500');
            input.next('.validation-hint').remove();
        }
    });
    
    // Real-time validation for email fields
    jQuery(document).on('input', 'input[type="email"]', function() {
        const input = jQuery(this);
        const value = input.val().trim();
        
        if (value && !isValidEmail(value)) {
            input.addClass('border-red-300 focus:border-red-500');
            
            let hint = input.next('.validation-hint');
            if (hint.length === 0) {
                hint = jQuery('<div class="validation-hint text-xs text-red-600 mt-1">Gültige E-Mail-Adresse eingeben</div>');
                input.after(hint);
            }
        } else {
            input.removeClass('border-red-300 focus:border-red-500');
            input.next('.validation-hint').remove();
        }
    });
}

// Utility: Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced initialization with error handling
function initializeQRHandlersWithErrorHandling() {
    try {
        initializeQRHandlers();
        setupQRHashNavigation();
        setupQRBrowserNavigation();
        setupQRKeyboardShortcuts();
        setupQRErrorHandling();
        setupQRResponsiveBehavior();
        setupQRFormValidation();
        
        // Restore last tab after short delay to ensure DOM is ready
        setTimeout(restoreLastTab, 100);
        
        console.log('QR Code Handlers fully initialized with enhancements');
        
    } catch (error) {
        console.error('Error initializing QR handlers:', error);
        
        // Fallback initialization
        setTimeout(() => {
            try {
                initializeQRHandlers();
                restoreLastTab();
            } catch (fallbackError) {
                console.error('Fallback QR handler initialization also failed:', fallbackError);
            }
        }, 500);
    }
}

// Initialize when document is ready
jQuery(document).ready(function() {
    initializeQRHandlersWithErrorHandling();
});