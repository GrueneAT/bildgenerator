# Codebase Research: Corporate Identity Update

**Date:** 2026-04-03
**Researcher:** Codebase Agent

## 1. Template System — Full Current State

**File:** `/root/workspace/resources/js/constants.js` (lines 116-265)

### All Template Definitions

| Template Key | Width | Height | Border | topBorderMultiplier | DPI | Status (per issue) |
|---|---|---|---|---|---|---|
| `story` | 1080 | 1920 | 10 | 2 | 200 | MODIFY: border→0 |
| `post_45_border` | 1080 | 1350 | 20 | 1 | 200 | **REMOVE** (merge into `post_45`) |
| `post_45_no_border` | 1080 | 1350 | 0 | 1 | 200 | MODIFY: rename to `post_45` or `feed_post_45` |
| `event` | 1920 | 1005 | 0 | 1 | 200 | MODIFY (already borderless) |
| `facebook_header` | 820 | 360 | 0 | 1 | 150 | MODIFY (already borderless) |
| `a2` | 4961 | 7016 | 10 | 1 | 150 | **REMOVE** |
| `a2_quer` | 7016 | 4961 | 10 | 1 | 150 | **REMOVE** |
| `a3` | 3508 | 4961 | 10 | 1 | 200 | **REMOVE** |
| `a3_quer` | 4961 | 3508 | 10 | 1 | 200 | **REMOVE** |
| `a4` | 2480 | 3508 | 10 | 1 | 250 | MODIFY: border→0 |
| `a4_quer` | 3508 | 2480 | 10 | 1 | 250 | MODIFY: border→0 |
| `a5` | 1748 | 2480 | 10 | 1 | 300 | MODIFY: border→0 |
| `a5_quer` | 2480 | 1748 | 10 | 1 | 300 | MODIFY: border→0 |
| `a6` | 1240 | 1748 | 10 | 1 | 300 | MODIFY: border→0 |
| `a6_quer` | 1748 | 1240 | 10 | 1 | 300 | MODIFY: border→0 |

### Templates to REMOVE
- `post_45_border` — merged into single "Feed-Post 4:5"
- `a2`, `a2_quer` — dropped from new CI
- `a3`, `a3_quer` — dropped from new CI

### Templates to MODIFY (all remaining)
All remaining templates get `border: 0`. The `logoTop` and `logoTextTop` values will be recalculated since the positioning logic changes.

### A6/A6_quer
**Confirmed:** A6 templates exist in both `constants.js` (lines 235-252) AND in the HTML select (lines 619-620). They are fully wired up.

### Key Template Accessor Functions
```javascript
// constants.js line 256-264
TemplateConstants.getTemplate(templateName)  // returns template object or null
TemplateConstants.getCurrentTemplate()       // reads #canvas-template select value

// constants.js line 268-273 (legacy compat)
const template_values = TemplateConstants.TEMPLATES;
function currentTemplate() { return TemplateConstants.getCurrentTemplate(); }
```

---

## 2. Template UI — HTML Select Options

**File:** `/root/workspace/index.html` (lines 598-622)

```html
<select class="form-select text-method w-full" name="canvas-template" id="canvas-template">
  <optgroup label="Social Media">
    <option value="post_45_border">Post 4:5 mit Rahmen</option>
    <option value="post_45_no_border">Post 4:5 ohne Rahmen</option>
    <option value="story">Instagram/Facebook Story</option>
    <option value="event">Veranstaltung</option>
    <option value="facebook_header">Facebook Header</option>
  </optgroup>
  <optgroup label="Druck">
    <option value="a4">A4 Poster</option>
    <option value="a4_quer">A4 Querformat</option>
    <option value="a3">A3 Poster</option>
    <option value="a3_quer">A3 Querformat</option>
    <option value="a2">A2 Poster</option>
    <option value="a2_quer">A2 Querformat</option>
    <option value="a5">A5 Flyer</option>
    <option value="a5_quer">A5 Querformat</option>
    <option value="a6">A6 Flyer</option>
    <option value="a6_quer">A6 Querformat</option>
  </optgroup>
</select>
```

**`index-production.html`** has the same structure (lines 1123-1150), with identical option values and grouping.

### Changes Needed:
1. Remove `post_45_border` option
2. Rename `post_45_no_border` → `feed_post_45` (value), "Feed-Post 4:5" (display name)
3. Remove `a2`, `a2_quer`, `a3`, `a3_quer` options
4. Rename labels per BildgeneratorUpdates.txt:
   - "Story-Format" for story
   - "Veranstaltungs-Header" for event
   - A4/A5/A6 → "Hochformat" / "Querformat"

---

## 3. Logo System — Complete Flow

### 3.1 Current Logo Files

**Location:** `/root/workspace/resources/images/logos/`

| File | Dimensions | Purpose |
|---|---|---|
| `Gruene_Logo_245_248.png` | 245x248 px | SHORT logo (single-line org name, ≤16 chars) |
| `Gruene_Logo_245_268.png` | 245x268 px | LONG logo (multi-line org name, >16 chars or has %) |
| `Gruene_Logo_120_121.png` | 120x121 px | Small SHORT (used when scaleTo < 121) |
| `Gruene_Logo_120_131.png` | 120x131 px | Small LONG (used when scaleTo < 121) |

**New Logo Files (in repo root, need to be moved):**

| File | Dimensions | Purpose |
|---|---|---|
| `Logo-einzeilig_blanko.png` | 1200x1211 px | New SHORT (einzeilig) — much larger resolution |
| `Logo-zweizeilig_blanko.png` | 1200x1284 px | New LONG (zweizeilig) — much larger resolution |

### 3.2 Logo Constants

**File:** `/root/workspace/resources/js/constants.js` (lines 87-108)

```javascript
LOGO: {
    SCALE_RATIO: 10,                    // (contentRect.width + contentRect.height) / 10
    TEXT_SCALE_LONG: 4.8,
    TEXT_SCALE_SHORT: 6,
    MAX_TEXT_LENGTH: 16,
    LINE_HEIGHT: 0.8,
    ANGLE: -5.5,                        // Logo text is rotated -5.5 degrees
    WIDTH_SCALE: 0.95,
    PINK_BAR_OFFSET_FROM_TOP: 0.90,     // Text starts at 90% of logo WIDTH from logo top
    BORDER_CUT_RATIO: 0.91,            // Border cuts at 91% of logo height
    BORDERLESS_MARGIN_PERCENT: 0.02,    // 2% margin from canvas bottom
    FILES: {
        LONG: "Gruene_Logo_245_268.png",
        SHORT: "Gruene_Logo_245_248.png",
        SMALL_LONG: "Gruene_Logo_120_131.png",
        SMALL_SHORT: "Gruene_Logo_120_121.png"
    }
}
```

### 3.3 LONG vs SHORT Selection Logic

**File:** `/root/workspace/resources/js/main.js` (lines 150-179)

```javascript
logoText = (jQuery("#logo-selection").find(":selected").attr("value") || "").trim().toUpperCase();

// Selection logic:
if (logoText.includes("%") || logoText.length > AppConstants.LOGO.MAX_TEXT_LENGTH) {
    logoFilename = AppConstants.LOGO.FILES.LONG;    // zweizeilig
    isLongLogo = true;
    // Break text at % or last space
} else {
    logoFilename = AppConstants.LOGO.FILES.SHORT;   // einzeilig
    isLongLogo = false;
}

// Small logo fallback
if (scaleTo < 121) {
    logoFilename = logoFilename.replace("245", "120").replace("248", "121").replace("268", "131");
}
```

**KEY CHANGE NEEDED:** The new logos are 1200px wide (vs 245px). The small-logo fallback logic with string replacement will break. Need to:
1. Replace `FILES` constants with new filenames
2. Remove or rethink the small-logo fallback (new logos are huge, probably don't need small variants)
3. The `scaleTo < 121` branch needs updating

### 3.4 Logo Scaling Formula

**File:** `/root/workspace/resources/js/main.js` (line 149)

```javascript
const scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO;
```

**LOCKED DECISION:** Fixed pixel sizes per template:
- Social Media: 163px
- A4: 374px (print = 38mm at 250 DPI)
- A5: 319px (27mm at 300 DPI)
- A6: 224px (19mm at 300 DPI)

The dynamic formula must be replaced with template-specific fixed widths. Add a `logoWidth` property to each template definition.

### 3.5 Logo Positioning

**File:** `/root/workspace/resources/js/main.js` (lines 103-129)

```javascript
function calculateLogoTop(logoHeight, template) {
    const borderDistance = template.border > 0 ? canvas.width / template.border : 0;

    if (template.border > 0) {
        // Bordered: border cuts at BORDER_CUT_RATIO of logo height
        const bottomBorderTop = canvas.height - borderDistance;
        const logoTop = bottomBorderTop - (logoHeight * AppConstants.LOGO.BORDER_CUT_RATIO);
        return logoTop;
    } else {
        // Borderless: percentage-based margin from canvas bottom
        const marginFromBottom = canvas.height * AppConstants.LOGO.BORDERLESS_MARGIN_PERCENT;
        const logoBottom = canvas.height - marginFromBottom;
        const logoTop = logoBottom - logoHeight;
        return logoTop;
    }
}
```

Since ALL templates become border=0, only the borderless path will be used. The bordered path can be removed.

### 3.6 Logo Text on Canvas (Sub-org name overlay)

**File:** `/root/workspace/resources/js/main.js` (lines 217-248)

The sub-org name (e.g., "WIEN", "BEZIRK LEIBNITZ") is rendered as a `fabric.Text` on top of the logo image, positioned at the "pink bar" location:

```javascript
// Position calculation
const offsetFromTop = image.getScaledWidth() * AppConstants.LOGO.PINK_BAR_OFFSET_FROM_TOP; // 0.90
const textTopPosition = image.top + offsetFromTop;

logoName = new fabric.Text(logoText, {
    top: textTopPosition,
    fontFamily: AppConstants.FONTS.DEFAULT_LOGO,   // "Gotham Narrow Bold"
    fontSize: Math.floor(image.getScaledWidth() / 10),
    fontStyle: "normal",
    textAlign: "right",
    fill: AppConstants.COLORS.LOGO_TEXT,            // rgb(255,255,255) — white
    stroke: AppConstants.COLORS.TEXT_STROKE,        // #000000
    strokeWidth: 0,
    lineHeight: AppConstants.LOGO.LINE_HEIGHT,      // 0.8
    angle: AppConstants.LOGO.ANGLE,                 // -5.5 degrees
    selectable: false,
});
```

**KEY OBSERVATION:** The pink bar becomes a WHITE bar in the new CI. The text fill is already white (`rgb(255,255,255)`), but the bar itself is part of the logo PNG image. The new "blanko" logos have a white bar instead of pink. The text overlay mechanism should still work the same way, but the `PINK_BAR_OFFSET_FROM_TOP` ratio (0.90) will need recalibration because the new logos have different proportions (1200x1211 vs 245x248 — aspect ratio ~0.99 vs ~0.99, so similar).

**Aspect ratio comparison:**
- Old SHORT: 245/248 = 0.9879
- New einzeilig: 1200/1211 = 0.9909
- Old LONG: 245/268 = 0.9142
- New zweizeilig: 1200/1284 = 0.9346

The aspect ratios are close but not identical. The PINK_BAR_OFFSET_FROM_TOP may need adjustment.

### 3.7 Sub-org Logo Loading Flow

1. `loadLogoSelection()` in `main.js` (line 374) loads `index.json`
2. `generateLogoSelection()` populates `#logo-selection` dropdown with optgroups
3. When user selects an org, `#logo-selection` change event fires (event-handlers.js line 100)
4. This calls `addLogo()` which reads the selected value text
5. The text determines SHORT vs LONG logo file
6. The text itself is rendered as an overlay on the logo image

**IMPORTANT:** The logo index.json contains text names like "Wien", "BEZIRK % LEIBNITZ" — NOT file paths to individual logo images. All sub-orgs use the SAME base logo (Gruene_Logo_245_248.png or Gruene_Logo_245_268.png) with the org name overlaid as text.

This means the locked decision "use new base logo at canvas render time" is already how it works — just swap the logo files.

---

## 4. Color System

### 4.1 App Constants Colors

**File:** `/root/workspace/resources/js/constants.js` (lines 63-72)

```javascript
COLORS: {
    BACKGROUND_PRIMARY: "rgba(138, 180, 20)",     // #8AB414 — light green (canvas bg)
    BACKGROUND_SECONDARY: "rgba(83,132,48)",       // #538430 — dark green (content rect)
    PINK_CIRCLE: "rgb(225,0,120)",                 // #E10078 — magenta pink
    LOGO_TEXT: "rgb(255,255,255)",                  // white
    TEXT_STROKE: "#000000",                         // black
    CORNER_COLOR: "yellow",
    BORDER_COLOR: "rgba(88,42,114)",               // purple (selection handles)
    CORNER_STROKE: "#000000"
}
```

**CHANGES NEEDED:**
- `BACKGROUND_PRIMARY` → `#257639` (new dark green, single solid color)
- `BACKGROUND_SECONDARY` → remove or set to same as PRIMARY (no content rect needed)
- `PINK_CIRCLE` → keep as-is? Or update? (BildgeneratorUpdates.txt doesn't mention this)

### 4.2 Canvas Background Usage

**File:** `/root/workspace/resources/js/main.js` (line 48)

```javascript
canvas = new fabric.Canvas("meme-canvas", {
    backgroundColor: AppConstants.COLORS.BACKGROUND_PRIMARY,  // Used as canvas fill
    // ...
});
```

### 4.3 Content Rectangle

**File:** `/root/workspace/resources/js/main.js` (lines 64-71)

```javascript
contentRect = new fabric.Rect({
    top: topDistance,
    left: borderDistance,
    width: canvas.width - borderDistance * 2,
    height: canvas.height - (topDistance + borderDistance),
    fill: AppConstants.COLORS.BACKGROUND_SECONDARY,   // Dark green rectangle
    selectable: false,
});
canvas.add(contentRect);
```

**LOCKED DECISION:** Background = single solid #257639, remove content rectangle. When border=0, `borderDistance=0` and `topDistance=0`, so contentRect already covers full canvas. But it's a separate object. Since background is now single solid, we could either:
- Set canvas backgroundColor to #257639 and make contentRect fill the same color
- OR set canvas backgroundColor to #257639 and skip adding contentRect (but contentRect is referenced everywhere for clipping/positioning!)

**CRITICAL:** `contentRect` is used extensively:
- `positionBackgroundImage()` clips to contentRect bounds
- `enablePictureMove()` constrains movement to contentRect
- `setupPinkCircleHandler()` uses contentRect for sizing
- Logo scaling: `(contentRect.width + contentRect.height) / SCALE_RATIO`

So contentRect must remain as an object even if its fill matches canvas bg. Set it to `fill: "#257639"` and full canvas dimensions.

### 4.4 Text Color Options

**File:** `/root/workspace/index.html` (lines 795-802)

```html
<select class="form-select text-method w-full" name="text-color" id="text-color">
    <option value="rgb(255,240,0)">Gelb</option>
    <option value="rgb(255,255,255)">Weiß</option>
</select>
```

**CHANGES PER BildgeneratorUpdates.txt:**
- Add Schwarz (#000000)
- Change Gelb from `rgb(255,240,0)` to `#FFED00` (same hue, slightly different)
- Keep Weiß (#FFFFFF)

New options: Weiß (#FFFFFF), Schwarz (#000000), Gelb (#FFED00)

### 4.5 QR Code Colors — Wizard QR (in-canvas)

**File:** `/root/workspace/index.html` (lines 948-951)

```html
<select class="form-select w-full" id="qr-color">
    <option value="#000000">Schwarz</option>
    <option value="#538430">Dunkelgrün</option>
</select>
```

**CHANGES:** Replace `#538430` with `#257639` (new Dunkelgrün)

### 4.6 QR Code Colors — Standalone QR Generator

**File:** `/root/workspace/index.html` (lines 317-324)

```html
<select class="form-select w-full" id="qr-color-select">
    <option value="#000000">Schwarz</option>
    <option value="#FFFFFF">Weiß</option>
    <option value="#538430">Dunkelgrün</option>
    <option value="#82B624">Hellgrün</option>
    <option value="#FFED00">Gelb</option>
    <option value="#E6007E">Magenta</option>
</select>
```

**File:** `/root/workspace/resources/js/qrcode/qrcode-generator.js` (lines 6-13)

```javascript
const QR_COLORS = {
    '#000000': 'Schwarz',
    '#FFFFFF': 'Weiß',
    '#538430': 'Dunkelgrün',
    '#82B624': 'Hellgrün',
    '#FFED00': 'Gelb',
    '#E6007E': 'Magenta'
};
```

**CHANGES PER BildgeneratorUpdates.txt:**
- Dunkelgrün: `#538430` → `#257639`
- Hellgrün: `#82B624` → `#56AF31`
- Must update both HTML and JS constant

### 4.7 Tailwind Theme Colors

**File:** `/root/workspace/tailwind.config.js` (lines 9-13)

```javascript
colors: {
    'gruene-primary': '#8AB414',
    'gruene-secondary': '#538430',
    'gruene-dark': '#2D5016',
}
```

**CHANGES:** Update to new CI colors:
- `gruene-primary`: `#257639` (new primary green)
- `gruene-secondary`: Could be `#56AF31` (new Hellgrün) or keep for contrast
- `gruene-dark`: Needs review

### 4.8 CSS Hardcoded Colors

**File:** `/root/workspace/resources/css/style.css` — Multiple hardcoded `#8ab414`:
- Line 199: `.step-indicator.active` background
- Line 201: `.step-indicator.active` border
- Line 236: `.form-input:focus` border
- Line 374: `.element-button:hover` border
- Line 404: `.step-section-header:focus` outline
- Line 417: `.step-section-header i` color
- Line 476: `.btn-group .btn-primary.active` background

All of these reference the OLD `#8AB414` and should be updated to new primary green `#257639`.

---

## 5. Font System

### 5.1 Font Files

**File:** `/root/workspace/resources/css/fonts.css`

Four fonts loaded:
1. Gotham Narrow Ultra Italic (`GothamNarrow-UltraItalic.otf`)
2. Gotham Narrow Ultra (`Gotham-Narrow-Ultra.otf`)
3. Gotham Narrow Book (`Gotham-Narrow-Book.otf`)
4. Gotham Narrow Bold (`GothamNarrow-Bold.otf`)

### 5.2 Font Selection UI

**File:** `/root/workspace/index.html` (lines 776-784)

```html
<select class="form-select w-full" id="font-style-select">
    <option value="Gotham Narrow Ultra">Überschrift</option>
    <option value="Gotham Narrow Book">Fließtext</option>
</select>
```

**CHANGE PER BildgeneratorUpdates.txt:** Remove dropdown entirely. Only "Gotham Narrow Ultra" remains. The select element and its label should be removed from the UI.

### 5.3 Font Handler

**File:** `/root/workspace/resources/js/event-handlers.js` (lines 63-69)

```javascript
'#font-style-select': {
    'change': function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.get('type') === "text") {
            const selectedFont = jQuery(this).val();
            setValue("fontFamily", selectedFont);
        }
    }
}
```

When the dropdown is removed, this handler becomes dead code. The default font in `setupTextHandler` (line 150) already defaults to `"Gotham Narrow Ultra"`.

### 5.4 Font Preloading

**File:** `/root/workspace/resources/js/wizard.js` (lines 21-36) and `/root/workspace/resources/js/constants.js` (lines 76-84)

```javascript
PRELOAD_FONTS: [
    'Gotham Narrow Ultra Italic',
    'Gotham Narrow Ultra',
    'Gotham Narrow Book',
    'Gotham Narrow Bold'
]
```

Keep loading all fonts since "Gotham Narrow Bold" is still used for logo text.

---

## 6. Symbol/Hkchen System

### 6.1 Cross/Check Handler

**File:** `/root/workspace/resources/js/event-handlers.js` (lines 274-286)

```javascript
setupCrossHandler() {
    this.bindHandler('#add-cross', 'click', function() {
        fabric.Image.fromURL(
            generatorApplicationURL + "resources/images/Ankreuzen.png",
            function(image) {
                CanvasUtils.scaleElementToFit(image, 0.4, 0.3);
                canvas.add(image);
                canvas.centerObject(image);
                canvas.bringToFront(image);
            }
        );
    });
}
```

### 6.2 Current Image

**Path:** `/root/workspace/resources/images/Ankreuzen.png` (241,644 bytes)

### 6.3 UI Button

**File:** `/root/workspace/index.html` (line 917-919)

```html
<button class="element-button" id="add-cross">
    <i class="fas fa-check"></i>Häkchen
</button>
```

**CHANGES:**
1. Rename button label from "Hkchen" to "Wahlkreuz"
2. Replace `Ankreuzen.png` with new `Wahlkreuz.png` (needs conversion from EPS)
3. Update path in `setupCrossHandler()`: `"resources/images/Ankreuzen.png"` → `"resources/images/Wahlkreuz.png"`
4. Consider changing the icon from `fa-check` to `fa-times` or `fa-xmark`

---

## 7. Border System — Full Rendering Path

### 7.1 Border Distance Calculation

**File:** `/root/workspace/resources/js/main.js` (lines 59-61)

```javascript
const borderDistance = border > 0 ? canvas.width / border : 0;
const topDistance = borderDistance * topBorderMultiplier;
```

When `border=0`: `borderDistance=0`, `topDistance=0`.

### 7.2 Content Rectangle with border=0

```javascript
contentRect = new fabric.Rect({
    top: 0,          // topDistance = 0
    left: 0,         // borderDistance = 0
    width: canvas.width,   // canvas.width - 0*2
    height: canvas.height, // canvas.height - (0 + 0)
    fill: AppConstants.COLORS.BACKGROUND_SECONDARY,
    selectable: false,
});
```

The contentRect already handles border=0 correctly, covering the full canvas. Just need to change its fill color to `#257639`.

### 7.3 calculateLogoTop with border=0

The borderless path is already coded (lines 123-128):
```javascript
const marginFromBottom = canvas.height * AppConstants.LOGO.BORDERLESS_MARGIN_PERCENT;
const logoBottom = canvas.height - marginFromBottom;
const logoTop = logoBottom - logoHeight;
```

This path will be used exclusively since all borders are now 0.

### 7.4 All border references in codebase

Key locations that reference `border`:
- `constants.js`: Template definitions (all need border→0)
- `main.js` line 60: `borderDistance` calculation (will always be 0)
- `main.js` line 115-121: `calculateLogoTop` bordered path (dead code)
- `canvas-utils.js`: `positionBackgroundImage` uses contentRect bounds (no direct border ref)

---

## 8. Test Impact

### 8.1 Tests Referencing `post_45_border`

These tests must be updated to use the new template key:

| File | Occurrences | Lines |
|---|---|---|
| `visual-regression/tests/logo-toggle.spec.js` | 8 | 24, 89, 166, 191, 255, 281, 333, 351 |
| `visual-regression/tests/test-utils.js` | 1 | 18 (default param!) |
| `visual-regression/tests/positioning.spec.js` | 1 | 458 |
| `visual-regression/tests/wizard-navigation.spec.js` | 2 | 16, 23 |
| `visual-regression/tests/templates.spec.js` | 2 | 13, 26 |
| `visual-regression/tests/core-functionality.spec.js` | 2 | 13, 19 |
| `visual-regression/tests/error-handling.spec.js` | 2 | 337, 355 |
| `visual-regression/tests/logo-text-positioning.spec.js` | 3 | 24, 107, 187 |
| `e2e/template-operations.spec.js` | 2 | 22, 48 |
| `e2e/complete-wizard-flow.spec.js` | 3 | 18, 141, 162 |
| `e2e/canvas-operations.spec.js` | 1 | 11 |

**CRITICAL:** `test-utils.js` line 18 uses `post_45_border` as default parameter:
```javascript
export async function setupBasicTemplate(page, templateType = 'post_45_border') {
```
This affects ALL tests that call `setupBasicTemplate` without specifying a template.

### 8.2 Tests Referencing Removed Templates (a2, a3)

| File | Template | Lines |
|---|---|---|
| `visual-regression/tests/templates.spec.js` | `a3`, `a3_quer` | 106, 119 |
| `visual-regression/tests/templates.spec.js` | `a2`, `a2_quer` | 160, 173 |

These test cases should be removed entirely.

### 8.3 Tests Referencing Old QR Colors

| File | Color | Lines |
|---|---|---|
| `visual-regression/tests/qr-codes.spec.js` | `#538430` | 42 |
| `visual-regression/tests/qr-transparency.spec.js` | `#E6007E`, `#82B624`, `#538430` | 208, 234, 401, 425 |
| `visual-regression/tests/qr-generator.spec.js` | `#538430`, `#82B624`, `#E6007E` | 295, 307, 331, 355, 379 |

### 8.4 Integration Tests

**File:** `/root/workspace/tests/integration/logo-processing-integration.test.js`
- Extracts and evals `addLogo()` from main.js source
- Tests logo file selection (LONG/SHORT), text splitting, edge cases
- References `AppConstants.LOGO.FILES` constants — will need updating
- Does NOT test pixel sizes, mostly tests text processing logic

### 8.5 Visual Regression Reference Images

All visual regression tests that take screenshots will need their reference images regenerated after the CI changes (new colors, no borders, new logos).

---

## 9. Logo Text Overlay for Sub-org Logos

### 9.1 Text Positioning Relative to Logo

**File:** `/root/workspace/resources/js/main.js` (lines 216-218)

```javascript
const offsetFromTop = image.getScaledWidth() * AppConstants.LOGO.PINK_BAR_OFFSET_FROM_TOP; // 0.90
const textTopPosition = image.top + offsetFromTop;
```

The text is positioned at 90% of the logo's scaled WIDTH from the logo's top edge. This positions it at the "pink bar" area (now white bar).

### 9.2 Text Properties

```javascript
logoName = new fabric.Text(logoText, {
    top: textTopPosition,
    fontFamily: "Gotham Narrow Bold",
    fontSize: Math.floor(image.getScaledWidth() / 10),
    fontStyle: "normal",
    textAlign: "right",
    fill: "rgb(255,255,255)",     // White text
    strokeWidth: 0,
    lineHeight: 0.8,
    angle: -5.5,                  // Rotated to match logo angle
    selectable: false,
});
```

### 9.3 Text Scaling for Long Names

Lines 237-244: If text is very long (>17 chars on a line), it's scaled to fit within the logo width:

```javascript
if (linebreak > 17 || logoText.length - linebreak > 17) {
    logoName.scaleToWidth(image.getScaledWidth() * AppConstants.LOGO.WIDTH_SCALE); // 0.95
    const topAdd = Math.floor((logoName.height - logoName.getScaledHeight()) / 2);
    logoName.top = logoName.top + topAdd;
} else {
    logoName.width = image.getScaledWidth() * AppConstants.LOGO.WIDTH_SCALE;
}
```

### 9.4 Impact of New Logos

The new logos have different dimensions but the text positioning uses ratio-based calculation (90% of WIDTH from top). Since the new logos are:
- einzeilig: 1200x1211 (ratio 0.991)
- zweizeilig: 1200x1284 (ratio 0.935)

vs old:
- SHORT: 245x248 (ratio 0.988)
- LONG: 245x268 (ratio 0.914)

The height-to-width ratios are slightly different, meaning the white bar position relative to logo width may need recalibration. The `PINK_BAR_OFFSET_FROM_TOP` value of 0.90 was tuned for the old logo — it needs visual verification with the new logo.

---

## 10. Build System Impact

### 10.1 Build JS Script

**File:** `/root/workspace/scripts/build-js.js`

No template names are hardcoded. The `JS_FILES_ORDER` array lists source files to bundle — no changes needed unless new JS files are added.

### 10.2 Logo JSON Generation

**File:** `/root/workspace/logo_json.py` and Makefile

```makefile
logo-json:
    ls resources/images/logos/gemeinden | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/gemeinden-logos.json
    ls resources/images/logos/bundeslaender | grep -v "120" | sort | python3 logo_json.py > resources/images/logos/index/bundeslaender-logos.json
    ls resources/images/logos/domains | sort | grep -v "120" | python3 logo_json.py > resources/images/logos/index/domains-logos.json
```

The `grep -v "120"` filters out the small logo variants. If the new logo naming convention changes, this filter might need updating. However, since the sub-org logos are just TEXT overlays on the base logo (no individual image files per org), the logo index generation is unaffected. The sub-org directories (`gemeinden/`, `bundeslaender/`) appear to be EMPTY (no files found), so the index.json is manually maintained or generated from a different source.

**WAIT** — the Makefile pipes directory listings into `logo_json.py`, but when I listed `gemeinden/` it was empty. The `index.json` must be generated separately or committed directly. Let me verify...

The `index.json` in the repo root of logos directory has 511 entries across 6 categories, so it's pre-generated and committed. The Makefile target generates sub-index files, not the main one.

---

## Interfaces Summary

<interfaces>
// From resources/js/constants.js
const AppConstants = {
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
    FONTS: {
        DEFAULT_LOGO: "Gotham Narrow Bold",
        DEFAULT_TEXT: "Gotham Narrow Ultra",
        PRELOAD_FONTS: [...]
    },
    LOGO: {
        SCALE_RATIO: 10,
        TEXT_SCALE_LONG: 4.8,
        TEXT_SCALE_SHORT: 6,
        MAX_TEXT_LENGTH: 16,
        LINE_HEIGHT: 0.8,
        ANGLE: -5.5,
        WIDTH_SCALE: 0.95,
        PINK_BAR_OFFSET_FROM_TOP: 0.90,
        BORDER_CUT_RATIO: 0.91,
        BORDERLESS_MARGIN_PERCENT: 0.02,
        FILES: {
            LONG: "Gruene_Logo_245_268.png",
            SHORT: "Gruene_Logo_245_248.png",
            SMALL_LONG: "Gruene_Logo_120_131.png",
            SMALL_SHORT: "Gruene_Logo_120_121.png"
        }
    },
    SCALING: {
        CROSS_DEFAULT_WIDTH_RATIO: 0.4,
        CROSS_DEFAULT_HEIGHT_RATIO: 0.3
    }
};

const TemplateConstants = {
    TEMPLATES: {
        // Each template: { width, height, topBorderMultiplier, border, logoTop, logoTextTop, dpi }
    },
    getTemplate(templateName): object | null,
    getCurrentTemplate(): object | null
};

// From resources/js/main.js
function replaceCanvas(): void  // reads #canvas-template, creates canvas + contentRect + logo
function calculateLogoTop(logoHeight: number, template: object): number
function addLogo(): void  // reads #logo-selection, determines SHORT/LONG, loads image, adds text overlay
function loadLogoSelection(): void  // loads index.json into #logo-selection dropdown
function generateLogoSelection(data: object): void

// From resources/js/logo-state.js
const LogoState = {
    _enabled: boolean,
    isLogoEnabled(): boolean,
    setLogoEnabled(enabled: boolean): void,
    initialize(): void
};

// From resources/js/event-handlers.js
const EventHandlerUtils = {
    setupCrossHandler(): void,        // loads Ankreuzen.png
    setupPinkCircleHandler(): void,   // creates pink circle with PINK_CIRCLE color
    setupQRCodeHandler(): void,       // reads #qr-color for QR generation
    setupCanvasObjectHandlers(): void, // handles #text-color, #font-style-select, #line-height
    initializeAllHandlers(): void
};

// From resources/js/canvas-utils.js
const CanvasUtils = {
    positionBackgroundImage(): void,   // clips to contentRect bounds
    bringLogoToFront(): void,
    exportCanvas(format, quality, targetDPI): { dataURL, actualDPI, targetDPI },
    scaleElementToFit(element, maxWidthRatio, maxHeightRatio): void
};

// From resources/js/qrcode/qrcode-generator.js
const QR_COLORS = {
    '#000000': 'Schwarz',
    '#FFFFFF': 'Weiß',
    '#538430': 'Dunkelgrün',
    '#82B624': 'Hellgrün',
    '#FFED00': 'Gelb',
    '#E6007E': 'Magenta'
};

// From resources/js/wizard.js
function preloadFonts(): void  // loads 4 Gotham Narrow variants
function setupAutoAdvance(): void  // handles facebook_header warning

// From tailwind.config.js
colors: {
    'gruene-primary': '#8AB414',
    'gruene-secondary': '#538430',
    'gruene-dark': '#2D5016',
}

// From visual-regression/tests/test-utils.js
export async function setupBasicTemplate(page, templateType = 'post_45_border')
</interfaces>

---

## Potential Conflicts

1. **contentRect references:** Even with border=0 and solid bg, contentRect must remain because `positionBackgroundImage()`, `enablePictureMove()`, pink circle sizing, and logo scaling all reference it.

2. **Template renaming in tests:** The default template in `test-utils.js` is `post_45_border`. When this template is removed, ALL tests using the default will break silently if not updated.

3. **Logo scaling formula change:** The current dynamic formula `(contentRect.width + contentRect.height) / 10` must be replaced with fixed widths. This changes the `addLogo()` function signature/behavior significantly.

4. **Pink bar offset recalibration:** New logos have slightly different aspect ratios. The `PINK_BAR_OFFSET_FROM_TOP` of 0.90 was tuned for old logos and will need visual testing with new ones.

5. **Small logo fallback:** The `scaleTo < 121` branch uses string replacement on filenames. New logos are 1200px wide, so small variants either need to be created or the fallback removed.
