// Wizard Navigation and UI Enhancement
let currentStep = 1;
const totalSteps = 4;

// Initialize wizard functionality
function initializeWizard() {
    setupStepNavigation();
    setupAdvancedOptions();
    setupQRSection();
    updateCanvasDimensions();
    showStep(1);
}

// Step Navigation
function setupStepNavigation() {
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
    const template = jQuery('#canvas-template').val();
    const logo = jQuery('#logo-selection').val();
    
    if (!template) {
        showAlert('Bitte wählen Sie eine Vorlage aus.', 'warning');
        return false;
    }
    
    if (!logo) {
        showAlert('Bitte wählen Sie ein Logo aus.', 'warning');
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
    
    // Auto-scroll to top of controls
    jQuery('#generator')[0].scrollIntoView({ behavior: 'smooth' });
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

// Enhanced Alert System
function showTailwindAlert(message, type = 'info') {
    const alertContainer = jQuery('.alert-container');
    
    // Map alert types to Tailwind classes
    const alertClasses = {
        'success': 'bg-green-100 border-green-400 text-green-700',
        'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700',
        'danger': 'bg-red-100 border-red-400 text-red-700',
        'info': 'bg-blue-100 border-blue-400 text-blue-700'
    };
    
    const iconClasses = {
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'danger': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle'
    };
    
    const alertClass = alertClasses[type] || alertClasses['info'];
    const iconClass = iconClasses[type] || iconClasses['info'];
    
    const alertHTML = `
        <div class="alert ${alertClass} border px-4 py-3 rounded-md mb-4 shadow" role="alert">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="ml-3">
                        <span class="font-medium">${message}</span>
                    </div>
                </div>
                <div class="flex-shrink-0">
                    <button type="button" class="ml-2 text-current hover:text-opacity-75 focus:outline-none alert-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    alertContainer.removeClass('hidden').append(alertHTML);
    
    // Add click handler for close button
    alertContainer.find('.alert-close-btn').last().on('click', function() {
        jQuery(this).closest('.alert').fadeOut(300, function() {
            jQuery(this).remove();
            if (alertContainer.find('.alert').length === 0) {
                alertContainer.addClass('hidden');
            }
        });
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertContainer.find('.alert').first().fadeOut(300, function() {
            jQuery(this).remove();
            if (alertContainer.find('.alert').length === 0) {
                alertContainer.addClass('hidden');
            }
        });
    }, 5000);
}

// Auto-advance logic
function setupAutoAdvance() {
    // Auto-advance from step 1 when template and logo are selected
    jQuery('#canvas-template, #logo-selection').on('change', function() {
        // Always update dimensions when template changes
        setTimeout(() => {
            updateCanvasDimensions();
        }, 200);
        
        if (currentStep === 1) {
            const template = jQuery('#canvas-template').val();
            const logo = jQuery('#logo-selection').val();
            
            if (template && logo) {
                setTimeout(() => {
                    showAlert('Vorlage ausgewählt! Sie können nun zum nächsten Schritt.', 'success');
                }, 500);
            }
        }
    });
    
    // Auto-advance from step 2 when background image is selected
    jQuery('#meme-input').on('change', function() {
        if (currentStep === 2 && this.files && this.files[0]) {
            setTimeout(() => {
                showAlert('Hintergrundbild geladen! Sie können nun Inhalte hinzufügen.', 'success');
            }, 1000);
        }
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
            if (currentStep < 3) {
                // Auto-advance to step 3 when content is added
                goToStep(3);
            }
        });
        
        canvas.on('object:removed', function(e) {
            showAlert('Element entfernt', 'info');
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
    
    // Initial state
    showAlert('Willkommen! Wählen Sie zuerst eine Vorlage aus.', 'info');
    
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