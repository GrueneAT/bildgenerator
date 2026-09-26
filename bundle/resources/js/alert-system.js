// Unified Alert System - DS v2.2 .gat-toast / .gat-toaster + inline .gat-callout
//
// - Toaster (top-fixed global container) -> .gat-toaster with .gat-toast children
// - Inline alert containers (e.g. #qr-alert-container) -> .gat-callout
//
// Legacy hooks preserved for tests and back-compat:
// - container still accessible via .app-alert-container selector
// - rendered alert nodes still carry the .alert class

const AlertSystem = {
    // Configuration
    config: {
        duration: 5000,
        fadeSpeed: 300,
        maxAlerts: 3
    },

    // Map legacy alert types to DS v2.2 .gat-toast--* variants
    // and DS v2.1 .gat-callout--* variants (for inline qr-alert container).
    alertTypes: {
        success: { toast: 'gat-toast--success', callout: 'gat-callout--success', icon: 'fas fa-check-circle' },
        warning: { toast: 'gat-toast--warn',    callout: 'gat-callout--warn',    icon: 'fas fa-exclamation-triangle' },
        warn:    { toast: 'gat-toast--warn',    callout: 'gat-callout--warn',    icon: 'fas fa-exclamation-triangle' },
        danger:  { toast: 'gat-toast--error',   callout: 'gat-callout--error',   icon: 'fas fa-exclamation-circle' },
        error:   { toast: 'gat-toast--error',   callout: 'gat-callout--error',   icon: 'fas fa-exclamation-circle' },
        info:    { toast: 'gat-toast--info',    callout: 'gat-callout--info',    icon: 'fas fa-info-circle' }
    },

    // Get the global toast region (.gat-toaster). Reuses the legacy
    // .app-alert-container element if it is in the DOM so existing
    // markup/tests keep working.
    getContainer() {
        let container = jQuery('.gat-toaster').first();
        if (container.length === 0) {
            const legacy = jQuery('.app-alert-container').first();
            if (legacy.length) {
                legacy.addClass('gat-toaster').removeClass('hidden');
                container = legacy;
            } else {
                container = jQuery('<div class="gat-toaster app-alert-container" role="region" aria-live="polite" aria-label="Benachrichtigungen"></div>');
                jQuery('body').append(container);
            }
        }
        return container;
    },

    // Show alert with enhanced styling
    show(message, type = 'info', options = {}) {
        const container = options.container ? jQuery(options.container) : this.getContainer();
        return this.showInContainer(message, type, container, options);
    },

    // Show alert in specific container.
    // - .gat-toaster region -> render as .gat-toast (fixed corner)
    // - any other container -> render as inline .gat-callout
    showInContainer(message, type = 'info', container, options = {}) {
        const alertConfig = this.alertTypes[type] || this.alertTypes['info'];

        if (container.length === 0) {
            console.warn('Alert container not found');
            return null;
        }

        const isToastRegion = container.hasClass('gat-toaster') || container.hasClass('app-alert-container');

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

        const alertHTML = isToastRegion
            ? `
                <div class="gat-toast ${alertConfig.toast} alert" role="alert">
                    <span class="gat-toast__icon" aria-hidden="true">
                        <i class="${alertConfig.icon}"></i>
                    </span>
                    <div class="gat-toast__body">${message}</div>
                    <button type="button" class="gat-toast__close alert-close-btn" aria-label="Schließen">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            `
            : `
                <div class="gat-callout ${alertConfig.callout} alert" role="alert">
                    <div class="gat-callout__body">${message}</div>
                    <button type="button" class="gat-callout__close alert-close-btn" aria-label="Schließen">
                        <span aria-hidden="true">&times;</span>
                    </button>
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

            // Hide container if no more alerts (only for inline containers;
            // .gat-toaster is fixed-positioned and harmless when empty)
            if (container.find('.alert').length === 0 && !container.hasClass('gat-toaster')) {
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
        if (!container.hasClass('gat-toaster')) {
            setTimeout(() => {
                container.addClass('hidden');
            }, this.config.fadeSpeed);
        }
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

        // Show inline in QR container as .gat-callout
        const qrAlert = this.showInContainer(message, type, jQuery('#qr-alert-container'), qrOptions);

        // Also show in global toaster region for dual display
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
