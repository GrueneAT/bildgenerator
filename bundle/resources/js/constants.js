// Application Constants - Centralized configuration

const AppConstants = {
    // File handling
    FILE: {
        FILENAME_LENGTH: 6,
        MAX_SIZE_MB: 10,
        VALID_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    },

    // UI Configuration
    UI: {
        ALERT_DURATION: 3000,
        ALERT_FADE_SPEED: 300,
        MAX_ALERTS: 3,
        WIZARD_TOTAL_STEPS: 4
    },

    // Canvas Configuration
    CANVAS: {
        SCALE_MAX_MULTIPLIER: 0.002,
        SNAP_ZONE_RATIO: 20, // canvas.width / 20
        TARGET_FIND_TOLERANCE: 15,
        CORNER_SIZE_MULTIPLIER: 0.03,
        BORDER_SCALE_FACTOR: 2,
        PADDING: 4,
        ROTATION_SNAP_TOLERANCE: 2, // degrees
        ROTATION_SNAP_ANGLES: [0, 90, 180, 270]
    },

    // Export Configuration
    EXPORT: {
        DEFAULT_DPI: 200,
        SCREEN_DPI: 72,
        MAX_PIXELS: 250000000, // 250MP browser limit
        QR_MIN_SIZE: 512,
        QR_MAX_SIZE: 2048,
        QR_BORDER_PERCENT: 0.05
    },

    // Element Scaling
    SCALING: {
        TEXT_DEFAULT_WIDTH_RATIO: 0.8,
        TEXT_DEFAULT_HEIGHT_RATIO: 0.5,
        IMAGE_DEFAULT_WIDTH_RATIO: 0.5,
        IMAGE_DEFAULT_HEIGHT_RATIO: 0.4,
        QR_DEFAULT_WIDTH_RATIO: 0.25,
        QR_DEFAULT_HEIGHT_RATIO: 0.25,
        CIRCLE_DEFAULT_WIDTH_RATIO: 0.3,
        CIRCLE_DEFAULT_HEIGHT_RATIO: 0.3,
        CROSS_DEFAULT_WIDTH_RATIO: 0.4,
        CROSS_DEFAULT_HEIGHT_RATIO: 0.3
    },

    // Circle Clip Sizes
    CIRCLE_SIZES: {
        LARGE: { value: 2, percentage: 0.9 },
        MEDIUM: { value: 3, percentage: 0.7 },
        SMALL: { value: 4, percentage: 0.5 }
    },

    // Colors
    COLORS: {
        BACKGROUND_PRIMARY: "rgba(138, 180, 20)",
        BACKGROUND_SECONDARY: "rgba(83,132,48)",
        PINK_CIRCLE: "rgb(225,0,120)",
        LOGO_TEXT: "rgb(255,255,255)",
        TEXT_STROKE: "#000000",
        CORNER_COLOR: "yellow",
        BORDER_COLOR: "rgba(88,42,114)",
        CORNER_STROKE: "#000000"
    },

    // Font Configuration
    FONTS: {
        DEFAULT_LOGO: "Gotham Narrow Bold",
        DEFAULT_TEXT: "Gotham Narrow Ultra",
        PRELOAD_FONTS: [
            'Gotham Narrow Ultra Italic',
            'Gotham Narrow Ultra',
            'Gotham Narrow Book',
            'Gotham Narrow Bold'
        ]
    },

    // Logo Configuration
    LOGO: {
        SCALE_RATIO: 10, // (contentRect.width + contentRect.height) / 10
        TEXT_SCALE_LONG: 4.8,
        TEXT_SCALE_SHORT: 6,
        MAX_TEXT_LENGTH: 16,
        LINE_HEIGHT: 0.8,
        ANGLE: -5.5,
        WIDTH_SCALE: 0.95,
        // Pink bar text positioning - use WIDTH as reference since it's constant (245px)
        // Original single-line positioning: 248px * 0.89 = 220.72px from top
        // Converted to width ratio: 220.72 / 245 = 0.90
        PINK_BAR_OFFSET_FROM_TOP: 0.90, // Text starts at 90% of logo WIDTH from logo top
        // Automatic positioning configuration
        BORDER_CUT_RATIO: 0.91, // For bordered templates: border cuts at 91% of logo height (through pink bar center)
        BORDERLESS_MARGIN_PERCENT: 0.02, // For borderless templates: logo bottom margin as percentage of canvas height (2%)
        FILES: {
            LONG: "Gruene_Logo_245_268.png",
            SHORT: "Gruene_Logo_245_248.png",
            SMALL_LONG: "Gruene_Logo_120_131.png",
            SMALL_SHORT: "Gruene_Logo_120_121.png"
        }
    }
};

// Template configurations
// NOTE: logoTop values are now automatically calculated based on border configuration
// - Bordered templates (border > 0): Border cuts through pink bar at 91% of logo height
// - Borderless templates (border = 0): Logo positioned with 2% margin from canvas bottom
// The logoTop values below are kept for reference but not used in calculations
const TemplateConstants = {
    TEMPLATES: {
        story: {
            width: 1080,
            height: 1920,
            topBorderMultiplier: 2,
            border: 10,
            logoTop: 0.8305,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.9423,
            dpi: 200,
        },
        post_45_border: {
            width: 1080,
            height: 1350,
            topBorderMultiplier: 1,
            border: 20,
            logoTop: 0.8151,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.959,
            dpi: 200,
        },
        post_45_no_border: {
            width: 1080,
            height: 1350,
            topBorderMultiplier: 1,
            border: 0,
            logoTop: 0.7988,  // 25.6px margin (matches post_45_border)
            logoTextTop: 0.959,
            dpi: 200,
        },
        event: {
            width: 1920,
            height: 1005,
            topBorderMultiplier: 1,
            border: 0,
            logoTop: 0.6799,  // 25.6px margin (matches post_45_border)
            logoTextTop: 0.9449,
            dpi: 200,
        },
        facebook_header: {
            width: 820,
            height: 360,
            topBorderMultiplier: 1,
            border: 0,
            logoTop: 0.5971,  // 25.6px margin (matches post_45_border)
            logoTextTop: 0.8462,
            dpi: 150,
        },
        a2: {
            width: 4961,
            height: 7016,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.8034,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.929,
            dpi: 150,
        },
        a2_quer: {
            width: 7016,
            height: 4961,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.6952,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.856,
            dpi: 150,
        },
        a3: {
            width: 3508,
            height: 4961,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.8034,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.929,
            dpi: 200,
        },
        a3_quer: {
            width: 4961,
            height: 3508,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.6952,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.856,
            dpi: 200,
        },
        a4: {
            width: 2480,
            height: 3508,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.8035,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.929,
            dpi: 250,
        },
        a4_quer: {
            width: 3508,
            height: 2480,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.6952,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.856,
            dpi: 250,
        },
        a5: {
            width: 1748,
            height: 2480,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.8038,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.929,
            dpi: 300,
        },
        a5_quer: {
            width: 2480,
            height: 1748,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.6945,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.856,
            dpi: 300,
        },
        a6: {
            width: 1240,
            height: 1748,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.8038,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.929,
            dpi: 300,
        },
        a6_quer: {
            width: 1748,
            height: 1240,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.6945,  // Border cuts through pink bar (87.3% of logo height)
            logoTextTop: 0.856,
            dpi: 300,
        },
    },

    // Get template by name
    getTemplate(templateName) {
        return this.TEMPLATES[templateName] || null;
    },

    // Get current template
    getCurrentTemplate() {
        const templateName = jQuery("#canvas-template").find(":selected").attr("value");
        return this.getTemplate(templateName);
    }
};

// Legacy support - keep the old template_values for backwards compatibility
const template_values = TemplateConstants.TEMPLATES;

// Helper function for backwards compatibility
function currentTemplate() {
    return TemplateConstants.getCurrentTemplate();
}

// Make available globally
window.AppConstants = AppConstants;
window.TemplateConstants = TemplateConstants;
window.template_values = template_values;
window.currentTemplate = currentTemplate;