// Validation Utilities - Centralized validation functions

const ValidationUtils = {
    // File validation
    VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    
    isValidImage(fileType) {
        return this.VALID_IMAGE_TYPES.includes(fileType);
    },

    isValidImageFile(file) {
        if (!file) return false;
        return this.isValidImage(file.type);
    },

    // JSON validation
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Canvas validation
    validateStep1() {
        const template = jQuery('#canvas-template').val();
        const logo = jQuery('#logo-selection').val();
        
        const errors = [];
        
        if (!template) {
            errors.push('Bitte wählen Sie eine Vorlage aus.');
        }
        
        if (!logo) {
            errors.push('Bitte wählen Sie ein Logo aus.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Text validation
    validateTextInput(text) {
        if (!text || text.trim() === '') {
            return {
                isValid: false,
                error: 'Text field is empty'
            };
        }
        
        return {
            isValid: true,
            error: null
        };
    },

    // QR Code validation
    validateQRInput(text) {
        if (!text || text.trim() === '') {
            return {
                isValid: false,
                error: 'QR Code Text field is empty'
            };
        }
        
        // Check if QRCode library is available
        if (typeof QRCode === "undefined") {
            return {
                isValid: false,
                error: 'QR Code library not loaded'
            };
        }
        
        return {
            isValid: true,
            error: null
        };
    },

    // Canvas object validation
    validateCanvasObject(object, allowedTypes = []) {
        if (!object) {
            return {
                isValid: false,
                error: 'No object selected'
            };
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(object.type)) {
            return {
                isValid: false,
                error: `Invalid object type. Expected: ${allowedTypes.join(', ')}, got: ${object.type}`
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    // Circle clip validation
    validateCircleClipTarget(activeObject) {
        if (!activeObject) {
            return {
                isValid: false,
                error: 'Bitte wählen Sie zuerst ein Element aus, um einen Kreis-Ausschnitt anzuwenden.',
                type: 'warning'
            };
        }

        if (activeObject === contentImage) {
            return {
                isValid: false,
                error: 'Kreis-Ausschnitt kann nicht auf das Hintergrundbild angewendet werden. Fügen Sie zuerst ein eigenes Bild über "Bild hinzufügen" ein.',
                type: 'warning'
            };
        }

        if (activeObject === logo || activeObject === logoName) {
            return {
                isValid: false,
                error: 'Kreis-Ausschnitt kann nicht auf das Logo angewendet werden. Wählen Sie ein eingefügtes Bild aus.',
                type: 'warning'
            };
        }

        const isValidForCircle = 
            activeObject.type === "image" ||
            activeObject.type === "rect" ||
            activeObject.type === "circle";

        if (!isValidForCircle) {
            return {
                isValid: false,
                error: 'Kreis-Ausschnitt kann nur auf eingefügte Bilder und Elemente angewendet werden. Wählen Sie zuerst ein Element aus.',
                type: 'warning'
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    // Download validation
    validateDownload() {
        if (!logoText || logoText === "") {
            return {
                isValid: false,
                error: 'Wähle bitte ein Logo aus vor dem Download!'
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    // File size validation
    validateFileSize(file, maxSizeMB = 10) {
        if (!file) return { isValid: false, error: 'No file provided' };
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        
        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                error: `File too large. Maximum size is ${maxSizeMB}MB`
            };
        }
        
        return {
            isValid: true,
            error: null
        };
    }
};

// Make available globally
window.ValidationUtils = ValidationUtils;