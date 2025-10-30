/**
 * Unit Tests for Logo Toggle Functionality
 *
 * Tests the LogoState module that manages enabling/disabling
 * automatic logo addition to canvases.
 *
 * Note: Logo state does NOT persist across sessions (no localStorage).
 * Logo always defaults to enabled on page load.
 */

const fs = require('fs');
const path = require('path');

describe('LogoState Module', () => {
  let LogoState;

  beforeEach(() => {
    // Load the logo-state.js module
    const logoStatePath = path.join(__dirname, '../../resources/js/logo-state.js');

    // Clear module cache if it exists
    delete require.cache[logoStatePath];

    // Execute logo-state.js to define LogoState
    const code = fs.readFileSync(logoStatePath, 'utf8');
    const func = new Function(code + '; return LogoState;');
    LogoState = func();

    // Also set it globally for good measure
    global.LogoState = LogoState;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('State Management', () => {
    it('should return true by default', () => {
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should enable logo when setLogoEnabled(true) is called', () => {
      LogoState.setLogoEnabled(false);
      LogoState.setLogoEnabled(true);
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should disable logo when setLogoEnabled(false) is called', () => {
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);
    });

    it('should NOT persist state (session-only)', () => {
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);

      // No localStorage should be set
      expect(typeof localStorage === 'undefined' || localStorage.getItem('bildgenerator-logo-enabled') === null).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should have an initialize method', () => {
      expect(typeof LogoState.initialize).toBe('function');
    });

    it('should always initialize with state enabled (default)', () => {
      LogoState.initialize();
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should reset to enabled after reinitialization', () => {
      // Set to disabled
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);

      // Simulate page refresh by reinitializing
      LogoState.initialize();

      // Should be back to enabled (no persistence)
      expect(LogoState.isLogoEnabled()).toBe(true);
    });
  });

  describe('Boolean Type Handling', () => {
    it('should handle boolean true value', () => {
      LogoState.setLogoEnabled(true);
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should handle boolean false value', () => {
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);
    });

    it('should handle truthy values', () => {
      LogoState.setLogoEnabled(1);
      expect(LogoState.isLogoEnabled()).toBe(true);

      LogoState.setLogoEnabled('true');
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should handle falsy values', () => {
      LogoState.setLogoEnabled(0);
      expect(LogoState.isLogoEnabled()).toBe(false);

      LogoState.setLogoEnabled('');
      expect(LogoState.isLogoEnabled()).toBe(false);

      LogoState.setLogoEnabled(null);
      expect(LogoState.isLogoEnabled()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid state changes', () => {
      LogoState.setLogoEnabled(true);
      LogoState.setLogoEnabled(false);
      LogoState.setLogoEnabled(true);
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);
    });

    it('should handle setting same state multiple times', () => {
      LogoState.setLogoEnabled(true);
      LogoState.setLogoEnabled(true);
      LogoState.setLogoEnabled(true);
      expect(LogoState.isLogoEnabled()).toBe(true);
    });

    it('should maintain in-memory state within session', () => {
      // Initial state
      expect(LogoState.isLogoEnabled()).toBe(true);

      // Disable
      LogoState.setLogoEnabled(false);
      expect(LogoState.isLogoEnabled()).toBe(false);

      // Should still be disabled (within same session)
      expect(LogoState.isLogoEnabled()).toBe(false);

      // Re-enable
      LogoState.setLogoEnabled(true);
      expect(LogoState.isLogoEnabled()).toBe(true);
    });
  });
});
