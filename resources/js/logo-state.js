/**
 * LogoState - Logo Enable/Disable State Management
 *
 * Manages the state of whether logos should be automatically added
 * to canvases. Logo is enabled by default and state does NOT persist across sessions.
 */

const LogoState = {
    // In-memory state - always starts as enabled
    _enabled: true,

    // Whether the region name on the logo bar is a transparent KNOCKOUT.
    // True is right on the plain green canvas: the letters show the green
    // behind them. Over a background photo it is wrong — the photo shows
    // through the letters and the name becomes unreadable. Then the name is
    // filled with the brand green instead, which matches the plain canvas and
    // stays legible over anything.
    _knockout: true,

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
     * Whether the region name is knocked out of the white bar.
     * @returns {boolean}
     */
    isKnockoutEnabled() {
        return this._knockout;
    },

    /**
     * Set the knockout mode (session only, does not persist).
     * @param {boolean} enabled - True for a transparent name, false for green
     */
    setKnockoutEnabled(enabled) {
        this._knockout = Boolean(enabled);
    },

    /**
     * Initialize logo state - always starts enabled
     * Call this on page load
     */
    initialize() {
        // Always start with logo enabled
        this._enabled = true;
        this._knockout = true;
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
