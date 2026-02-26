# Architecture

**Analysis Date:** 2025-02-26

## Pattern Overview

**Overall:** Client-side MVC with layered separation of concerns.

The GRÜNE Bildgenerator is a vanilla JavaScript application following a functional module architecture pattern. The application operates entirely in the browser with no backend dependencies. It uses **Fabric.js** for canvas manipulation, **jQuery** for DOM management, **Tailwind CSS** for styling, and a **4-step wizard** pattern for user workflow guidance.

**Key Characteristics:**
- Pure client-side (no server-side code or API calls)
- Module-based architecture with strict separation by responsibility
- Canvas-centric (Fabric.js) for all image manipulation and rendering
- State management through global variables (canvas, contentImage, logo, template, etc.)
- Event-driven UI with jQuery event delegation
- Layered approach: UI Layer → Logic Layer → Canvas Layer → Utility Layer

## Layers

**Presentation Layer (UI & Interaction):**
- Purpose: Handle user interface interactions, form inputs, and visual feedback
- Location: `index.html`, `resources/js/wizard.js`, `resources/js/handlers.js`, `resources/js/event-handlers.js`
- Contains: DOM manipulation, event listeners, UI state updates, wizard navigation, form handling
- Depends on: Logic Layer, Canvas Layer, Utility Layer
- Used by: Browser/user interactions

**Logic Layer (Business Rules):**
- Purpose: Implement core business logic for image generation, template management, validation
- Location: `resources/js/main.js`, `resources/js/initialization.js`, `resources/js/choice-image.js`, `resources/js/validation.js`, `resources/js/alert-system.js`
- Contains: Template processing, image processing, validation rules, state transitions, logo management
- Depends on: Canvas Layer, Constants Layer, Utility Layer
- Used by: Presentation Layer, Canvas Layer

**Canvas Layer (Fabric.js Wrapper):**
- Purpose: Encapsulate all Fabric.js canvas operations and canvas-specific utilities
- Location: `resources/js/canvas-utils.js`, `resources/js/modal.js` (export functionality)
- Contains: Canvas initialization, object manipulation, snapping, scaling, rotation, positioning logic
- Depends on: Constants Layer, Utility Layer
- Used by: Logic Layer, Presentation Layer

**QR Code Module (Specialized):**
- Purpose: Handle QR code generation and integration with canvas
- Location: `resources/js/qrcode/` (qrcode-generator.js, qrcode-handlers.js, qrcode-helpers.js, qrcode-wizard.js)
- Contains: QR code creation, styling, positioning, URL validation
- Depends on: Logic Layer, Canvas Layer, Constants Layer
- Used by: Presentation Layer, Canvas Layer

**Utility Layer (Helpers & Constants):**
- Purpose: Provide reusable utilities, constants, and helper functions
- Location: `resources/js/constants.js`, `resources/js/helpers.js`, `resources/js/logo-state.js`, `resources/js/searchable-select.js`, `resources/js/validation.js`
- Contains: App constants, validation functions, UI helpers, state management (logo), searchable select implementation
- Depends on: Nothing (Foundation layer)
- Used by: All other layers

**Styling Layer:**
- Purpose: Manage all visual presentation through CSS
- Location: `resources/css/` (output.css compiled from input.css via Tailwind), `resources/css/style.css`, `resources/css/fonts.css`
- Contains: Tailwind utilities, custom GRÜNE brand colors, custom styles, font definitions
- Depends on: Nothing (Foundation layer)
- Used by: HTML markup (index.html)

## Data Flow

**Image Creation Flow:**

1. **User selects template** via dropdown (`#canvas-template` change event)
2. → `EventHandlerUtils.setupMainAppHandlers()` triggers `replaceCanvas()`
3. → `replaceCanvas()` initializes Fabric.js canvas with template dimensions
4. → Logo automatically added if `LogoState.isLogoEnabled()` is true
5. → Canvas renders with background and borders based on template config

**Image Editing Flow:**

1. **User adds content** (text, image, QR code) via UI controls
2. → Event handler in `EventHandlerUtils.setupCanvasObjectHandlers()` captures input
3. → Handler calls `setValue()` to update active canvas object
4. → `canvas.renderAll()` re-renders the canvas
5. → UI state updated via `updateInputs()` if user selected different object

**Export Flow:**

1. **User clicks export** button (handled in modal.js)
2. → Validates canvas content
3. → Adjusts DPI for output quality
4. → Renders canvas to image
5. → Triggers browser download

**State Management:**

- **Global application state** stored in `main.js`: `canvas`, `contentImage`, `logo`, `logoName`, `template`, `contentRect`, `scaleMax`
- **Logo state** managed by `LogoState` module: in-memory boolean flag, session-only (no persistence)
- **UI state** managed through jQuery: active form controls sync with active canvas object via `updateInputs()`
- **Template state** stored in `TemplateConstants.TEMPLATES` object indexed by template key

## Key Abstractions

**Canvas Object:**
- Purpose: Fabric.js canvas instance managing all drawable elements
- Examples: `resources/js/main.js` (replaceCanvas), `resources/js/canvas-utils.js` (CanvasUtils methods)
- Pattern: Global singleton `canvas` variable, replaced on template changes

**Template Abstraction:**
- Purpose: Define canvas dimensions, borders, logos, and DPI for different output formats
- Examples: `resources/js/constants.js` (TemplateConstants.TEMPLATES)
- Pattern: Configuration object with keys like `story`, `post_45_border`, `event` containing width, height, border, topBorderMultiplier, logoTop, dpi

**ContentRect:**
- Purpose: Fabric.js Rect object representing the drawable content area within borders
- Examples: `resources/js/main.js` (replaceCanvas → contentRect initialization)
- Pattern: Created for each template based on border configuration; preserved for logo positioning calculations

**Logo Management:**
- Purpose: Handle automatic logo placement and text positioning on branded templates
- Examples: `resources/js/main.js` (addLogo), `resources/js/logo-state.js` (LogoState state machine)
- Pattern: Hierarchical sizing based on formula: `(contentRect.width + contentRect.height) / 10`; positioned based on border configuration

**Element Factory Pattern:**
- Purpose: Create Fabric.js text, image, and shape objects with consistent properties
- Examples: `resources/js/handlers.js` (text creation), `resources/js/choice-image.js` (image processing)
- Pattern: Functions return configured Fabric.js objects ready to be added to canvas

## Entry Points

**Application Bootstrap (`resources/js/initialization.js`):**
- Location: `resources/js/initialization.js`
- Triggers: jQuery document ready
- Responsibilities: Waits for Fabric.js library to load, calls `initializeApplication()` from main.js
- Pattern: Dependency-aware initialization that polls for Fabric.js before proceeding

**Main Application Initialization (`resources/js/main.js` → `initializeApplication()`):**
- Location: `resources/js/main.js`
- Triggers: Called from initialization.js after Fabric.js loads
- Responsibilities: Initialize wizard, set up canvas, load event handlers, preload fonts
- Pattern: Single entry point coordinating all subsystem initialization

**Wizard System (`resources/js/wizard.js` → `initializeWizard()`):**
- Location: `resources/js/wizard.js`
- Triggers: Called from `initializeApplication()`
- Responsibilities: Set up 4-step wizard navigation, step validation, advanced options, QR sections
- Pattern: Manages currentStep state, validates input before step transition

**Event Binding (`resources/js/event-handlers.js` → `setupMainAppHandlers()` and `setupCanvasObjectHandlers()`):**
- Location: `resources/js/event-handlers.js`
- Triggers: Called from initialization flow
- Responsibilities: Bind jQuery event listeners to UI controls, canvas changes, object selection
- Pattern: Centralized `EventHandlerUtils` object with batch binding capability

**Tab Navigation (`index.html`):**
- Location: `index.html` (buttons with id `tab-generator`, `tab-qrcode`)
- Triggers: Button clicks
- Responsibilities: Switch between Image Generator and QR Code Generator tabs
- Pattern: jQuery delegated event handling for tab switching

## Error Handling

**Strategy:** Defensive programming with console logging and user-facing alerts.

**Patterns:**

- **Validation-First Approach**: `ValidationUtils` methods check inputs before processing
  - `ValidationUtils.isValidImage(fileType)` validates file types
  - `ValidationUtils.isValidImageFile(file)` validates file size and type
  - `validateStep1()`, `validateStep2()` etc. validate wizard steps before progression

- **Graceful Degradation**: Functions check for undefined/null before proceeding
  - Example: `replaceCanvas()` checks `if (canvas)` before disposing
  - Example: `CanvasUtils.enableSnap()` checks `if (!target || typeof target.getCenterPoint !== 'function')`

- **User Alerts**: `AlertSystem` provides visual feedback for errors
  - Example: `showAlert('Error! Invalid Image')` displays error messages
  - Alerts stack up to 3 visible messages, fade automatically after 3 seconds

- **Console Logging**: Debug logs throughout for troubleshooting
  - Example: `console.log('[replaceCanvas] Initializing canvas features')`

- **Fallback Values**: Default values prevent crashes
  - Example: `if (!snapZone) snapZone = canvasInstance.width / AppConstants.CANVAS.SNAP_ZONE_RATIO`

## Cross-Cutting Concerns

**Logging:** Console logging for debugging (development mode) and error tracking.
- Framework: Native `console` object
- Pattern: Prefixed logs with function names in brackets `[functionName]` for easy filtering
- No persistent logging infrastructure (browser console only)

**Validation:** Centralized `ValidationUtils` module.
- Pattern: All input validation (images, files, step requirements) flows through this module
- Location: `resources/js/validation.js`
- Prevents invalid state by validating before processing

**Authentication:** Not applicable (client-side only, no backend)

**Canvas State:** Global variables in `main.js` maintain canvas instance and related objects.
- Pattern: Singleton canvas, reset on template change via `replaceCanvas()`
- Coordination: `EventHandlerUtils` bridges UI state and canvas state via `updateInputs()` and `setValue()`

**Font Loading:** Asynchronous font preloading via FontFaceObserver.
- Pattern: Fonts preloaded in `preloadFonts()` during wizard initialization
- Fallback: System fonts used if custom fonts fail to load
- Location: `resources/js/wizard.js`

**Responsive Design:** Canvas scales to container width maintaining aspect ratio.
- Pattern: `jQuery(window).on('resize.canvas', resizeCanvas)` adjusts canvas display size
- Calculation: `container width × (template height / template width) = display height`
- Actual canvas dimensions remain constant (1080px, 1920px, etc.) for export quality

---

*Architecture analysis: 2025-02-26*
