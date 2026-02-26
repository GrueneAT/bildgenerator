# Codebase Concerns

**Analysis Date:** 2026-02-26

## Tech Debt

**jQuery Deprecated Methods:**
- Issue: `jQuery.delegate()` is deprecated and removed in newer versions
- Files: `resources/js/choice-image.js:3`
- Impact: Will break with jQuery > 3.x migration
- Fix approach: Replace `jQuery('.memes-container').delegate('img', 'click', ...)` with event delegation using `.on()` method directly on the container or use event bubbling

**Excessive Temporary setTimeout Calls:**
- Issue: Multiple scattered `setTimeout()` calls used for timing coordination instead of event-driven architecture
- Files: `resources/js/wizard.js` (7+ instances), `resources/js/main.js` (2 instances), `resources/js/alert-system.js`, `resources/js/qrcode/*`
- Impact: Race conditions in slow environments, unpredictable timing, difficult to debug
- Fix approach: Replace timing-dependent code with proper event listeners. Examples:
  - `setTimeout(() => updateCanvasDimensions(), 50)` → use `canvas.on('object:added', ...)` or similar events
  - `setTimeout(() => restoreSelectedOrganization(), 100)` → wait for DOM ready events
  - Logo loading waits: Use `fabric.Image.fromURL` callback instead of setTimeout

**Global State Pollution:**
- Issue: Multiple global variables maintain application state without encapsulation
- Files: `resources/js/main.js:2-8` (canvas, contentRect, contentImage, logo, logoName, scaleMax, template)
- Impact: Namespace collisions, hard to test, potential for state inconsistencies
- Fix approach: Encapsulate into a single AppState object or module pattern

**Unhandled Promise Rejections:**
- Issue: AJAX calls and FileReader operations don't always handle errors properly
- Files: `resources/js/main.js:401-411` (jQuery.getJSON with basic .fail() callback), `resources/js/choice-image.js:26-44`
- Impact: Silent failures without user visibility in some cases
- Fix approach: Wrap all async operations with try-catch or comprehensive error callbacks

## Known Bugs

**Canvas Function Reference Bug:**
- Issue: `currentTemplate()` called as function but defined as const property in TemplateConstants
- Files: `resources/js/main.js:204`, `resources/js/wizard.js:252-253`
- Trigger: When canvas template changes or dimensions are updated
- Impact: May fail if function doesn't exist, causing logo positioning to break
- Workaround: Check if `currentTemplate` is a function before calling

**Logo Positioning Race Condition:**
- Issue: Logo added to canvas before container layout is calculated
- Files: `resources/js/main.js:85-86`, `resources/js/main.js:188-261`
- Trigger: When canvas is replaceCanvas() with logo enabled
- Impact: Logo may be positioned incorrectly on first load if canvas dimensions not yet calculated
- Workaround: Manual re-triggering of logo positioning, or reload page

**Window Resize Event Memory Leak:**
- Issue: Multiple `.on('resize.canvas', ...)` bindings added without cleanup
- Files: `resources/js/main.js:40` uses `.off("resize.canvas").on(...)` but called from replaceCanvas
- Impact: After template changes, multiple resize handlers may be bound
- Fix approach: Ensure `.off()` is called before each `.on()` (already partially done but verify)

## Security Considerations

**User-Supplied Data in DOM via String Interpolation:**
- Risk: Logo text from user input inserted into canvas via `logoText` variable could contain malicious content
- Files: `resources/js/main.js:150-152`, `resources/js/main.js:220-233`
- Current mitigation: Text is only rendered on canvas (Fabric.js), not in HTML. File upload validates file type only
- Recommendations:
  - Validate file size on client side (`AppConstants.FILE.MAX_SIZE_MB`)
  - Consider rejecting unusual Unicode characters in logo text
  - Sanitize any user input before passing to Fabric.js

**File Upload Validation Insufficient:**
- Risk: Only MIME type checked, file extension not validated
- Files: `resources/js/choice-image.js:21`, `resources/js/validation.js:4-14`
- Current mitigation: Browser FileReader prevents actual code execution
- Recommendations: Also validate file extension, add file size check before processing

**No Content Security Policy:**
- Risk: External scripts loaded without CSP header
- Files: Various vendor libraries loaded in `index.html`
- Current mitigation: All scripts are local or from trusted CDNs (FontAwesome)
- Recommendations: Add CSP header to prevent script injection attacks

**Data URL Potential XSS:**
- Risk: User-uploaded images converted to data URLs without sanitization
- Files: `resources/js/choice-image.js:44` (readAsDataURL)
- Current mitigation: Data URLs are only used for canvas rendering, not HTML insertion
- Recommendations: Continue limiting data URL usage to canvas only; monitor for DOM manipulation

## Performance Bottlenecks

**Excessive Console Logging in Production:**
- Problem: 63+ console.log() statements scattered throughout code
- Files: `resources/js/canvas-utils.js` (heavy logging for snap functions), `resources/js/main.js`, `resources/js/wizard.js`
- Cause: Debug logging left in production code
- Improvement path:
  - Create debug flag in AppConstants
  - Wrap all console statements with `if (DEBUG_MODE) console.log(...)`
  - Example: `resources/js/canvas-utils.js:76` has styled console.log for snap operations

**Large Vendor Bundle Size:**
- Problem: Entire Fabric.js library (8777+ lines) bundled even for small use cases
- Files: `vendors/fabric-js/fabric.js`
- Cause: Full library included; only canvas operations used
- Improvement path: Consider lighter canvas library or tree-shake unused Fabric.js features

**DOM Querying in Loops:**
- Problem: Potential repeated DOM selectors in event handlers
- Files: `resources/js/wizard.js:141-176` (updateStepIndicators loops with jQuery selectors)
- Cause: Querying DOM for each indicator in loop
- Improvement path: Cache jQuery collections before loop or use data attributes

**Synchronous Font Loading:**
- Problem: FontFaceObserver.load() may block rendering if fonts unavailable
- Files: `resources/js/wizard.js:21-35` (preloadFonts)
- Cause: Font loading in synchronous context
- Improvement path: Use `font-display: swap` in @font-face, ensure fonts load asynchronously

**Image Rendering Without Dimensions Check:**
- Problem: Fabric.Image.fromURL loads full-size images without dimensions check
- Files: `resources/js/main.js:188-261` (addLogo), `resources/js/main.js:325-341` (processMeme)
- Cause: No image dimension or file size validation before rendering
- Improvement path: Check image dimensions before adding to canvas; warn if excessively large

## Fragile Areas

**Logo System Complex Logic:**
- Files: `resources/js/main.js:103-261` (calculateLogoTop, addLogo functions)
- Why fragile:
  - Multiple conditional branches for logo variants (long/short, bordered/borderless)
  - Hard-coded percentages and magic numbers (PINK_BAR_OFFSET_FROM_TOP: 0.90, BORDER_CUT_RATIO: 0.91)
  - Font size calculated from logo width: `Math.floor(image.getScaledWidth() / 10)`
  - Text positioning depends on multiple interdependent calculations
  - Line breaking logic uses string length thresholds (line 238: `if (linebreak > 17 || logoText.length - linebreak > 17)`)
- Safe modification:
  - Add comprehensive unit tests for each logo variant combination
  - Extract magic numbers to named constants in `AppConstants.LOGO`
  - Add visual regression tests for each template/logo combination
  - Document logo positioning calculations with visual diagrams
- Test coverage: Limited - no unit tests for logo positioning logic

**Canvas Snapping/Rotation Snap:**
- Files: `resources/js/canvas-utils.js:65-206` (enableSnap, enableRotationSnap)
- Why fragile:
  - Snap logic depends on object center point calculations
  - Rotation snap has multiple angle edge cases
  - Protected objects (logo, contentImage) hardcoded in snap logic
  - Snap zones use magic ratio: `canvas.width / 20`
- Safe modification:
  - Test snap behavior with different object types and sizes
  - Verify snap doesn't interfere with text editing
  - Monitor performance with many objects
- Test coverage: Present but could be expanded (visual regression tests exist)

**Wizard Step Navigation:**
- Files: `resources/js/wizard.js:6-430`
- Why fragile:
  - Hard-coded step numbers (1-4) throughout file
  - UI state managed through jQuery class manipulation
  - Step transitions don't validate intermediate state consistently
  - Mobile and desktop indicators must stay synchronized
- Safe modification:
  - Centralize step count in constant
  - Use data attributes instead of ID-based selectors
  - Add validation before each step transition
- Test coverage: Limited visual tests, no unit tests for validation logic

**QR Code Generation:**
- Files: `resources/js/qrcode/qrcode-generator.js` (484 lines), `resources/js/qrcode/qrcode-handlers.js` (348 lines)
- Why fragile:
  - Complex state management for QR code generation
  - Multiple format and encoding options
  - Error handling spread across multiple files
  - Dependencies on external QRCode.js library
- Safe modification: Comprehensive E2E tests in place
- Test coverage: Visual regression tests exist for QR codes

**Event Handler Binding Pattern:**
- Files: `resources/js/event-handlers.js` (setupCanvasObjectHandlers, setupMainAppHandlers)
- Why fragile:
  - Many handlers assume canvas/objects already initialized
  - Handlers use jQuery selector strings as keys (magic strings)
  - No validation that DOM elements exist before binding
- Safe modification:
  - Add existence checks before binding handlers
  - Use DOM delegation to prevent binding errors if elements don't exist
  - Consider event emitter pattern instead of direct jQuery binding

## Scaling Limits

**Canvas Size Limitations:**
- Current capacity: Tested up to 250MP (AppConstants.EXPORT.MAX_PIXELS)
- Limit: Browser memory/canvas 2D context limitations
- Scaling path: Monitor memory usage with large templates; consider server-side rendering for poster sizes (A2+)

**Logo File Count:**
- Current capacity: Hundreds of logo files across three directories (gemeinden, bundeslaender, domains)
- Limit: JSON index file size and select dropdown rendering performance
- Scaling path:
  - Implement lazy loading for logo categories
  - Use virtual scrolling in searchable-select for large lists
  - Consider paginated API endpoint if count exceeds 1000

**Image Upload Handling:**
- Current capacity: 10MB file size limit (AppConstants.FILE.MAX_SIZE_MB)
- Limit: Browser FileReader memory for data URL conversion
- Scaling path: Consider Canvas or Blob-based approach for very large images; add progress indicator

## Dependencies at Risk

**jQuery Deprecation:**
- Risk: jQuery 3.7+ removed `.delegate()` method; application uses deprecated jQuery methods
- Impact: Code will break on jQuery major version upgrade
- Migration plan:
  1. Replace `.delegate()` with `.on()` for event delegation
  2. Audit all jQuery for other deprecated methods
  3. Consider migration to vanilla JavaScript or minimal jQuery wrapper

**Fabric.js Version:**
- Risk: Currently using older Fabric.js in vendors; library has abandoned versions
- Impact: Security vulnerabilities, missing features, poor performance
- Migration plan: Evaluate feasibility of upgrading Fabric.js; test compatibility with existing canvas manipulations

**FontFaceObserver:**
- Risk: Small third-party library; last major update 2017
- Impact: May not work reliably with modern font loading APIs
- Migration plan: Consider using native CSS `font-display` property instead; migrate away from FontFaceObserver

**Python Scripts (logo_json.py, embed_logos.py):**
- Risk: Build system depends on Python scripts for logo processing
- Impact: Platform-specific issues (Windows line endings, path separators)
- Migration plan: Consider Node.js equivalent for cross-platform compatibility

## Missing Critical Features

**No Offline Support:**
- Problem: Application requires internet for some operations (CDN resources, external fonts)
- Blocks: Full offline capability, better availability in poor network conditions

**No Undo/Redo:**
- Problem: Users cannot undo accidental changes to canvas
- Blocks: Better user experience, recovery from mistakes

**No Accessibility Features:**
- Problem: Limited ARIA labels, keyboard navigation support
- Blocks: WCAG compliance, usage by assistive technology users

**No Analytics or Error Tracking:**
- Problem: No visibility into production errors or user behavior
- Blocks: Identifying bugs in production, understanding user pain points

**No User Preferences Storage:**
- Problem: Only organization logo preference saved to localStorage
- Blocks: Saving workspace, template preferences, recent colors

## Test Coverage Gaps

**Logo Positioning Logic Not Tested:**
- What's not tested: The complex calculations in `calculateLogoTop()` function, magic number logic
- Files: `resources/js/main.js:103-129`
- Risk: Logo positioning can break silently with template changes
- Priority: **High** - This is critical user-facing functionality

**Canvas Utils Snap/Rotation Edge Cases:**
- What's not tested: All snap behavior combinations, rotation snap with very small/large objects
- Files: `resources/js/canvas-utils.js:65-206`
- Risk: Snap behavior may be unpredictable in edge cases
- Priority: **Medium** - Already has some visual tests, could expand

**File Upload Error Paths:**
- What's not tested: Network errors during upload, corrupted image handling, missing file reader support
- Files: `resources/js/choice-image.js:26-44`
- Risk: Unhandled errors silently fail without user feedback
- Priority: **Medium** - Error handling exists but untested

**QR Code Export Edge Cases:**
- What's not tested: Very long URLs, special characters, export with large QR codes
- Files: `resources/js/qrcode/qrcode-generator.js`
- Risk: QR codes may fail silently for certain inputs
- Priority: **Low** - Has visual regression tests, functional testing sufficient

**Responsive Design Testing:**
- What's not tested: Mobile layout at various screen sizes, touch interactions
- Files: `resources/js/wizard.js` (mobile-specific logic), HTML templates
- Risk: Mobile experience may be broken for some screen sizes
- Priority: **Medium** - Critical for usability

**Error Message Internationalization:**
- What's not tested: Error messages are in German, code uses hardcoded strings
- Files: `resources/js/validation.js`, `resources/js/handlers.js`
- Risk: Adding other languages requires code changes; error messages not translatable
- Priority: **Low** - Not currently needed but would block internationalization

---

*Concerns audit: 2026-02-26*
