/**
 * LogoState - Logo Enable/Disable State Management
 *
 * Manages the state of whether logos should be automatically added
 * to canvases. Logo is enabled by default and state does NOT persist across sessions.
 */

const LogoState = {
    // In-memory state - always starts as enabled
    _enabled: true,

    /**
     * Check if logo feature is enabled
     * @returns {boolean} True if logo should be added to canvas
     */
    isLogoEnabled() {
        return this._enabled;
    },

    /**
     * Set logo enabled state (session only, does not persist)
     * @param {boolean} enabled - True to enable logo, false to disable
     */
    setLogoEnabled(enabled) {
        this._enabled = Boolean(enabled);
    },

    /**
     * Initialize logo state - always starts enabled
     * Call this on page load
     */
    initialize() {
        // Always start with logo enabled
        this._enabled = true;
    }
};

// Make LogoState available globally
if (typeof window !== 'undefined') {
    window.LogoState = LogoState;
}

// Also export for Node.js testing
if (typeof global !== 'undefined') {
    global.LogoState = LogoState;
}
