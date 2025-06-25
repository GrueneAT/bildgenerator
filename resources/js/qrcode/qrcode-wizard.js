// QR Code Wizard Navigation and State Management
let qrCurrentStep = 1;
const qrTotalSteps = 3;
let qrSelectedType = null;
let qrGeneratedCode = null;

// QR Code Wizard Initialization
function initializeQRWizard() {
    qrCurrentStep = 1;
    qrSelectedType = null;
    qrGeneratedCode = null;
    
    setupQRStepNavigation();
    setupQRTypeSelection();
    qrGoToStep(1);
    
    console.log('QR Code Wizard initialized');
}

// QR Code Step Navigation Setup
function setupQRStepNavigation() {
    // Next buttons
    jQuery('#qr-step-1-next').on('click', function() {
        if (validateQRStep1()) {
            qrGoToStep(2);
        }
    });
    
    jQuery('#qr-step-2-next').on('click', function() {
        if (validateQRStep2()) {
            qrGoToStep(3);
        }
    });
    
    // Back buttons
    jQuery('#qr-step-2-back').on('click', function() {
        qrGoToStep(1);
    });
    
    jQuery('#qr-step-3-back').on('click', function() {
        qrGoToStep(2);
    });
    
    // Start over button
    jQuery('#qr-start-over').on('click', function() {
        if (confirm('Möchten Sie wirklich einen neuen QR-Code erstellen? Alle Eingaben gehen verloren.')) {
            resetQRWizard();
        }
    });
}

// QR Code Type Selection Setup
function setupQRTypeSelection() {
    jQuery('.qr-type-button').on('click', function() {
        const type = jQuery(this).data('type');
        selectQRType(type);
    });
}

// Select QR Code Type
function selectQRType(type) {
    qrSelectedType = type;
    
    // Update button states
    jQuery('.qr-type-button').removeClass('active bg-gruene-primary text-white')
                             .addClass('bg-white text-gray-700 border-gray-300');
    
    jQuery(`.qr-type-button[data-type="${type}"]`)
        .removeClass('bg-white text-gray-700 border-gray-300')
        .addClass('active bg-gruene-primary text-white');
    
    // Enable next button
    jQuery('#qr-step-1-next').prop('disabled', false).removeClass('disabled:opacity-50');
    
    // Update status
    updateQRStatus(`${getQRTypeDisplayName(type)} ausgewählt`);
    
    console.log('QR Type selected:', type);
}

// Get display name for QR type
function getQRTypeDisplayName(type) {
    const names = {
        'text': 'Text',
        'url': 'Homepage',
        'email': 'E-Mail',
        'vcard': 'Visitenkarte'
    };
    return names[type] || type;
}

// QR Code Step Navigation
function qrGoToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > qrTotalSteps) return;
    
    // Hide current step
    jQuery('.qr-step-content').addClass('hidden');
    
    // Show target step
    jQuery(`#qr-step-${stepNumber}`).removeClass('hidden');
    
    // Update step indicators
    updateQRStepIndicators(stepNumber);
    
    // Update current step
    qrCurrentStep = stepNumber;
    
    // Handle step-specific logic
    if (stepNumber === 2) {
        renderQRForm();
    } else if (stepNumber === 3) {
        if (typeof generateQRPreview === 'function') {
            generateQRPreview();
        }
    }
    
    // Auto-scroll to top
    jQuery('#qrcode-container')[0].scrollIntoView({ behavior: 'smooth' });
    
    console.log('QR Step:', stepNumber);
}

// Update QR Step Indicators
function updateQRStepIndicators(activeStep) {
    for (let i = 1; i <= qrTotalSteps; i++) {
        const indicator = jQuery(`#qr-step-${i}-indicator`);
        const stepContainer = indicator.closest('.flex.flex-col');
        
        if (i <= activeStep) {
            indicator.removeClass('bg-gray-300 text-gray-600')
                    .addClass('bg-green-600 text-white active');
            stepContainer.find('p').first().removeClass('text-gray-500').addClass('text-gray-900');
            stepContainer.find('p').last().removeClass('text-gray-500').addClass('text-gray-600');
        } else {
            indicator.removeClass('bg-green-600 text-white active')
                    .addClass('bg-gray-300 text-gray-600');
            stepContainer.find('p').first().removeClass('text-gray-900').addClass('text-gray-500');
            stepContainer.find('p').last().removeClass('text-gray-600').addClass('text-gray-500');
        }
    }
    
    // Update progress bars
    for (let i = 1; i < qrTotalSteps; i++) {
        const progressBar = jQuery(`#qr-progress-${i}-${i+1}`);
        if (i < activeStep) {
            progressBar.css('width', '100%');
        } else {
            progressBar.css('width', '0%');
        }
    }
}

// Render QR Form based on selected type
function renderQRForm() {
    const container = jQuery('#qr-form-container');
    container.empty();
    
    if (!qrSelectedType) {
        container.html('<p class="text-gray-500">Kein Inhaltstyp ausgewählt</p>');
        return;
    }
    
    let formHTML = '';
    
    switch (qrSelectedType) {
        case 'text':
            formHTML = `
                <div>
                    <label for="qr-text-input" class="block text-sm font-medium text-gray-700 mb-2">
                        Ihr Text:
                    </label>
                    <textarea
                        id="qr-text-input"
                        class="form-input w-full"
                        rows="5"
                        placeholder="Geben Sie Ihren Text hier ein..."
                        required
                    ></textarea>
                </div>
            `;
            break;
            
        case 'url':
            formHTML = `
                <div>
                    <label for="qr-url-input" class="block text-sm font-medium text-gray-700 mb-2">
                        Website-URL:
                    </label>
                    <input
                        type="url"
                        id="qr-url-input"
                        class="form-input w-full"
                        placeholder="https://www.beispiel.de"
                        required
                    />
                </div>
            `;
            break;
            
        case 'email':
            formHTML = `
                <div class="space-y-4">
                    <div>
                        <label for="qr-email-address" class="block text-sm font-medium text-gray-700 mb-2">
                            E-Mail-Adresse:
                        </label>
                        <input
                            type="email"
                            id="qr-email-address"
                            class="form-input w-full"
                            placeholder="beispiel@gruene.at"
                            required
                        />
                    </div>
                    <div>
                        <label for="qr-email-subject" class="block text-sm font-medium text-gray-700 mb-2">
                            Betreff:
                        </label>
                        <input
                            type="text"
                            id="qr-email-subject"
                            class="form-input w-full"
                            placeholder="Betreff der E-Mail"
                        />
                    </div>
                    <div>
                        <label for="qr-email-body" class="block text-sm font-medium text-gray-700 mb-2">
                            Nachricht:
                        </label>
                        <textarea
                            id="qr-email-body"
                            class="form-input w-full"
                            rows="5"
                            placeholder="Nachrichtentext..."
                        ></textarea>
                    </div>
                </div>
            `;
            break;
            
        case 'vcard':
            formHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="qr-vcard-title" class="block text-sm font-medium text-gray-700 mb-2">
                                Titel:
                            </label>
                            <input
                                type="text"
                                id="qr-vcard-title"
                                class="form-input w-full"
                                placeholder="Dr., Mag., etc."
                            />
                        </div>
                        <div>
                            <label for="qr-vcard-firstname" class="block text-sm font-medium text-gray-700 mb-2">
                                Vorname:
                            </label>
                            <input
                                type="text"
                                id="qr-vcard-firstname"
                                class="form-input w-full"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                    <div>
                        <label for="qr-vcard-lastname" class="block text-sm font-medium text-gray-700 mb-2">
                            Nachname: *
                        </label>
                        <input
                            type="text"
                            id="qr-vcard-lastname"
                            class="form-input w-full"
                            placeholder="Mustermann"
                            required
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="qr-vcard-phone" class="block text-sm font-medium text-gray-700 mb-2">
                                Telefonnummer:
                            </label>
                            <input
                                type="tel"
                                id="qr-vcard-phone"
                                class="form-input w-full"
                                placeholder="+43 1 234 5678"
                            />
                        </div>
                        <div>
                            <label for="qr-vcard-email" class="block text-sm font-medium text-gray-700 mb-2">
                                E-Mail:
                            </label>
                            <input
                                type="email"
                                id="qr-vcard-email"
                                class="form-input w-full"
                                placeholder="max.mustermann@gruene.at"
                            />
                        </div>
                    </div>
                    <div>
                        <label for="qr-vcard-address" class="block text-sm font-medium text-gray-700 mb-2">
                            Straße und Hausnummer:
                        </label>
                        <input
                            type="text"
                            id="qr-vcard-address"
                            class="form-input w-full"
                            placeholder="Musterstraße 123"
                        />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="qr-vcard-zip" class="block text-sm font-medium text-gray-700 mb-2">
                                PLZ:
                            </label>
                            <input
                                type="text"
                                id="qr-vcard-zip"
                                class="form-input w-full"
                                placeholder="1010"
                            />
                        </div>
                        <div>
                            <label for="qr-vcard-city" class="block text-sm font-medium text-gray-700 mb-2">
                                Stadt:
                            </label>
                            <input
                                type="text"
                                id="qr-vcard-city"
                                class="form-input w-full"
                                placeholder="Wien"
                            />
                        </div>
                    </div>
                    <div>
                        <label for="qr-vcard-website" class="block text-sm font-medium text-gray-700 mb-2">
                            Homepage:
                        </label>
                        <input
                            type="url"
                            id="qr-vcard-website"
                            class="form-input w-full"
                            placeholder="https://www.gruene.at"
                        />
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-info-circle text-blue-400"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-700">
                                    Alle Felder außer dem Nachnamen sind optional. 
                                    Der QR-Code wird auch bei Teilbefüllung erstellt.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    container.html(formHTML);
    
    // Focus first input
    container.find('input, textarea').first().focus();
    
    // Setup live preview updates
    setupQRLivePreview();
}

// Setup live preview updates
function setupQRLivePreview() {
    const inputs = jQuery('#qr-form-container input, #qr-form-container textarea');
    
    inputs.on('input', debounce(function() {
        if (qrCurrentStep === 2) {
            // Update status to show preview is being generated
            updateQRStatus('Vorschau wird aktualisiert...');
            
            // Generate preview with a slight delay
            setTimeout(() => {
                if (typeof generateQRPreview === 'function') {
                    generateQRPreview(true);
                }
            }, 100);
        }
    }, 300));
}

// Validate QR Step 1
function validateQRStep1() {
    if (!qrSelectedType) {
        showQRAlert('Bitte wählen Sie einen Inhaltstyp aus.', 'warning');
        return false;
    }
    return true;
}

// Validate QR Step 2
function validateQRStep2() {
    if (!qrSelectedType) {
        showQRAlert('Kein Inhaltstyp ausgewählt.', 'error');
        return false;
    }
    
    // Type-specific validation
    switch (qrSelectedType) {
        case 'text':
            if (!jQuery('#qr-text-input').val().trim()) {
                showQRAlert('Bitte geben Sie einen Text ein.', 'warning');
                jQuery('#qr-text-input').focus();
                return false;
            }
            break;
            
        case 'url':
            const url = jQuery('#qr-url-input').val().trim();
            if (!url) {
                showQRAlert('Bitte geben Sie eine URL ein.', 'warning');
                jQuery('#qr-url-input').focus();
                return false;
            }
            if (!isValidURL(url)) {
                showQRAlert('Bitte geben Sie eine gültige URL ein.', 'warning');
                jQuery('#qr-url-input').focus();
                return false;
            }
            break;
            
        case 'email':
            if (!jQuery('#qr-email-address').val().trim()) {
                showQRAlert('Bitte geben Sie eine E-Mail-Adresse ein.', 'warning');
                jQuery('#qr-email-address').focus();
                return false;
            }
            break;
            
        case 'vcard':
            if (!jQuery('#qr-vcard-lastname').val().trim()) {
                showQRAlert('Bitte geben Sie mindestens einen Nachnamen ein.', 'warning');
                jQuery('#qr-vcard-lastname').focus();
                return false;
            }
            break;
    }
    
    return true;
}

// Reset QR Wizard
function resetQRWizard() {
    qrCurrentStep = 1;
    qrSelectedType = null;
    qrGeneratedCode = null;
    
    // Clear form inputs
    jQuery('#qr-form-container').empty();
    
    // Reset type buttons
    jQuery('.qr-type-button').removeClass('active bg-gruene-primary text-white')
                             .addClass('bg-white text-gray-700 border-gray-300');
    
    // Disable next button
    jQuery('#qr-step-1-next').prop('disabled', true).addClass('disabled:opacity-50');
    
    // Clear preview
    if (typeof clearQRPreview === 'function') {
        clearQRPreview();
    }
    
    // Go to step 1
    qrGoToStep(1);
    
    updateQRStatus('Wählen Sie einen Inhaltstyp');
    showQRAlert('Neuer QR-Code wird erstellt...', 'success');
}

// Update QR Status
function updateQRStatus(message) {
    jQuery('#qr-status').text(message);
}

// Show QR Alert - Now uses unified alert system
function showQRAlert(message, type = 'info') {
    // Use the unified alert system if available
    if (typeof window.AlertSystem !== 'undefined' && window.AlertSystem.showQRAlert) {
        return window.AlertSystem.showQRAlert(message, type);
    }
    
    // Fallback to legacy system
    if (typeof showAlert === 'function') {
        showAlert(message, type);
    } else if (typeof showTailwindAlert === 'function') {
        showTailwindAlert(message, type);
    } else {
        // Final fallback to console
        console.log(`QR Alert (${type}):`, message);
    }
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Try adding https:// if it's missing
        try {
            new URL('https://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize QR Wizard when module is loaded
jQuery(document).ready(function() {
    // Don't auto-initialize - will be called when QR tab is activated
    console.log('QR Code Wizard module loaded');
});