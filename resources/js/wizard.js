// Wizard Navigation and UI Enhancement
let currentStep = 1;
const totalSteps = 4;

// Initialize wizard functionality
function initializeWizard() {
    // Ensure we always start from step 1
    currentStep = 1;
    
    // Preload fonts to ensure they're available when needed
    preloadFonts();
    
    setupStepNavigation();
    setupAdvancedOptions();
    setupQRSection();
    updateCanvasDimensions();
    goToStep(1);
}

// Preload custom fonts
function preloadFonts() {
    const fonts = [
        new FontFaceObserver('Gotham Narrow Ultra Italic'),
        new FontFaceObserver('Gotham Narrow Book'),
        new FontFaceObserver('Gotham Narrow Bold')
    ];
    
    fonts.forEach(font => {
        font.load().then(function() {
            console.log('Font loaded successfully:', font.family);
        }).catch(function() {
            console.log('Font failed to load:', font.family);
        });
    });
}

// Step Navigation
function setupStepNavigation() {
    // Step indicator click navigation (desktop)
    jQuery('#step-1-indicator').on('click', function() {
        goToStep(1);
    });
    
    jQuery('#step-2-indicator').on('click', function() {
        goToStep(2);
    });
    
    jQuery('#step-3-indicator').on('click', function() {
        goToStep(3);
    });
    
    jQuery('#step-4-indicator').on('click', function() {
        goToStep(4);
    });
    
    // Step indicator click navigation (mobile)
    jQuery('#step-1-indicator-mobile').on('click', function() {
        goToStep(1);
    });
    
    jQuery('#step-2-indicator-mobile').on('click', function() {
        goToStep(2);
    });
    
    jQuery('#step-3-indicator-mobile').on('click', function() {
        goToStep(3);
    });
    
    jQuery('#step-4-indicator-mobile').on('click', function() {
        goToStep(4);
    });

    // Next buttons
    jQuery('#step-1-next').on('click', function() {
        if (validateStep1()) {
            goToStep(2);
        }
    });
    
    jQuery('#step-2-next').on('click', function() {
        goToStep(3);
    });
    
    jQuery('#step-3-next').on('click', function() {
        goToStep(4);
    });
    
    // Back buttons
    jQuery('#step-2-back').on('click', function() {
        goToStep(1);
    });
    
    jQuery('#step-3-back').on('click', function() {
        goToStep(2);
    });
    
    jQuery('#step-4-back').on('click', function() {
        goToStep(3);
    });
    
    // Start over button
    jQuery('#start-over').on('click', function() {
        if (confirm('Möchten Sie wirklich von vorne beginnen? Alle Änderungen gehen verloren.')) {
            resetWizard();
        }
    });
}

function validateStep1() {
    const validation = ValidationUtils.validateStep1();
    
    if (!validation.isValid) {
        validation.errors.forEach(error => {
            showAlert(error, 'warning');
        });
        return false;
    }
    
    return true;
}

function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    
    // Hide current step
    jQuery(`.step-content`).addClass('hidden');
    
    // Show target step
    jQuery(`#step-${stepNumber}`).removeClass('hidden');
    
    // Update step indicators
    updateStepIndicators(stepNumber);
    
    // Update current step
    currentStep = stepNumber;
    
    // Auto-scroll removed completely
}

function updateStepIndicators(activeStep) {
    // Update desktop indicators
    for (let i = 1; i <= totalSteps; i++) {
        const indicator = jQuery(`#step-${i}-indicator`);
        const mobileIndicator = jQuery(`#step-${i}-indicator-mobile`);
        const stepContainer = indicator.closest('.flex.flex-col');
        const mobileContainer = mobileIndicator.closest('.flex.items-center');
        
        if (i <= activeStep) {
            // Desktop indicators
            indicator.removeClass('bg-gray-300 text-gray-600')
                    .addClass('bg-green-600 text-white active');
            stepContainer.find('p').first().removeClass('text-gray-500').addClass('text-gray-900');
            stepContainer.find('p').last().removeClass('text-gray-500').addClass('text-gray-600');
            
            // Mobile indicators
            mobileIndicator.removeClass('bg-gray-300 text-gray-600')
                           .addClass('bg-green-600 text-white active');
            mobileContainer.removeClass('bg-gray-50 border-gray-200').addClass('bg-green-50 border-green-200');
            mobileContainer.find('p').first().removeClass('text-gray-500').addClass('text-gray-900');
            mobileContainer.find('p').last().removeClass('text-gray-500').addClass('text-gray-600');
        } else {
            // Desktop indicators
            indicator.removeClass('bg-green-600 text-white active')
                    .addClass('bg-gray-300 text-gray-600');
            stepContainer.find('p').first().removeClass('text-gray-900').addClass('text-gray-500');
            stepContainer.find('p').last().removeClass('text-gray-600').addClass('text-gray-500');
            
            // Mobile indicators
            mobileIndicator.removeClass('bg-green-600 text-white active')
                           .addClass('bg-gray-300 text-gray-600');
            mobileContainer.removeClass('bg-green-50 border-green-200').addClass('bg-gray-50 border-gray-200');
            mobileContainer.find('p').first().removeClass('text-gray-900').addClass('text-gray-500');
            mobileContainer.find('p').last().removeClass('text-gray-600').addClass('text-gray-500');
        }
    }
    
    // Update progress bars
    for (let i = 1; i < totalSteps; i++) {
        const progressBar = jQuery(`#progress-${i}-${i+1}`);
        if (i < activeStep) {
            progressBar.css('width', '100%');
        } else {
            progressBar.css('width', '0%');
        }
    }
}

function resetWizard() {
    // Reset to step 1
    goToStep(1);
    
    // Clear all form inputs
    jQuery('#text').val('');
    jQuery('#qr-text').val('');
    
    // Reset canvas
    if (canvas) {
        canvas.clear();
        replaceCanvas();
    }
    
    // Hide QR section
    jQuery('#qr-section').addClass('hidden');
    
    showAlert('Neues Bild wird erstellt...', 'success');
}

// Advanced Options Toggle
function setupAdvancedOptions() {
    jQuery('#toggle-advanced').on('click', function() {
        const advancedOptions = jQuery('#advanced-options');
        const isExpanded = !advancedOptions.hasClass('hidden');
        
        if (isExpanded) {
            advancedOptions.addClass('hidden');
            jQuery(this).attr('aria-expanded', 'false');
        } else {
            advancedOptions.removeClass('hidden');
            jQuery(this).attr('aria-expanded', 'true');
        }
    });
    
    // Handle format change for quality section
    jQuery('#image-format').on('change', function() {
        const qualitySection = jQuery('#quality-section');
        if (jQuery(this).val() === 'jpeg') {
            qualitySection.show();
        } else {
            qualitySection.hide();
        }
    });
}

// QR Code Section Toggle
function setupQRSection() {
    jQuery('#show-qr-section').on('click', function() {
        const qrSection = jQuery('#qr-section');
        qrSection.toggleClass('hidden');
        
        if (!qrSection.hasClass('hidden')) {
            jQuery('#qr-text').focus();
        }
        
        // Debug log
        console.log('QR section toggled, hidden class:', qrSection.hasClass('hidden'));
    });
}

// Canvas Dimensions Display
function updateCanvasDimensions() {
    if (canvas && typeof currentTemplate === 'function') {
        const template = currentTemplate();
        if (template) {
            const dimensions = `${template.width} × ${template.height} px`;
            const dpi = template.dpi || 200;
            const displayText = `${dimensions} • ${dpi} DPI`;
            jQuery('#canvas-dimensions').text(displayText);
        }
    } else {
        // Fallback if canvas isn't ready yet
        setTimeout(updateCanvasDimensions, 500);
    }
}

// Alert system now handled by centralized AlertSystem

// LocalStorage functions for organization selection
function saveSelectedOrganization() {
    const selectedOrg = jQuery('#logo-selection').val();
    if (selectedOrg) {
        localStorage.setItem('gruener-bildgenerator-organisation', selectedOrg);
    }
}

function restoreSelectedOrganization() {
    const savedOrg = localStorage.getItem('gruener-bildgenerator-organisation');
    if (savedOrg) {
        const $logoSelect = jQuery('#logo-selection');
        const searchableSelect = $logoSelect.data('searchable-select');
        
        // Check if options are already loaded and component is ready
        if ($logoSelect.find('option').length > 1 && searchableSelect) {
            if ($logoSelect.find(`option[value="${savedOrg}"]`).length > 0) {
                // Use searchable select's method to properly update both the select and UI
                searchableSelect.selectOption(savedOrg);
                console.log('Restored organization selection:', savedOrg);
            }
        } else if ($logoSelect.find('option').length > 1) {
            // Fallback for regular select without searchable component
            if ($logoSelect.find(`option[value="${savedOrg}"]`).length > 0) {
                $logoSelect.val(savedOrg);
                $logoSelect.trigger('change');
                console.log('Restored organization selection (fallback):', savedOrg);
            }
        } else {
            // If options aren't loaded yet, wait for them with a minimal delay
            setTimeout(() => restoreSelectedOrganization(), 50);
        }
    }
}

// Auto-advance logic
function setupAutoAdvance() {
    // Auto-advance from step 1 when template and logo are selected
    jQuery('#canvas-template, #logo-selection').on('change', function() {
        // Save organization selection when it changes
        if (this.id === 'logo-selection') {
            saveSelectedOrganization();
        }
        
        // Always update dimensions when template changes
        setTimeout(() => {
            updateCanvasDimensions();
        }, 200);
        
        if (currentStep === 1) {
            const template = jQuery('#canvas-template').val();
            const logo = jQuery('#logo-selection').val();
            
            // Template selection notification removed
        }
    });
    
    // Auto-advance from step 2 when background image is selected
    jQuery('#meme-input').on('change', function() {
        // Background image notification removed
    });
}

// Enhanced Canvas Integration
function enhanceCanvasIntegration() {
    // Override the original replaceCanvas function to include dimension updates
    const originalReplaceCanvas = window.replaceCanvas;
    window.replaceCanvas = function() {
        originalReplaceCanvas.apply(this, arguments);
        // Update dimensions after canvas is fully replaced
        setTimeout(() => {
            updateCanvasDimensions();
        }, 100);
    };
    
    // Canvas event listeners for better UX
    if (canvas) {
        canvas.on('object:added', function(e) {
            // Object added - no auto-advance to maintain user control
        });
        
        canvas.on('object:removed', function(e) {
            // Element removed silently - no notification needed
        });
    }
}

// Mobile-specific enhancements
function setupMobileEnhancements() {
    // Better mobile navigation
    if (window.innerWidth <= 768) {
        // Simplified step indicators for mobile
        jQuery('.step-indicator').addClass('mobile-compact');
        
        // Touch-friendly buttons
        jQuery('.btn-primary, .btn-secondary').addClass('touch-friendly');
    }
}

// Initialize everything when document is ready
jQuery(document).ready(function() {
    initializeWizard();
    setupAutoAdvance();
    enhanceCanvasIntegration();
    setupMobileEnhancements();
    
    // Restore saved organization selection (now immediate with embedded logos)
    setTimeout(() => {
        restoreSelectedOrganization();
    }, 100);
    
    // Initial state - no welcome message on first load
    
    // Update dimensions after a short delay to ensure canvas is ready
    setTimeout(() => {
        updateCanvasDimensions();
    }, 1000);
});

// Window resize handler for responsive updates
jQuery(window).on('resize', function() {
    updateCanvasDimensions();
    setupMobileEnhancements();
});

// Expose functions to global scope for inline event handlers
window.goToStep = goToStep;