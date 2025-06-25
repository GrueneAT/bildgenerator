// Legacy constants reference - use AppConstants instead

// Canvas utilities
function setValue(key, value) {
    const activeObject = canvas.getActiveObject();
    console.log('setValue called:', key, '=', value, 'on object:', activeObject);
    
    if (activeObject) {
        activeObject.set(key, value);
        canvas.renderAll();
        console.log('Value set successfully. New value:', activeObject.get(key));
    } else {
        console.log('No active object to set value on');
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
// refreshSelectPicker function removed - no longer needed with Tailwind CSS

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
}

function disableTextMethods() {
    toggleTextMethods(false);
}

function enableTextMethods() {
    toggleTextMethods(true);
}

// Validation utilities - using centralized ValidationUtils
function isImage(fileType) {
    return ValidationUtils.isValidImage(fileType);
}

// File utilities
function createImgName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < AppConstants.FILE.FILENAME_LENGTH; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const format = jQuery('#image-format').find(":selected").attr('value');
    return `${result}.${format}`;
}

// Alert utilities now handled by AlertSystem - see alert-system.js