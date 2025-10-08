// QR Code Helper Functions and Utilities

// QR Code Data Validation Helpers
const QRValidationHelpers = {
    // Validate text input
    validateText: function(text) {
        if (!text || typeof text !== 'string') {
            return { valid: false, error: 'Text ist erforderlich' };
        }
        
        const trimmed = text.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Text darf nicht leer sein' };
        }
        
        if (trimmed.length > 2000) {
            return { valid: false, error: 'Text ist zu lang (maximal 2000 Zeichen)' };
        }
        
        return { valid: true, data: trimmed };
    },
    
    // Validate and normalize URL
    validateURL: function(url) {
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'URL ist erforderlich' };
        }
        
        let trimmed = url.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'URL darf nicht leer sein' };
        }
        
        // Try to add protocol if missing
        if (!trimmed.match(/^https?:\/\//i)) {
            trimmed = 'https://' + trimmed;
        }
        
        // Validate URL format
        try {
            const urlObj = new URL(trimmed);
            
            // Basic security checks
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                return { valid: false, error: 'Nur HTTP und HTTPS URLs sind erlaubt' };
            }
            
            return { valid: true, data: urlObj.toString() };
        } catch (error) {
            return { valid: false, error: 'Ungültige URL' };
        }
    },
    
    // Validate email address
    validateEmail: function(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'E-Mail-Adresse ist erforderlich' };
        }
        
        const trimmed = email.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'E-Mail-Adresse darf nicht leer sein' };
        }
        
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return { valid: false, error: 'Ungültige E-Mail-Adresse' };
        }
        
        return { valid: true, data: trimmed };
    },
    
    // Validate vCard data
    validateVCard: function(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Ungültige Visitenkarten-Daten' };
        }
        
        // At least last name is required
        if (!data.lastname || data.lastname.trim().length === 0) {
            return { valid: false, error: 'Nachname ist erforderlich' };
        }
        
        // Validate email if provided
        if (data.email && data.email.trim().length > 0) {
            const emailValidation = this.validateEmail(data.email);
            if (!emailValidation.valid) {
                return { valid: false, error: 'Ungültige E-Mail-Adresse: ' + emailValidation.error };
            }
        }
        
        // Validate website if provided
        if (data.website && data.website.trim().length > 0) {
            const urlValidation = this.validateURL(data.website);
            if (!urlValidation.valid) {
                return { valid: false, error: 'Ungültige Website-URL: ' + urlValidation.error };
            }
        }
        
        return { valid: true, data: data };
    }
};

// QR Code Format Helpers
const QRFormatHelpers = {
    // Format text for QR code
    formatText: function(text) {
        return text.trim();
    },
    
    // Format URL for QR code
    formatURL: function(url) {
        let formatted = url.trim();
        
        // Add https:// if no protocol specified
        if (!formatted.match(/^https?:\/\//i)) {
            formatted = 'https://' + formatted;
        }
        
        return formatted;
    },
    
    // Format email data into mailto URL
    formatEmail: function(email, subject = '', body = '') {
        let mailto = `mailto:${email.trim()}`;
        const params = [];
        
        if (subject && subject.trim().length > 0) {
            params.push(`subject=${encodeURIComponent(subject.trim())}`);
        }
        
        if (body && body.trim().length > 0) {
            params.push(`body=${encodeURIComponent(body.trim())}`);
        }
        
        if (params.length > 0) {
            mailto += '?' + params.join('&');
        }
        
        return mailto;
    },
    
    // Format vCard data
    formatVCard: function(data) {
        let vcard = 'BEGIN:VCARD\n';
        vcard += 'VERSION:3.0\n';
        
        // Name components
        const title = (data.title || '').trim();
        const firstname = (data.firstname || '').trim();
        const lastname = (data.lastname || '').trim();
        
        // Full name
        const fullName = [title, firstname, lastname].filter(n => n.length > 0).join(' ');
        vcard += `FN:${fullName}\n`;
        
        // Structured name (Last;First;Middle;Prefix;Suffix)
        vcard += `N:${lastname};${firstname};;${title};\n`;
        
        // Contact information
        if (data.phone && data.phone.trim().length > 0) {
            vcard += `TEL:${data.phone.trim()}\n`;
        }
        
        if (data.email && data.email.trim().length > 0) {
            vcard += `EMAIL:${data.email.trim()}\n`;
        }
        
        // Address
        if (data.address || data.city || data.zip) {
            const address = (data.address || '').trim();
            const city = (data.city || '').trim();
            const zip = (data.zip || '').trim();
            
            vcard += `ADR:;;${address};${city};;${zip};\n`;
        }
        
        // Website
        if (data.website && data.website.trim().length > 0) {
            let website = data.website.trim();
            if (!website.match(/^https?:\/\//i)) {
                website = 'https://' + website;
            }
            vcard += `URL:${website}\n`;
        }
        
        vcard += 'END:VCARD';
        
        return vcard;
    }
};

// QR Code Display Helpers
const QRDisplayHelpers = {
    // Get display name for QR type
    getTypeDisplayName: function(type) {
        const names = {
            'text': 'Text',
            'url': 'Homepage',
            'email': 'E-Mail',
            'vcard': 'Visitenkarte'
        };
        return names[type] || type;
    },
    
    // Get icon class for QR type
    getTypeIcon: function(type) {
        const icons = {
            'text': 'fas fa-font',
            'url': 'fas fa-globe',
            'email': 'fas fa-envelope',
            'vcard': 'fas fa-user'
        };
        return icons[type] || 'fas fa-qrcode';
    },
    
    // Format color name for display
    getColorDisplayName: function(colorValue) {
        const colorNames = {
            '#000000': 'Schwarz',
            '#FFFFFF': 'Weiß',
            '#538430': 'Dunkelgrün',
            '#82B624': 'Hellgrün',
            '#FFED00': 'Gelb',
            '#E6007E': 'Magenta'
        };
        return colorNames[colorValue] || colorValue;
    },
    
    // Format background name for display
    getBackgroundDisplayName: function(bgValue) {
        const bgNames = {
            '#FFFFFF': 'Weiß',
            '#000000': 'Schwarz',
            'transparent': 'Transparent'
        };
        return bgNames[bgValue] || bgValue;
    },
    
    // Generate preview text for QR content
    generatePreviewText: function(type, data, maxLength = 50) {
        if (!data) return 'Keine Daten';
        
        let preview = '';
        
        switch (type) {
            case 'text':
                preview = data;
                break;
                
            case 'url':
                preview = data;
                break;
                
            case 'email':
                if (data.startsWith('mailto:')) {
                    const url = new URL(data);
                    preview = url.pathname; // The email address
                } else {
                    preview = data;
                }
                break;
                
            case 'vcard':
                // Extract name from vCard
                const nameMatch = data.match(/FN:(.+)/);
                if (nameMatch) {
                    preview = nameMatch[1];
                } else {
                    preview = 'Visitenkarte';
                }
                break;
                
            default:
                preview = data;
        }
        
        // Truncate if too long
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength - 3) + '...';
        }
        
        return preview;
    }
};

// QR Code Storage Helpers
const QRStorageHelpers = {
    // Save QR settings to localStorage
    saveSettings: function(settings) {
        try {
            localStorage.setItem('qr-generator-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save QR settings to localStorage:', error);
        }
    },
    
    // Load QR settings from localStorage
    loadSettings: function() {
        try {
            const saved = localStorage.getItem('qr-generator-settings');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('Could not load QR settings from localStorage:', error);
            return null;
        }
    },
    
    // Save recent QR data for quick access
    saveRecentQR: function(qrData) {
        try {
            let recent = this.getRecentQRs();
            
            // Add new item to beginning
            recent.unshift({
                ...qrData,
                timestamp: Date.now()
            });
            
            // Keep only last 10 items
            recent = recent.slice(0, 10);
            
            localStorage.setItem('qr-generator-recent', JSON.stringify(recent));
        } catch (error) {
            console.warn('Could not save recent QR:', error);
        }
    },
    
    // Get recent QR codes
    getRecentQRs: function() {
        try {
            const saved = localStorage.getItem('qr-generator-recent');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Could not load recent QRs:', error);
            return [];
        }
    },
    
    // Clear recent QR codes
    clearRecentQRs: function() {
        try {
            localStorage.removeItem('qr-generator-recent');
        } catch (error) {
            console.warn('Could not clear recent QRs:', error);
        }
    }
};

// QR Code Analytics Helpers
const QRAnalyticsHelpers = {
    // Track QR code generation
    trackGeneration: function(type, success = true) {
        try {
            const stats = this.getStats();
            
            if (!stats[type]) {
                stats[type] = { total: 0, successful: 0, failed: 0 };
            }
            
            stats[type].total++;
            if (success) {
                stats[type].successful++;
            } else {
                stats[type].failed++;
            }
            
            stats.lastUsed = Date.now();
            
            localStorage.setItem('qr-generator-stats', JSON.stringify(stats));
        } catch (error) {
            console.warn('Could not track QR generation:', error);
        }
    },
    
    // Get usage statistics
    getStats: function() {
        try {
            const saved = localStorage.getItem('qr-generator-stats');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Could not load QR stats:', error);
            return {};
        }
    },
    
    // Get most used QR type
    getMostUsedType: function() {
        const stats = this.getStats();
        let maxType = null;
        let maxCount = 0;
        
        Object.keys(stats).forEach(type => {
            if (type !== 'lastUsed' && stats[type].total > maxCount) {
                maxCount = stats[type].total;
                maxType = type;
            }
        });
        
        return maxType;
    }
};

// QR Code Error Helpers
const QRErrorHelpers = {
    // Format error message for user display
    formatErrorMessage: function(error, context = '') {
        if (!error) return 'Unbekannter Fehler';
        
        let message = '';
        
        if (typeof error === 'string') {
            message = error;
        } else if (error.message) {
            message = error.message;
        } else {
            message = 'Ein unerwarteter Fehler ist aufgetreten';
        }
        
        // Add context if provided
        if (context) {
            message = `${context}: ${message}`;
        }
        
        return message;
    },
    
    // Check if error is recoverable
    isRecoverableError: function(error) {
        if (!error) return false;
        
        const message = error.message || error.toString();
        
        // Network or temporary errors are usually recoverable
        const recoverablePatterns = [
            /network/i,
            /timeout/i,
            /temporary/i,
            /try again/i,
            /rate limit/i
        ];
        
        return recoverablePatterns.some(pattern => pattern.test(message));
    },
    
    // Get suggested action for error
    getSuggestedAction: function(error) {
        if (!error) return 'Seite neu laden und erneut versuchen';
        
        const message = error.message || error.toString();
        
        if (message.includes('size') || message.includes('too large')) {
            return 'Versuchen Sie kürzeren Text oder weniger Daten';
        }
        
        if (message.includes('invalid') || message.includes('ungültig')) {
            return 'Überprüfen Sie Ihre Eingaben auf Richtigkeit';
        }
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'Überprüfen Sie Ihre Internetverbindung';
        }
        
        if (this.isRecoverableError(error)) {
            return 'Einen Moment warten und erneut versuchen';
        }
        
        return 'Seite neu laden und erneut versuchen';
    }
};

// Export helpers for global access
window.QRValidationHelpers = QRValidationHelpers;
window.QRFormatHelpers = QRFormatHelpers;
window.QRDisplayHelpers = QRDisplayHelpers;
window.QRStorageHelpers = QRStorageHelpers;
window.QRAnalyticsHelpers = QRAnalyticsHelpers;
window.QRErrorHelpers = QRErrorHelpers;

// Utility function to safely call helper methods
function safeHelperCall(helperObject, methodName, ...args) {
    try {
        if (helperObject && typeof helperObject[methodName] === 'function') {
            return helperObject[methodName](...args);
        } else {
            console.warn(`Helper method ${methodName} not found`);
            return null;
        }
    } catch (error) {
        console.error(`Error calling helper method ${methodName}:`, error);
        return null;
    }
}

// Initialize helpers when document is ready
jQuery(document).ready(function() {
    console.log('QR Code Helpers loaded');
    
    // Auto-restore settings if available
    const savedSettings = QRStorageHelpers.loadSettings();
    if (savedSettings) {
        console.log('Loaded saved QR settings:', savedSettings);
    }
});