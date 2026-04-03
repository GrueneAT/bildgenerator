# Pitfalls Research: Corporate Identity Update

**Researcher:** Pitfalls specialist
**Date:** 2026-04-03

---

## 1. Template Removal Cascading Effects — SEVERITY: HIGH

### `post_45_border` and `post_45_no_border` References (being merged into single "Feed-Post 4:5")

These template names are **deeply embedded** across the codebase. Every reference must be updated or removed.

**JavaScript files:**
- `resources/js/constants.js` lines 127-145 — template definitions (PRIMARY: must merge/replace)
- `resources/js/constants.js` line 268 — `template_values` alias (automatically picks up changes)

**HTML files (BOTH must be updated):**
- `index.html` lines 604-605 — `<option value="post_45_border">` and `<option value="post_45_no_border">`
- `index-production.html` lines 1133-1134 — DUPLICATE of the same options

**E2E tests (will break):**
- `e2e/template-operations.spec.js` lines 22, 48 — `selectOption('post_45_border')`
- `e2e/canvas-operations.spec.js` line 11
- `e2e/complete-wizard-flow.spec.js` lines 18, 141, 162

**Visual regression tests (will break — extensive):**
- `visual-regression/tests/test-utils.js` line 18 — **DEFAULT template is `post_45_border`** in `setupBasicTemplate()`. This is the default for EVERY visual test. CRITICAL to update.
- `visual-regression/tests/templates.spec.js` lines 13, 26 — explicit tests for both variants
- `visual-regression/tests/logo-toggle.spec.js` lines 24, 89, 166, 191, 255, 281, 333, 351 — 8 references
- `visual-regression/tests/core-functionality.spec.js` lines 13, 19 — explicitly asserts value is `'post_45_border'`
- `visual-regression/tests/error-handling.spec.js` lines 337, 355
- `visual-regression/tests/logo-text-positioning.spec.js` lines 24, 107, 187
- `visual-regression/tests/positioning.spec.js` line 458
- `visual-regression/tests/wizard-navigation.spec.js` lines 16, 23
- `visual-regression/tests/qr-codes.spec.js` line 22 (uses default)

**Reference images that will become stale:**
- `template-post-45-border-reference.png`
- `template-post-45-no-border-reference.png`

**Risk:** If the new template name (e.g., `feed_post_45`) is chosen, ALL the above must be updated. The `setupBasicTemplate()` default in test-utils.js is the single most impactful change — it affects nearly every visual test.

### `a2` and `a3` Template Removal

**JavaScript:**
- `resources/js/constants.js` lines 163-197 — `a2`, `a2_quer`, `a3`, `a3_quer` definitions

**HTML (BOTH files):**
- `index.html` lines 613-616 — 4 `<option>` elements
- `index-production.html` lines 1142-1145 — 4 `<option>` elements

**Visual regression tests:**
- `visual-regression/tests/templates.spec.js` lines 103-127, 157-181 — 4 test cases for A2/A3

**Reference images to remove:**
- `template-a2-portrait-reference.png`
- `template-a2-landscape-reference.png`
- `template-a3-portrait-reference.png`
- `template-a3-landscape-reference.png`

**Risk:** MEDIUM. These are self-contained — removing from constants + HTML + tests should be clean. No other code references a2/a3 by name.

---

## 2. Border Removal Side Effects — SEVERITY: HIGH

### Content Rectangle Behavior at border=0

When `border=0`, the current code at `main.js` lines 59-71 calculates:
```javascript
const borderDistance = border > 0 ? canvas.width / border : 0;
const topDistance = borderDistance * topBorderMultiplier;  // = 0
contentRect = new fabric.Rect({
    top: 0,         // topDistance = 0
    left: 0,        // borderDistance = 0
    width: canvas.width,   // canvas.width - 0*2 = full width
    height: canvas.height, // canvas.height - 0 = full height
    fill: AppConstants.COLORS.BACKGROUND_SECONDARY,
    selectable: false,
});
```

**With all borders=0:** The contentRect becomes a full-canvas-sized rectangle. This actually works correctly — it fills the entire canvas with `BACKGROUND_SECONDARY` color. The CONTEXT.md says to remove the content rectangle since there's only one background color now.

### Code That Depends on contentRect

**CRITICAL dependencies (canvas-utils.js lines 228-311):**
- `positionBackgroundImage()` uses `contentRect.top`, `contentRect.left`, `contentRect.width`, `contentRect.height` extensively for clipping and positioning
- Background image scaling uses `contentRect.width` vs `contentRect.height` comparison
- Movement bounds checking uses contentRect dimensions

**event-handlers.js:**
- Line 127 — `activeObject !== contentRect` guard in bring-to-front handler
- Lines 250-253 — Pink circle positioning uses `contentRect.width / 4`, `contentRect.height / 3`, `contentRect.width / 3`

**main.js:**
- Line 149 — Logo scaling: `scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO`
- Line 320 — `window.contentRect = contentRect` exposed globally for testing

**visual regression tests:**
- `layouts.spec.js` line 55 — `obj === contentRect` comparison
- `elements.spec.js` line 33 — same
- `positioning.spec.js` line 443 — `isContentRect: obj === contentRect`

**Risk:** If contentRect is removed entirely (as CONTEXT.md suggests), ALL these references break. The safest approach is either:
1. Keep contentRect but make it invisible/full-canvas (least risky)
2. Remove contentRect and refactor all usages to reference canvas dimensions directly (more work, cleaner)

**Recommendation:** Option 1 is safer. Set contentRect to full canvas, change fill to the new background color. This preserves the API surface while achieving the visual result.

### calculateLogoTop() — Already handles border=0

`main.js` lines 103-129: The function already has a `border > 0` / `else` branch. The borderless path uses `BORDERLESS_MARGIN_PERCENT`. This code path is already tested with existing borderless templates. **LOW risk.**

---

## 3. Logo File Name Patterns — SEVERITY: HIGH

### Current Small Logo Selection (main.js lines 181-185)

```javascript
if (scaleTo < 121) {
    logoFilename = logoFilename
        .replace("245", "120")
        .replace("248", "121")
        .replace("268", "131");
}
```

This code uses **string replacement on dimension numbers in filenames** to switch between large (245px) and small (120px) logo variants.

**New logo filenames:** `Logo-einzeilig_blanko.png` and `Logo-zweizeilig_blanko.png` contain NO numeric dimensions.

**Impact:** The `.replace("245", "120")` calls will be no-ops on the new filenames. This means:
- If `scaleTo < 121`, the code will try to load the large logo file (no small variant exists)
- The small logo logic is effectively dead code with new naming

**Risk:** HIGH. With the new fixed pixel sizes (163px social, 374/319/224px print), the `scaleTo < 121` condition may or may not be triggered. Let's check:
- Social: 163px — this is above 121, so large logo is used. OK.
- Print A6: 224px — above 121. OK.
- BUT: Facebook Header has small canvas (820x360). With border=0: contentRect = full canvas. `scaleTo = (820 + 360) / 10 = 118`. **This WILL trigger the small logo branch**, and with new filenames, the replacement will fail silently.

Wait — the CONTEXT.md says to use FIXED pixel sizes per template. So the entire `scaleTo = (contentRect.width + contentRect.height) / SCALE_RATIO` dynamic formula needs to be replaced. The small-logo branch becomes irrelevant IF the dynamic formula is replaced with template-specific fixed sizes.

**Risk:** The implementation must ensure the dynamic `scaleTo` calculation AND the `< 121` small variant logic are both replaced with the new fixed-size-per-template approach. If only partially updated, silent bugs occur.

---

## 4. Fixed Logo Size vs Dynamic Formula — SEVERITY: HIGH

### Current Flow
```
addLogo() → scaleTo = (contentRect.width + contentRect.height) / 10 → image.scaleToWidth(scaleTo)
```

### Required New Flow
```
addLogo() → template = currentTemplate() → scaleTo = template.logoPixelSize → image.scaleToWidth(scaleTo)
```

**Where to get template info:** `currentTemplate()` (line 271 of constants.js) reads `#canvas-template` select value. This is available inside `addLogo()` — in fact, it's already called at line 204: `const template = currentTemplate();`

**Implementation approach:** Add a `logoSize` property to each template in TemplateConstants.TEMPLATES, then in `addLogo()`:
```javascript
const template = currentTemplate();
const scaleTo = template.logoSize;  // instead of (contentRect.width + contentRect.height) / 10
```

**Risk:** MEDIUM. The template is already accessible in addLogo(). The change is straightforward but must be applied to ALL templates (including the new merged post template and the retained A4/A5/A6 variants).

**Logo sizes per template (from CONTEXT.md):**
- Social media (story, feed_post, event, facebook_header): 163px
- A4 (portrait + landscape): 374px
- A5 (portrait + landscape): 319px
- A6 (portrait + landscape): 224px

---

## 5. Sub-org Logo Rendering — SEVERITY: HIGH

### How Sub-org Logos Work Currently

The sub-org selection (`#logo-selection`) determines the `logoText` that gets rendered as a `fabric.Text` object overlaid on the base logo image.

**Current flow (main.js lines 150-260):**
1. `logoText` = selected organization name from dropdown (e.g., "WIEN")
2. Based on text length → choose SHORT or LONG logo image file
3. Load logo PNG image → position on canvas
4. Create `fabric.Text(logoText)` → position on the "pink bar" area of the logo
5. Text positioned using `PINK_BAR_OFFSET_FROM_TOP: 0.90` (90% of logo width from top)

**Key insight:** The sub-org text is NOT baked into the PNG. It's dynamically rendered as a separate canvas text element. The base logo is a standalone image (the GRUNE sunflower + colored bar), and the org name is overlaid.

**New logo change:** Pink bar becomes white bar. The text overlay positioning constants (`PINK_BAR_OFFSET_FROM_TOP`, `LOGO_TEXT`, `ANGLE`, etc.) may all need recalculation because:
- The white bar may have different dimensions than the pink bar
- The text color `LOGO_TEXT: "rgb(255,255,255)"` (white) on a white bar would be INVISIBLE
- The text angle `-5.5` degrees may not match the new logo design

**Risk:** HIGH. The text positioning constants are tuned for the current logo geometry. New logo files have different proportions. Constants that need review:
- `PINK_BAR_OFFSET_FROM_TOP: 0.90` — position where text starts
- `LOGO_TEXT: "rgb(255,255,255)"` — white text on white bar = invisible
- `ANGLE: -5.5` — rotation angle of text
- `LINE_HEIGHT: 0.8` — multi-line text spacing
- `WIDTH_SCALE: 0.95` — text width relative to logo
- `TEXT_SCALE_LONG: 4.8` and `TEXT_SCALE_SHORT: 6` — font size calculation

**CRITICAL:** If the new logo has a white bar, the overlay text color MUST change (probably to dark green or black). The CONTEXT.md mentions "white bar" explicitly.

---

## 6. Color Changes — Contrast Issues — SEVERITY: MEDIUM

### Background Color Change
- Old: `BACKGROUND_PRIMARY: "rgba(138, 180, 20)"` (bright green) and `BACKGROUND_SECONDARY: "rgba(83,132,48)"` (dark green)
- New: `#257639` (single dark green)

### Text Colors
- Current: `rgb(255,240,0)` (Yellow), `rgb(255,255,255)` (White)
- New: Add `#000000` (Black)

**Contrast analysis on #257639 background:**
- White (#FFFFFF) on #257639: ~4.89:1 — PASSES AA for large text, borderline for small text
- Yellow (#FFED00) on #257639: ~3.89:1 — PASSES AA for large text only
- Black (#000000) on #257639: ~4.31:1 — PASSES AA for large text only

**No code-level contrast validation exists.** The app has no contrast checking logic.

**Risk:** MEDIUM. Users could create hard-to-read combinations, but this is a design tool where the background image usually covers the background color, so text will be on arbitrary images anyway. The background color matters mainly when no image is loaded.

### Yellow Color Value Inconsistency
- Wizard QR generator uses `#FFED00` for yellow
- Text color uses `rgb(255,240,0)` for yellow (Gelb)
- These are DIFFERENT yellows: `#FFED00` = `rgb(255, 237, 0)` vs `rgb(255, 240, 0)` = `#FFF000`
- Not a new issue — but when adding black, ensure consistent format

---

## 7. QR Code Color Updates — TWO SEPARATE SYSTEMS — SEVERITY: HIGH

### System 1: Wizard QR (in-canvas QR code)
- **HTML element:** `#qr-color` (index.html line 948)
- **Current colors:** `#000000` (Schwarz), `#538430` (Dunkelgrun)
- **Handler:** `event-handlers.js` line 305 — `jQuery("#qr-color").val() || "#000000"`
- **Tests:** `visual-regression/tests/qr-codes.spec.js` line 22, 42

### System 2: Standalone QR Generator (download-only QR)
- **HTML element:** `#qr-color-select` (index.html line 317)
- **Current colors:** `#000000`, `#FFFFFF`, `#538430`, `#82B624`, `#FFED00`, `#E6007E`
- **JS constants:** `qrcode-generator.js` lines 6-13 — `QR_COLORS` object
- **Handler:** `qrcode-generator.js` line 45, 397 — `jQuery('#qr-color-select').val()`
- **Background element:** `#qr-background-select` (index.html line 330)
- **Tests:** `visual-regression/tests/qr-generator.spec.js`, `qr-transparency.spec.js`

### Also in production HTML:
- `index-production.html` line 846 — `#qr-color-select`
- `index-production.html` line 1477 — `#qr-color`

**Risk:** HIGH. Must update FOUR HTML locations (2 systems x 2 HTML files), PLUS the `QR_COLORS` constant in `qrcode-generator.js`. Easy to miss one. Also, `qrcode-helpers.js` line 225 has a THIRD copy of the Gelb color constant `'#FFED00': 'Gelb'`.

---

## 8. Font Dropdown Removal — SEVERITY: MEDIUM

### Current Font Select Element
- `index.html` lines 776-784 — `<select id="font-style-select">` with two options
- `index-production.html` lines 1307 — same

### JS References to `#font-style-select`
- `event-handlers.js` lines 63-69 — `'#font-style-select': { 'change': ... }` handler: sets fontFamily on active text object
- `event-handlers.js` line 150 — `jQuery("#font-style-select").val() || "Gotham Narrow Ultra"` — default font when creating text
- `handlers.js` line 30 — `jQuery('#font-style-select').val(activeObject.fontFamily)` — syncs UI when text selected

**Behavior when element removed:**
- `event-handlers.js` line 63: The jQuery handler registration will silently succeed on a non-existent element — no error. It just won't fire. **SAFE.**
- `event-handlers.js` line 150: `jQuery("#font-style-select").val()` returns `undefined` for missing element, so fallback `|| "Gotham Narrow Ultra"` kicks in. **SAFE — but relies on fallback.**
- `handlers.js` line 30: Setting `.val()` on non-existent jQuery object is a no-op. **SAFE.**

**Risk:** MEDIUM. The code is resilient to the element being missing due to jQuery's null-safe behavior and the `|| "Gotham Narrow Ultra"` fallback. However, it's cleaner to also update the JS to hardcode the font rather than rely on fallback behavior. Dead code should be cleaned up.

**Recommendation:** Remove the HTML element AND update `event-handlers.js` line 150 to hardcode `"Gotham Narrow Ultra"` (remove the jQuery call entirely). Remove the `#font-style-select` change handler. Clean up `handlers.js` line 30.

---

## 9. Visual Regression Test Impact — SEVERITY: HIGH

### Scope of Impact
- **80 reference images** exist in `visual-regression/reference-images/`
- Nearly ALL will break because:
  1. Background color changes (`rgba(138,180,20)` / `rgba(83,132,48)` → `#257639`)
  2. Template removal (A2, A3, post variants)
  3. Border removal changes canvas appearance
  4. Logo changes affect every test that shows a logo

### Default Template Change Impact
- `test-utils.js` line 18: `setupBasicTemplate(page, templateType = 'post_45_border')`
- This default is used by most tests. When `post_45_border` is removed, ALL tests using the default will fail with "element not found" on selectOption.

### Reference Image Regeneration
- `GENERATE_REFERENCE_MODE` is controlled by env var `GENERATE_REFERENCE=true` (test-utils.js line 11)
- Run: `GENERATE_REFERENCE=true npx playwright test` to regenerate all references
- **But** this must be done AFTER all code changes are complete, not incrementally

### Tests That Must Be Deleted/Rewritten
- Templates spec: 4 tests for A2/A3 (lines 103-181)
- Templates spec: 2 tests for post_45_border/post_45_no_border (lines 10-34) — need replacement test for new merged template

### Tests That Need Template Name Update Only
- Every test using `post_45_border` → new template name
- core-functionality line 19 asserts `toBe('post_45_border')` — must change value

**Risk:** HIGH maintenance burden. Recommend:
1. Update all template names FIRST
2. Delete removed template tests
3. Regenerate ALL reference images in one pass
4. Review diffs manually for sanity

---

## 10. Production Build Impact — SEVERITY: HIGH

### index-production.html is a SEPARATE FILE

**CRITICAL FINDING:** `index-production.html` is a completely separate HTML file that must be updated independently of `index.html`. It contains its own copy of:
- Template `<select>` options (lines 1132-1150)
- Font select (line 1307)
- Text color options (line 1329)
- QR color options (lines 846, 1477)
- Symbol button label "Hakchen" (line 1447)

**Every HTML change in index.html must be duplicated in index-production.html.**

### Build Scripts
- `scripts/build-js.js` — bundles app JS. No template-specific logic. **SAFE.**
- `scripts/build-css.js` — bundles CSS. No template-specific logic. **SAFE.**

**Risk:** HIGH. Forgetting to update `index-production.html` means development works but production breaks. The two files appear to be manually kept in sync, not auto-generated.

---

## 11. Pink Circle Color Reference — SEVERITY: LOW

### Hardcoded in event-handlers.js
- Line 255: `fill: "rgb(225,0,120)"` — hardcoded pink color
- Also in constants.js line 66: `PINK_CIRCLE: "rgb(225,0,120)"`
- The handler doesn't use the constant!

**Risk:** LOW. The issue doesn't mention changing the pink circle color. But the handler uses a hardcoded value instead of the constant, which is a pre-existing code smell.

---

## 12. Logo State and localStorage — SEVERITY: LOW

### Organization Selection Persistence
- `wizard.js` line 272: saves to `localStorage('gruener-bildgenerator-organisation')`
- Values stored are the uppercase org names (e.g., "GRUENE.AT", "WIEN")
- Template name is NOT stored in localStorage

**Risk:** LOW. Template changes don't affect localStorage. Saved org selections remain valid.

---

## 13. A6 Template Already Exists But May Need UI Wiring — SEVERITY: MEDIUM

### Current State
- `constants.js` lines 235-252: `a6` and `a6_quer` templates are DEFINED
- `index.html` lines 619-620: A6 options ARE in the template dropdown
- `index-production.html` lines 1148-1149: Also present

**Finding:** A6 is already fully wired. The CONTEXT.md question "A6 template already exists but may not be wired into the UI template selector — verify and add if missing" is answered: it IS wired in both HTML files.

**No visual regression tests exist for A6.** No reference images for A6.

**Risk:** MEDIUM — if the CI update expects A6 behavior to change (e.g., border removal), the template definition needs updating but no tests exist to catch regressions.

---

## 14. The `logoTextTop` Constants — Dead Code? — SEVERITY: LOW

### Current State
Every template has a `logoTextTop` property (e.g., `story.logoTextTop: 0.9423`), but searching the codebase:

```
Grep for "logoTextTop" → only found in constants.js definitions
```

This property appears to be UNUSED in actual code. The text positioning is done dynamically in `addLogo()` using `PINK_BAR_OFFSET_FROM_TOP`. The `logoTextTop` values in templates are commented as "kept for reference but not used in calculations" (constants.js line 115).

**Risk:** LOW. These are dead constants. Can be removed during cleanup or kept for documentation.

---

## Summary — Priority Order

| # | Pitfall | Severity | Impact If Missed |
|---|---------|----------|------------------|
| 1 | Template name cascading (esp. test-utils.js default) | HIGH | Every visual test fails |
| 10 | index-production.html separate sync | HIGH | Production breaks |
| 7 | Two QR systems + 4 HTML locations | HIGH | Inconsistent QR behavior |
| 2 | contentRect removal/simplification | HIGH | Background image positioning breaks |
| 3 | Logo filename string replacement | HIGH | Silent logo loading failure |
| 5 | Sub-org text on white bar (white on white) | HIGH | Org names invisible |
| 9 | Visual regression test mass breakage | HIGH | CI blocks until all refs regenerated |
| 4 | Fixed logo size per template | HIGH | Wrong logo sizes if partially implemented |
| 8 | Font dropdown removal (JS dead code) | MEDIUM | Works via fallback, but messy |
| 6 | Color contrast issues | MEDIUM | Readability on plain background |
| 13 | A6 template — no test coverage | MEDIUM | Untested after changes |
| 11 | Pink circle hardcoded color | LOW | Pre-existing, not changed |
| 12 | localStorage unaffected | LOW | No action needed |
| 14 | logoTextTop dead constants | LOW | Cleanup opportunity |
