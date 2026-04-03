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
        BACKGROUND_PRIMARY: "#257639",
        BACKGROUND_SECONDARY: "#257639",
        PINK_CIRCLE: "rgb(225,0,120)",
        LOGO_TEXT: "#257639",
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
        TEXT_SCALE_LONG: 4.8,
        TEXT_SCALE_SHORT: 6,
        MAX_TEXT_LENGTH: 16,
        LINE_HEIGHT: 0.8,
        ANGLE: -5.5,
        WIDTH_SCALE: 0.95,
        // Bar text positioning - use WIDTH as reference since it's constant
        BAR_OFFSET_FROM_TOP: 0.90, // Text starts at 90% of logo WIDTH from logo top
        // Automatic positioning configuration
        BORDERLESS_MARGIN_PERCENT: 0.02, // For borderless templates: logo bottom margin as percentage of canvas height (2%)
        FILES: {
            LONG: "Logo-zweizeilig_blanko.png",
            SHORT: "Logo-einzeilig_blanko.png"
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
        feed_post_45: {
            width: 1080, height: 1350, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163,
        },
        story: {
            width: 1080, height: 1920, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163,
        },
        event: {
            width: 1920, height: 1005, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163,
        },
        facebook_header: {
            width: 820, height: 360, topBorderMultiplier: 1, border: 0, dpi: 150, logoWidth: 163,
        },
        a4: {
            width: 2480, height: 3508, topBorderMultiplier: 1, border: 0, dpi: 250, logoWidth: 374,
        },
        a4_quer: {
            width: 3508, height: 2480, topBorderMultiplier: 1, border: 0, dpi: 250, logoWidth: 374,
        },
        a5: {
            width: 1748, height: 2480, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 319,
        },
        a5_quer: {
            width: 2480, height: 1748, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 319,
        },
        a6: {
            width: 1240, height: 1748, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 224,
        },
        a6_quer: {
            width: 1748, height: 1240, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 224,
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