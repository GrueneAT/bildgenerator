// Unified Alert System - Consolidates all alert functionality

const AlertSystem = {
    // Configuration
    config: {
        duration: 5000,
        fadeSpeed: 300,
        maxAlerts: 3
    },

    // Alert type configurations
    alertTypes: {
        success: {
            classes: 'bg-green-100 border-green-400 text-green-700',
            icon: 'fas fa-check-circle'
        },
        warning: {
            classes: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            icon: 'fas fa-exclamation-triangle'
        },
        danger: {
            classes: 'bg-red-100 border-red-400 text-red-700',
            icon: 'fas fa-exclamation-circle'
        },
        error: {
            classes: 'bg-red-100 border-red-400 text-red-700',
            icon: 'fas fa-exclamation-circle'
        },
        info: {
            classes: 'bg-blue-100 border-blue-400 text-blue-700',
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
        const alertConfig = this.alertTypes[type] || this.alertTypes['info'];
        const container = this.getContainer();
        
        // Limit number of alerts
        const existingAlerts = container.find('.alert');
        if (existingAlerts.length >= this.config.maxAlerts) {
            existingAlerts.first().remove();
        }

        const alertHTML = `
            <div class="alert ${alertConfig.classes} border px-4 py-3 rounded-md mb-4 shadow fade-in" role="alert">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="${alertConfig.icon}"></i>
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

        container.removeClass('hidden').append(alertHTML);
        
        // Get the newly added alert
        const newAlert = container.find('.alert').last();
        
        // Add click handler for close button
        newAlert.find('.alert-close-btn').on('click', () => {
            this.closeAlert(newAlert);
        });

        // Auto-remove after configured duration
        if (options.autoClose !== false) {
            setTimeout(() => {
                this.closeAlert(newAlert);
            }, options.duration || this.config.duration);
        }

        return newAlert;
    },

    // Close specific alert
    closeAlert(alertElement) {
        alertElement.fadeOut(this.config.fadeSpeed, () => {
            alertElement.remove();
            
            // Hide container if no more alerts
            const container = this.getContainer();
            if (container.find('.alert').length === 0) {
                container.addClass('hidden');
            }
        });
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

// Make available globally
window.AlertSystem = AlertSystem;
window.showAlert = showAlert;
window.showTailwindAlert = showTailwindAlert;

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