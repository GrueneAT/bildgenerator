// Constants
const CONSTANTS = {
    FILENAME_LENGTH: 6,
    ALERT_DURATION: 3000,
    VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
};

// Canvas utilities
function setValue(key, value) {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.set(key, value);
        canvas.renderAll();
    }
}

function getBackgroundColor(color) {
    return jQuery('#bg-option').hasClass('active') ? color : '';
}

function setBackgroundColor(color) {
    setValue("textBackgroundColor", getBackgroundColor(color));
}

function createShadow(color, width) {
    return `${color} 2px 2px ${width}`;
}

// UI utilities
function refreshSelectPicker() {
    jQuery('#font-family').selectpicker('refresh');
}

function toggleTextMethods(enable) {
    const $textMethods = jQuery('.text-method');
    const $alignButtons = jQuery('.align');
    
    if (enable) {
        $textMethods.attr('disabled', false);
        $alignButtons.removeClass('disabled');
    } else {
        $textMethods.attr('disabled', 'disabled');
        $alignButtons.addClass('disabled');
    }
    refreshSelectPicker();
}

function disableTextMethods() {
    toggleTextMethods(false);
}

function enableTextMethods() {
    toggleTextMethods(true);
}

// Validation utilities
function isImage(fileType) {
    return CONSTANTS.VALID_IMAGE_TYPES.includes(fileType);
}

// File utilities
function createImgName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < CONSTANTS.FILENAME_LENGTH; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const format = jQuery('#image-format').find(":selected").attr('value');
    return `${result}.${format}`;
}

// Alert utilities
function showAlert(message) {
    const $alertContainer = jQuery('.alert-container');
    
    $alertContainer
        .html(`<p class="text-center mb-0"><strong>${message}</strong></p>`)
        .fadeIn('normal', function () {
            setTimeout(function () {
                $alertContainer.fadeOut('normal', function () {
                    $alertContainer.html('');
                });
            }, CONSTANTS.ALERT_DURATION);
        });
}