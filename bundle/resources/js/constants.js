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
        DEFAULT_TEXT: "Gotham Narrow Ultra Italic",
        PRELOAD_FONTS: [
            'Gotham Narrow Ultra Italic',
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
        FILES: {
            LONG: "Gruene_Logo_245_268.png",
            SHORT: "Gruene_Logo_245_248.png",
            SMALL_LONG: "Gruene_Logo_120_131.png",
            SMALL_SHORT: "Gruene_Logo_120_121.png"
        }
    }
};

// Template configurations
const TemplateConstants = {
    TEMPLATES: {
        story: {
            width: 1080,
            height: 1920,
            topBorderMultiplier: 2,
            border: 10,
            logoTop: 0.83,
            logoTextTop: 0.9423,
            dpi: 200,
        },
        post: {
            width: 1080,
            height: 1080,
            topBorderMultiplier: 1,
            border: 20,
            logoTop: 0.79,
            logoTextTop: 0.948,
            dpi: 200,
        },
        post_45: {
            width: 1080,
            height: 1350,
            topBorderMultiplier: 1,
            border: 20,
            logoTop: 0.815,
            logoTextTop: 0.959,
            dpi: 200,
        },
        event: {
            width: 1200,
            height: 628,
            topBorderMultiplier: 1,
            border: 20,
            logoTop: 0.678,
            logoTextTop: 0.9,
            dpi: 200,
        },
        facebook_header: {
            width: 1958,
            height: 745,
            topBorderMultiplier: 1,
            border: 20,
            logoTop: 0.6,
            logoTextTop: 0.872,
            dpi: 150,
        },
        a2: {
            width: 4961,
            height: 7016,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.804,
            logoTextTop: 0.929,
            dpi: 150,
        },
        a2_quer: {
            width: 7016,
            height: 4961,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.694,
            logoTextTop: 0.856,
            dpi: 150,
        },
        a3: {
            width: 3508,
            height: 4961,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.804,
            logoTextTop: 0.929,
            dpi: 200,
        },
        a3_quer: {
            width: 4961,
            height: 3508,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.694,
            logoTextTop: 0.856,
            dpi: 200,
        },
        a4: {
            width: 2480,
            height: 3508,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.804,
            logoTextTop: 0.929,
            dpi: 250,
        },
        a4_quer: {
            width: 3508,
            height: 2480,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.694,
            logoTextTop: 0.856,
            dpi: 250,
        },
        a5: {
            width: 1748,
            height: 2480,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.804,
            logoTextTop: 0.929,
            dpi: 300,
        },
        a5_quer: {
            width: 2480,
            height: 1748,
            topBorderMultiplier: 1,
            border: 10,
            logoTop: 0.694,
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