// Unified Alert System - Consolidates all alert functionality

const AlertSystem = {
    // Configuration
    config: {
        duration: 5000,
        fadeSpeed: 300,
        maxAlerts: 3
    },

    // Alert type configurations - Updated for consistency
    alertTypes: {
        success: {
            classes: 'bg-green-50 border-green-200 text-green-800',
            iconColor: 'text-green-500',
            icon: 'fas fa-check-circle'
        },
        warning: {
            classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconColor: 'text-yellow-500',
            icon: 'fas fa-exclamation-triangle'
        },
        danger: {
            classes: 'bg-red-50 border-red-200 text-red-800',
            iconColor: 'text-red-500',
            icon: 'fas fa-exclamation-circle'
        },
        error: {
            classes: 'bg-red-50 border-red-200 text-red-800',
            iconColor: 'text-red-500',
            icon: 'fas fa-exclamation-circle'
        },
        info: {
            classes: 'bg-blue-50 border-blue-200 text-blue-800',
            iconColor: 'text-blue-500',
            icon: 'fas fa-info-circle'
        }
    },

    // Get alert container
    getContainer() {
        let container = jQuery('.alert-container');
        if (container.length === 0) {
            // Create container if it doesn't exist
            container = jQuery('<div class="alert-container max-w-7xl mx-auto px-4 mt-4 hidden"></div>');
            jQuery('body').prepend(container);
        }
        return container;
    },

    // Show alert with enhanced styling
    show(message, type = 'info', options = {}) {
        const container = options.container ? jQuery(options.container) : this.getContainer();
        return this.showInContainer(message, type, container, options);
    },

    // Show alert in specific container
    showInContainer(message, type = 'info', container, options = {}) {
        const alertConfig = this.alertTypes[type] || this.alertTypes['info'];
        
        if (container.length === 0) {
            console.warn('Alert container not found');
            return null;
        }
        
        // Clear existing alerts if specified in options
        if (options.clearExisting) {
            container.empty();
        } else {
            // Limit number of alerts
            const existingAlerts = container.find('.alert');
            if (existingAlerts.length >= this.config.maxAlerts) {
                existingAlerts.first().remove();
            }
        }

        const alertHTML = `
            <div class="alert ${alertConfig.classes} border rounded-lg p-4 mb-4 shadow-sm fade-in flex items-start space-x-3" role="alert">
                <div class="flex-shrink-0">
                    <i class="${alertConfig.icon} ${alertConfig.iconColor}"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="flex-shrink-0">
                    <button type="button" class="text-gray-400 hover:text-gray-600 focus:outline-none alert-close-btn">
                        <span class="sr-only">Schließen</span>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        container.removeClass('hidden').append(alertHTML);
        
        // Get the newly added alert
        const newAlert = container.find('.alert').last();
        
        // Add click handler for close button
        newAlert.find('.alert-close-btn').on('click', () => {
            this.closeAlertInContainer(newAlert, container);
        });

        // Auto-remove after configured duration
        if (options.autoClose !== false) {
            setTimeout(() => {
                this.closeAlertInContainer(newAlert, container);
            }, options.duration || this.config.duration);
        }

        // Scroll into view if specified
        if (options.scrollIntoView) {
            this.scrollAlertIntoView(container);
        }

        return newAlert;
    },

    // Close specific alert
    closeAlert(alertElement) {
        const container = this.getContainer();
        this.closeAlertInContainer(alertElement, container);
    },

    // Close specific alert in container
    closeAlertInContainer(alertElement, container) {
        alertElement.fadeOut(this.config.fadeSpeed, () => {
            alertElement.remove();
            
            // Hide container if no more alerts
            if (container.find('.alert').length === 0) {
                container.addClass('hidden');
            }
        });
    },

    // Scroll alert into view - completely disabled
    scrollAlertIntoView(container) {
        // Auto-scroll removed completely
        return;
    },

    // Close all alerts
    closeAll() {
        const container = this.getContainer();
        container.find('.alert').fadeOut(this.config.fadeSpeed, function() {
            jQuery(this).remove();
        });
        setTimeout(() => {
            container.addClass('hidden');
        }, this.config.fadeSpeed);
    },

    // Specialized alert methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    },

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    },

    error(message, options = {}) {
        return this.show(message, 'error', options);
    },

    danger(message, options = {}) {
        return this.show(message, 'danger', options);
    },

    info(message, options = {}) {
        return this.show(message, 'info', options);
    },

    // QR-specific alert methods
    showQRAlert(message, type = 'info', options = {}) {
        const qrOptions = {
            container: '#qr-alert-container',
            clearExisting: true,
            scrollIntoView: true,
            ...options
        };
        
        // Show in QR container
        const qrAlert = this.showInContainer(message, type, jQuery('#qr-alert-container'), qrOptions);
        
        // Also show in main container for dual display
        const mainAlert = this.show(message, type, { autoClose: options.autoClose });
        
        return { qrAlert, mainAlert };
    },

    // Legacy support for existing code
    showTailwindAlert(message, type = 'info') {
        return this.show(message, type);
    }
};

// Global functions for backwards compatibility
function showAlert(message, type = 'danger') {
    return AlertSystem.show(message, type);
}

function showTailwindAlert(message, type = 'info') {
    return AlertSystem.show(message, type);
}

function showQRAlert(message, type = 'info') {
    return AlertSystem.showQRAlert(message, type);
}

// Make available globally
window.AlertSystem = AlertSystem;
window.showAlert = showAlert;
window.showTailwindAlert = showTailwindAlert;
window.showQRAlert = showQRAlert;

// Add CSS for fade-in animation
jQuery(document).ready(function() {
    if (!jQuery('#alert-system-styles').length) {
        jQuery('head').append(`
            <style id="alert-system-styles">
                .fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .alert-close-btn:hover {
                    opacity: 0.75;
                }
            </style>
        `);
    }
});