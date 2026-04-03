# Plan: Corporate Identity Update — New GRÜNE Branding

<objective>
What this plan accomplishes: Implements the complete new GRÜNE corporate identity across the Bildgenerator — new templates, logo files, colors, fonts, QR codes, and symbols — ensuring visual consistency across all templates and both HTML entry points.

Why it matters: The party's branding has changed; all generated materials must reflect the new CI to be usable for campaigns.

Scope: All template definitions, logo system, color constants, font selection, QR color pickers, symbol rename, CSS theme, visual regression baselines. OUT of scope: updating sub-org logo PNGs on disk, new templates beyond spec, mobile/responsive changes.

No CONTEXT.md discretion items left unresolved — logo text color set to `#257639` (dark green on white bar), border rendering code kept dormant (border=0 path already works), logo positioning uses existing `BORDERLESS_MARGIN_PERCENT` since all templates are now borderless.
</objective>

<context>
Issue: @.issues/corporate-identity-update/ISSUE.md
Research: @.issues/corporate-identity-update/RESEARCH.md

<interfaces>
<!-- Executor: use these contracts directly. Do not explore the codebase. -->

From resources/js/constants.js (lines 1-278):
// CURRENT AppConstants.COLORS (lines 63-72) — replace values as shown in tasks
COLORS: {
    BACKGROUND_PRIMARY: "rgba(138, 180, 20)",    // -> "#257639"
    BACKGROUND_SECONDARY: "rgba(83,132,48)",      // -> "#257639"
    LOGO_TEXT: "rgb(255,255,255)",                 // -> "#257639" (dark green on white bar)
    PINK_CIRCLE: "rgb(225,0,120)",                 // KEEP unchanged
    TEXT_STROKE: "#000000",                        // KEEP
    CORNER_COLOR: "yellow",                        // KEEP
    BORDER_COLOR: "rgba(88,42,114)",               // KEEP
    CORNER_STROKE: "#000000"                       // KEEP
}

// CURRENT AppConstants.LOGO (lines 87-108) — restructure as shown in Task 1
LOGO: {
    SCALE_RATIO: 10,                               // REMOVE
    TEXT_SCALE_LONG: 4.8,                           // KEEP
    TEXT_SCALE_SHORT: 6,                            // KEEP
    MAX_TEXT_LENGTH: 16,                            // KEEP
    LINE_HEIGHT: 0.8,                               // KEEP
    ANGLE: -5.5,                                    // KEEP
    WIDTH_SCALE: 0.95,                              // KEEP
    PINK_BAR_OFFSET_FROM_TOP: 0.90,                // RENAME to BAR_OFFSET_FROM_TOP, KEEP value
    BORDER_CUT_RATIO: 0.91,                        // REMOVE (dead code, all borders=0)
    BORDERLESS_MARGIN_PERCENT: 0.02,               // KEEP
    FILES: {
        LONG: "Gruene_Logo_245_268.png",           // -> "Logo-zweizeilig_blanko.png"
        SHORT: "Gruene_Logo_245_248.png",          // -> "Logo-einzeilig_blanko.png"
        SMALL_LONG: "Gruene_Logo_120_131.png",     // REMOVE
        SMALL_SHORT: "Gruene_Logo_120_121.png"     // REMOVE
    }
}

// CURRENT TemplateConstants.TEMPLATES (lines 116-253) — full replacement in Task 1

From resources/js/main.js:
// replaceCanvas(template) at line 17 — sets canvas.backgroundColor from BACKGROUND_PRIMARY (line 48)
// contentRect created at line 64 — uses BACKGROUND_SECONDARY for fill (line 69)
// addLogo() at line 131 — reads LOGO.SCALE_RATIO (line 149), LOGO.FILES (line 158/176), small variant fallback (lines 181-186)
// calculateLogoTop() at line 103 — uses BORDER_CUT_RATIO (line 120) and BORDERLESS_MARGIN_PERCENT (line 124)
// Logo text created at line 220 — uses COLORS.LOGO_TEXT for fill (line 226)

From resources/js/event-handlers.js:
// Font select handler at lines 63-70 — '#font-style-select' change handler (REMOVE)
// Text add uses font-style-select at line 150: jQuery("#font-style-select").val() || "Gotham Narrow Ultra"
// Cross handler at line 274-286 — loads "resources/images/Ankreuzen.png"

From resources/js/handlers.js:
// Line 30: jQuery('#font-style-select').val(activeObject.fontFamily) — sync handler (REMOVE)

From resources/js/qrcode/qrcode-generator.js (lines 6-13):
const QR_COLORS = {
    '#000000': 'Schwarz', '#FFFFFF': 'Weiss', '#538430': 'Dunkelgruen',
    '#82B624': 'Hellgruen', '#FFED00': 'Gelb', '#E6007E': 'Magenta'
};

From resources/js/qrcode/qrcode-helpers.js (lines 220-227):
getColorDisplayName: function(colorValue) {
    const colorNames = {
        '#000000': 'Schwarz', '#FFFFFF': 'Weiss', '#538430': 'Dunkelgruen',
        '#82B624': 'Hellgruen', '#FFED00': 'Gelb', '#E6007E': 'Magenta'
    };
}

From visual-regression/tests/test-utils.js (line 18):
export async function setupBasicTemplate(page, templateType = 'post_45_border') {
// Default template parameter must change to 'feed_post_45'
</interfaces>

Key files:
@resources/js/constants.js — template definitions, logo config, color constants
@resources/js/main.js — canvas initialization, logo rendering, contentRect
@resources/js/event-handlers.js — font select handler, cross/symbol handler
@resources/js/handlers.js — font select sync (line 30)
@resources/js/qrcode/qrcode-generator.js — standalone QR color constants
@resources/js/qrcode/qrcode-helpers.js — QR color display name map
@index.html — dev HTML (template selector, font select, text colors, QR colors, symbol button)
@index-production.html — production HTML (must mirror ALL index.html UI changes)
@resources/css/style.css — 7 hardcoded #8ab414 references
@tailwind.config.js — theme color definitions
@visual-regression/tests/test-utils.js — default template for all visual tests
@visual-regression/tests/templates.spec.js — template-specific test cases
</context>

<commit_format>
Format: conventional without issue prefix
Example: feat(templates): restructure templates for new CI branding
Pattern: {type}({scope}): {description}
</commit_format>

<tasks>

<task type="auto">
  <name>Task 1: Restructure template definitions and color constants</name>
  <files>resources/js/constants.js</files>
  <action>
  This is the foundational task. All subsequent changes depend on these constants being correct.

  **1a. Replace TemplateConstants.TEMPLATES (lines 117-253) with the new set:**

  Remove these template keys entirely: `post_45_border`, `post_45_no_border`, `a2`, `a2_quer`, `a3`, `a3_quer`.

  Replace with this exact structure (note: add `logoWidth` property to every template, set all `border: 0`, set all `topBorderMultiplier: 1`):

  ```javascript
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
  ```

  Remove the old `logoTop` and `logoTextTop` properties — they are unused (auto-calculated).

  **1b. Update AppConstants.COLORS (lines 63-72):**
  - `BACKGROUND_PRIMARY`: `"rgba(138, 180, 20)"` -> `"#257639"`
  - `BACKGROUND_SECONDARY`: `"rgba(83,132,48)"` -> `"#257639"`
  - `LOGO_TEXT`: `"rgb(255,255,255)"` -> `"#257639"` (CRITICAL: white text on white bar = invisible; dark green matches new branding)

  **1c. Update AppConstants.LOGO (lines 87-108):**
  - Remove `SCALE_RATIO: 10` — replaced by per-template `logoWidth`
  - Remove `BORDER_CUT_RATIO: 0.91` — dead code since all borders are 0
  - Remove `SMALL_LONG` and `SMALL_SHORT` from FILES
  - Change `LONG`: `"Gruene_Logo_245_268.png"` -> `"Logo-zweizeilig_blanko.png"`
  - Change `SHORT`: `"Gruene_Logo_245_248.png"` -> `"Logo-einzeilig_blanko.png"`
  - Rename `PINK_BAR_OFFSET_FROM_TOP` -> `BAR_OFFSET_FROM_TOP` (keep value 0.90)
  - Keep: `TEXT_SCALE_LONG`, `TEXT_SCALE_SHORT`, `MAX_TEXT_LENGTH`, `LINE_HEIGHT`, `ANGLE`, `WIDTH_SCALE`, `BORDERLESS_MARGIN_PERCENT`
  </action>
  <verify>
  <automated>cd /root/workspace && node -e "
    eval(require('fs').readFileSync('resources/js/constants.js','utf8'));
    const t = TemplateConstants.TEMPLATES;
    console.assert(t.feed_post_45 && t.feed_post_45.logoWidth === 163, 'feed_post_45 missing or wrong logoWidth');
    console.assert(!t.post_45_border && !t.post_45_no_border, 'old post templates still exist');
    console.assert(!t.a2 && !t.a3 && !t.a2_quer && !t.a3_quer, 'A2/A3 templates still exist');
    console.assert(t.a6 && t.a6.logoWidth === 224, 'A6 missing or wrong logoWidth');
    console.assert(Object.values(t).every(v => v.border === 0), 'not all borders are 0');
    console.assert(AppConstants.COLORS.BACKGROUND_PRIMARY === '#257639', 'BACKGROUND_PRIMARY wrong');
    console.assert(AppConstants.COLORS.LOGO_TEXT === '#257639', 'LOGO_TEXT wrong');
    console.assert(!AppConstants.LOGO.SCALE_RATIO, 'SCALE_RATIO should be removed');
    console.assert(!AppConstants.LOGO.FILES.SMALL_LONG, 'SMALL_LONG should be removed');
    console.assert(AppConstants.LOGO.FILES.LONG === 'Logo-zweizeilig_blanko.png', 'LONG filename wrong');
    console.assert(AppConstants.LOGO.BAR_OFFSET_FROM_TOP === 0.90, 'BAR_OFFSET_FROM_TOP missing');
    console.log('All constants checks passed');
  "
  </automated>
  </verify>
  <done>
  - TemplateConstants.TEMPLATES contains exactly 10 templates: feed_post_45, story, event, facebook_header, a4, a4_quer, a5, a5_quer, a6, a6_quer
  - All templates have border: 0 and a logoWidth property
  - A2, A3, post_45_border, post_45_no_border are removed
  - Colors updated to #257639, logo filenames point to new blanko files
  </done>
</task>

<task type="auto">
  <name>Task 2: Update logo system in main.js — fixed sizing, remove small variant fallback</name>
  <files>resources/js/main.js</files>
  <action>
  **2a. Update addLogo() function (line 131-261):**

  At line 149, replace the dynamic scaling formula:
  ```javascript
  // OLD (line 149):
  const scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO;
  // NEW:
  const template = currentTemplate();
  const scaleTo = template.logoWidth;
  ```

  **2b. Remove small variant fallback (lines 181-186):**
  Delete this entire block:
  ```javascript
  if (scaleTo < 121) {
    logoFilename = logoFilename
      .replace("245", "120")
      .replace("248", "121")
      .replace("268", "131");
  }
  ```
  The new logo files are 1200px wide; `scaleToWidth()` handles downscaling natively.

  **2c. Update logo text positioning (line 217):**
  Change the reference from `PINK_BAR_OFFSET_FROM_TOP` to `BAR_OFFSET_FROM_TOP`:
  ```javascript
  // OLD:
  const offsetFromTop = image.getScaledWidth() * AppConstants.LOGO.PINK_BAR_OFFSET_FROM_TOP;
  // NEW:
  const offsetFromTop = image.getScaledWidth() * AppConstants.LOGO.BAR_OFFSET_FROM_TOP;
  ```

  **2d. Remove duplicate `const template = currentTemplate()` at line 204** since we now declare it earlier (step 2a). The `image.top = calculateLogoTop(logoHeight, template)` at line 205 should use the one already declared.

  **2e. Simplify calculateLogoTop() (lines 103-127):**
  Since all templates now have `border: 0`, the `if (template.border > 0)` branch is dead code. You may keep it for safety (dormant), but update the comment to note all templates are borderless. No functional change needed here — the `else` branch (borderless) already works correctly.

  **2f. Update the `scaleToWidth` call (line 198):**
  ```javascript
  // OLD:
  image.scaleToWidth(scaleTo);
  // This already uses the variable from 2a, just verify it's using the new `scaleTo` from template.logoWidth
  ```
  </action>
  <verify>
  <automated>cd /root/workspace && node -e "
    const fs = require('fs');
    const src = fs.readFileSync('resources/js/main.js', 'utf8');
    console.assert(!src.includes('SCALE_RATIO'), 'SCALE_RATIO reference still in main.js');
    console.assert(!src.includes('replace(\"245\"'), 'Small variant fallback still in main.js');
    console.assert(!src.includes('SMALL_LONG') && !src.includes('SMALL_SHORT'), 'Small variant references still present');
    console.assert(src.includes('BAR_OFFSET_FROM_TOP'), 'BAR_OFFSET_FROM_TOP not found');
    console.assert(!src.includes('PINK_BAR_OFFSET_FROM_TOP'), 'Old PINK_BAR reference still present');
    console.assert(src.includes('template.logoWidth') || src.includes('currentTemplate().logoWidth'), 'logoWidth not used');
    console.log('main.js checks passed');
  "
  </automated>
  </verify>
  <done>
  - Logo sizing uses fixed template.logoWidth instead of dynamic formula
  - Small variant fallback removed entirely
  - PINK_BAR_OFFSET_FROM_TOP renamed to BAR_OFFSET_FROM_TOP
  - contentRect kept as full-canvas rect (not deleted)
  </done>
</task>

<task type="auto">
  <name>Task 3: Move logo files and convert Wahlkreuz EPS</name>
  <files>resources/images/logos/Logo-einzeilig_blanko.png, resources/images/logos/Logo-zweizeilig_blanko.png, resources/images/Wahlkreuz.png</files>
  <action>
  **3a. Move new logo files from repo root to logos directory:**
  ```bash
  mv Logo-einzeilig_blanko.png resources/images/logos/Logo-einzeilig_blanko.png
  mv Logo-zweizeilig_blanko.png resources/images/logos/Logo-zweizeilig_blanko.png
  ```

  **3b. Convert Wahlkreuz EPS to PNG:**

  PREREQUISITE: ImageMagick with Ghostscript must be available. Install if needed:
  ```bash
  # On Fedora/RHEL:
  dnf install -y ImageMagick ghostscript
  ```

  Then convert:
  ```bash
  convert -density 600 -background none "Wahl Kreuz im Kreis.eps" -trim +repage -resize 2000x2000 PNG32:resources/images/Wahlkreuz.png
  ```

  If ImageMagick cannot be installed, create a placeholder note and skip. The executor should try installing it first.

  **3c. Update event-handlers.js line 277:**
  Change the image path in `setupCrossHandler()`:
  ```javascript
  // OLD (line 277):
  generatorApplicationURL + "resources/images/Ankreuzen.png",
  // NEW:
  generatorApplicationURL + "resources/images/Wahlkreuz.png",
  ```
  </action>
  <verify>
  <automated>cd /root/workspace && ls -la resources/images/logos/Logo-einzeilig_blanko.png resources/images/logos/Logo-zweizeilig_blanko.png && echo "Logo files moved OK" && test -f resources/images/Wahlkreuz.png && echo "Wahlkreuz PNG exists" || echo "WARNING: Wahlkreuz.png missing — ImageMagick may not be available" && grep -q "Wahlkreuz.png" resources/js/event-handlers.js && echo "event-handlers.js updated OK"</automated>
  </verify>
  <done>
  - Logo-einzeilig_blanko.png and Logo-zweizeilig_blanko.png in resources/images/logos/
  - Wahlkreuz.png created at resources/images/Wahlkreuz.png (or noted as requiring manual conversion)
  - event-handlers.js references Wahlkreuz.png instead of Ankreuzen.png
  </done>
</task>

<task type="auto">
  <name>Task 4: Update HTML in both index.html and index-production.html</name>
  <files>index.html, index-production.html</files>
  <action>
  CRITICAL: Every change below must be made in BOTH files. The sections are at different line numbers but structurally identical.

  **4a. Template selector (#canvas-template):**

  index.html: lines 598-622
  index-production.html: lines 1127-1151

  Replace the entire `<select>` contents (keep the `<select>` tag and its attributes) with:
  ```html
  <optgroup label="Social Media">
    <option value="feed_post_45">Feed-Post 4:5</option>
    <option value="story">Story-Format</option>
    <option value="facebook_header">Facebook Header</option>
    <option value="event">Veranstaltungs-Header</option>
  </optgroup>
  <optgroup label="Druck">
    <option value="a4">A4 Hochformat</option>
    <option value="a4_quer">A4 Querformat</option>
    <option value="a5">A5 Hochformat</option>
    <option value="a5_quer">A5 Querformat</option>
    <option value="a6">A6 Hochformat</option>
    <option value="a6_quer">A6 Querformat</option>
  </optgroup>
  ```

  Removed: `post_45_border`, `post_45_no_border`, `a2`, `a2_quer`, `a3`, `a3_quer`.
  Renamed labels: "Instagram/Facebook Story" -> "Story-Format", "Veranstaltung" -> "Veranstaltungs-Header", "A4 Poster" -> "A4 Hochformat", "A5 Flyer" -> "A5 Hochformat", etc.

  **4b. Remove font selector (#font-style-select):**

  index.html: lines 770-785 (the entire `<div>` containing the label and select)
  index-production.html: lines 1298-1314

  Remove the entire block:
  ```html
  <div>
    <label for="font-style-select" ...>Schriftart:</label>
    <select class="form-select w-full" id="font-style-select">
      <option value="Gotham Narrow Ultra">Überschrift</option>
      <option value="Gotham Narrow Book">Fließtext</option>
    </select>
  </div>
  ```

  **4c. Update text color options (#text-color):**

  index.html: lines 795-802
  index-production.html: lines 1324-1331

  Replace the `<option>` elements inside `#text-color` select:
  ```html
  <option value="#FFFFFF">Weiß</option>
  <option value="#000000">Schwarz</option>
  <option value="#FFED00">Gelb</option>
  ```

  Note: old values were `rgb(255,240,0)` and `rgb(255,255,255)`. New values use hex. Added Black.

  **4d. Update wizard QR color (#qr-color):**

  index.html: line 948-951
  index-production.html: lines 1477-1480

  Replace the options in `#qr-color` select:
  ```html
  <option value="#000000">Schwarz</option>
  <option value="#257639">Dunkelgrün</option>
  ```

  (Changed `#538430` -> `#257639`)

  **4e. Update standalone QR color (#qr-color-select):**

  index.html: lines 317-324
  index-production.html: lines 846-853

  In the `#qr-color-select` options, change:
  - `#538430` (Dunkelgrün) -> `#257639`
  - `#82B624` (Hellgrün) -> `#56AF31`

  Keep Schwarz, Weiß, Gelb, Magenta unchanged.

  **4f. Rename Häkchen to Wahlkreuz:**

  index.html: lines 917-919
  index-production.html: lines 1446-1448

  Change:
  ```html
  <!-- OLD -->
  <button class="element-button" id="add-cross">
    <i class="fas fa-check"></i>Häkchen
  </button>
  <!-- NEW -->
  <button class="element-button" id="add-cross">
    <i class="fas fa-xmark"></i>Wahlkreuz
  </button>
  ```

  Change icon from `fa-check` to `fa-xmark` and label from "Häkchen" to "Wahlkreuz".
  </action>
  <verify>
  <automated>cd /root/workspace && for f in index.html index-production.html; do echo "=== Checking $f ===" && grep -q "feed_post_45" "$f" && echo "OK: feed_post_45 found" || echo "FAIL: feed_post_45 missing" && ! grep -q "post_45_border" "$f" && echo "OK: post_45_border removed" || echo "FAIL: post_45_border still present" && ! grep -q "font-style-select" "$f" && echo "OK: font-style-select removed" || echo "FAIL: font-style-select still present" && grep -q '#FFED00' "$f" && echo "OK: new yellow hex found" || echo "FAIL: #FFED00 missing" && grep -q '#000000.*Schwarz' "$f" && echo "OK: black text color found" || echo "FAIL: black text color missing" && grep -q 'Wahlkreuz' "$f" && echo "OK: Wahlkreuz found" || echo "FAIL: Wahlkreuz missing" && grep -q 'fa-xmark' "$f" && echo "OK: fa-xmark found" || echo "FAIL: fa-xmark missing" && ! grep -q '"a2"' "$f" && ! grep -q '"a3"' "$f" && echo "OK: A2/A3 removed" || echo "FAIL: A2/A3 still present"; done</automated>
  </verify>
  <done>
  - Template selector shows exactly: Feed-Post 4:5, Story-Format, Facebook Header, Veranstaltungs-Header, A4 H/Q, A5 H/Q, A6 H/Q
  - Font selector completely removed from both HTML files
  - Text colors: Weiss (#FFFFFF), Schwarz (#000000), Gelb (#FFED00)
  - Wizard QR offers Schwarz + Dunkelgrün (#257639)
  - Standalone QR uses #257639 and #56AF31
  - Häkchen renamed to Wahlkreuz with fa-xmark icon
  - Both index.html and index-production.html are in sync
  </done>
</task>

<task type="auto">
  <name>Task 5: Update QR JS constants and remove font handler dead code</name>
  <files>resources/js/qrcode/qrcode-generator.js, resources/js/qrcode/qrcode-helpers.js, resources/js/event-handlers.js, resources/js/handlers.js</files>
  <action>
  **5a. Update QR_COLORS in qrcode-generator.js (lines 6-13):**
  Change:
  - `'#538430': 'Dunkelgrün'` -> `'#257639': 'Dunkelgrün'`
  - `'#82B624': 'Hellgrün'` -> `'#56AF31': 'Hellgrün'`

  **5b. Update colorNames in qrcode-helpers.js (lines 220-227):**
  Same changes:
  - `'#538430': 'Dunkelgrün'` -> `'#257639': 'Dunkelgrün'`
  - `'#82B624': 'Hellgrün'` -> `'#56AF31': 'Hellgrün'`

  **5c. Remove font-style-select handler in event-handlers.js (lines 63-70):**
  Delete the entire `'#font-style-select': { 'change': function() { ... } }` block from the event bindings object. Keep the surrounding entries (`'#shadow-depth'` above, `'#line-height'` below) intact.

  **5d. Hardcode font in event-handlers.js (line 150):**
  Replace:
  ```javascript
  const selectedFont = jQuery("#font-style-select").val() || "Gotham Narrow Ultra";
  ```
  With:
  ```javascript
  const selectedFont = "Gotham Narrow Ultra";
  ```

  **5e. Remove font-style-select sync in handlers.js (line 30):**
  Delete:
  ```javascript
  jQuery('#font-style-select').val(activeObject.fontFamily);
  ```
  </action>
  <verify>
  <automated>cd /root/workspace && node -e "
    const fs = require('fs');
    const qrGen = fs.readFileSync('resources/js/qrcode/qrcode-generator.js','utf8');
    const qrHelp = fs.readFileSync('resources/js/qrcode/qrcode-helpers.js','utf8');
    const evtH = fs.readFileSync('resources/js/event-handlers.js','utf8');
    const hand = fs.readFileSync('resources/js/handlers.js','utf8');
    console.assert(qrGen.includes('#257639') && qrGen.includes('#56AF31'), 'qrcode-generator colors not updated');
    console.assert(!qrGen.includes('#538430') && !qrGen.includes('#82B624'), 'old colors still in qrcode-generator');
    console.assert(qrHelp.includes('#257639') && qrHelp.includes('#56AF31'), 'qrcode-helpers colors not updated');
    console.assert(!evtH.includes('font-style-select'), 'font-style-select still in event-handlers');
    console.assert(!hand.includes('font-style-select'), 'font-style-select still in handlers');
    console.log('QR + font cleanup checks passed');
  "
  </automated>
  </verify>
  <done>
  - QR colors updated in all 6 locations (2 JS constants + 4 HTML options from Task 4)
  - Font selector event handlers and sync code removed
  - Font hardcoded to "Gotham Narrow Ultra"
  </done>
</task>

<task type="auto">
  <name>Task 6: Update CSS theme colors</name>
  <files>tailwind.config.js, resources/css/style.css</files>
  <action>
  **6a. Update tailwind.config.js (lines 9-13):**
  ```javascript
  colors: {
    'gruene-primary': '#257639',
    'gruene-secondary': '#56AF31',
    'gruene-dark': '#1a5428',
  },
  ```
  Changed: `#8AB414` -> `#257639`, `#538430` -> `#56AF31`, `#2D5016` -> `#1a5428` (darker shade of new primary for hover states).

  **6b. Replace all 7 instances of `#8ab414` in style.css with `#257639`:**

  These are at lines: 199, 201, 236, 374, 404, 417, 476.

  Do a global find-and-replace: `#8ab414` -> `#257639` (case-insensitive, there are 7 occurrences).

  **6c. Rebuild Tailwind CSS:**
  ```bash
  cd /root/workspace && npx tailwindcss -i resources/css/input.css -o resources/css/output.css
  ```
  </action>
  <verify>
  <automated>cd /root/workspace && ! grep -i "#8ab414" resources/css/style.css && echo "OK: no old green in style.css" && grep -q "#257639" tailwind.config.js && echo "OK: tailwind primary updated" && npx tailwindcss -i resources/css/input.css -o resources/css/output.css 2>&1 | tail -1 && echo "CSS build OK"</automated>
  </verify>
  <done>
  - All 7 hardcoded #8ab414 in style.css replaced with #257639
  - Tailwind theme colors updated
  - output.css regenerated
  </done>
</task>

<task type="auto">
  <name>Task 7: Update visual regression tests and e2e tests for new template names</name>
  <files>visual-regression/tests/test-utils.js, visual-regression/tests/templates.spec.js, visual-regression/tests/core-functionality.spec.js, visual-regression/tests/positioning.spec.js, visual-regression/tests/error-handling.spec.js, visual-regression/tests/wizard-navigation.spec.js, visual-regression/tests/logo-text-positioning.spec.js, visual-regression/tests/logo-toggle.spec.js, e2e/canvas-operations.spec.js, e2e/complete-wizard-flow.spec.js, e2e/template-operations.spec.js</files>
  <action>
  **7a. Update default template in test-utils.js (line 18):**
  ```javascript
  // OLD:
  export async function setupBasicTemplate(page, templateType = 'post_45_border') {
  // NEW:
  export async function setupBasicTemplate(page, templateType = 'feed_post_45') {
  ```
  This is CRITICAL — nearly all visual tests use this default.

  **7b. Update templates.spec.js:**

  REMOVE these test cases entirely (templates no longer exist):
  - "Template Post 4:5 with Border" (lines 10-21) — references `post_45_border`
  - "Template Post 4:5 without Border" (lines 23-34) — references `post_45_no_border`
  - "Template A3 Portrait" (lines 103-114) — references `a3`
  - "Template A3 Landscape" (lines 116-127) — references `a3_quer`
  - "Template A2 Portrait" (lines 157-168) — references `a2`
  - "Template A2 Landscape" (lines 170-181) — references `a2_quer`

  ADD a new test case for Feed-Post 4:5:
  ```javascript
  test('Template Feed-Post 4:5 - Test feed post layout 1080x1350', async ({ page }) => {
    console.log('Testing feed post 4:5 template...');
    await page.selectOption('#canvas-template', 'feed_post_45');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-feed-post-45');
  });
  ```

  Keep: story, event, facebook_header, A4, A4 landscape, A5, A5 landscape tests. They don't reference removed templates.

  ADD test cases for A6:
  ```javascript
  test('Template A6 Portrait - Test A6 flyer layout', async ({ page }) => {
    console.log('Testing A6 portrait template...');
    await page.selectOption('#canvas-template', 'a6');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-portrait');
  });

  test('Template A6 Landscape - Test A6 landscape layout', async ({ page }) => {
    console.log('Testing A6 landscape template...');
    await page.selectOption('#canvas-template', 'a6_quer');
    await page.waitForTimeout(2000);
    await setupBasicTemplate(page);
    await page.click('#step-2-next');
    await page.waitForTimeout(1000);
    await compareWithReference(page, 'template-a6-landscape');
  });
  ```

  **7c. Global replace in ALL visual regression test files:**
  Replace every remaining `'post_45_border'` with `'feed_post_45'` in:
  - `logo-text-positioning.spec.js` (lines 24, 107, 187)
  - `logo-toggle.spec.js` (lines 24, 89, 166, 191, 255, 281, 333, 351)
  - `core-functionality.spec.js` (lines 13, 19)
  - `positioning.spec.js` (line 458)
  - `error-handling.spec.js` (lines 337, 355)
  - `wizard-navigation.spec.js` (lines 16, 23)

  Also update assertion strings: `toBe('post_45_border')` -> `toBe('feed_post_45')` in core-functionality.spec.js and error-handling.spec.js.

  **7d. Global replace in e2e test files:**
  Replace `'post_45_border'` with `'feed_post_45'` in:
  - `e2e/canvas-operations.spec.js` (line 11)
  - `e2e/complete-wizard-flow.spec.js` (lines 18, 141, 162)
  - `e2e/template-operations.spec.js` (lines 22, 48)
  </action>
  <verify>
  <automated>cd /root/workspace && ! grep -r "post_45_border\|post_45_no_border" visual-regression/tests/ e2e/ && echo "OK: no old template references in tests" && grep -q "feed_post_45" visual-regression/tests/test-utils.js && echo "OK: default template updated" && grep -q "template-feed-post-45" visual-regression/tests/templates.spec.js && echo "OK: new feed post test exists" && grep -q "template-a6-portrait" visual-regression/tests/templates.spec.js && echo "OK: A6 test exists"</automated>
  </verify>
  <done>
  - test-utils.js default template is feed_post_45
  - All post_45_border and post_45_no_border references replaced with feed_post_45
  - A2 and A3 template tests removed
  - Feed-Post 4:5 and A6 portrait/landscape tests added
  - E2E tests updated
  </done>
</task>

<task type="auto">
  <name>Task 8: Regenerate all visual regression reference images</name>
  <files>visual-regression/reference-images/</files>
  <action>
  This task MUST run AFTER all code changes are complete. Reference images will change due to: new background color (#257639), removed borders, new logo files, template restructuring.

  **8a. Delete old reference images for removed templates:**
  ```bash
  rm -f visual-regression/reference-images/template-post-45-border.png
  rm -f visual-regression/reference-images/template-post-45-no-border.png
  rm -f visual-regression/reference-images/template-a2-portrait.png
  rm -f visual-regression/reference-images/template-a2-landscape.png
  rm -f visual-regression/reference-images/template-a3-portrait.png
  rm -f visual-regression/reference-images/template-a3-landscape.png
  ```

  **8b. Start dev server and regenerate ALL reference images in a single pass:**
  ```bash
  # Start server in background
  cd /root/workspace && python3 -m http.server 8000 &
  SERVER_PID=$!

  # Regenerate all reference images
  GENERATE_REFERENCE=true npx playwright test --config=playwright.config.js --project=fast-tests --project=medium-tests --project=complex-tests

  # Stop server
  kill $SERVER_PID
  ```

  If the above fails for specific tests, run those tests individually with `GENERATE_REFERENCE=true` to regenerate their baselines.

  **8c. Verify reference images were created for new templates:**
  ```bash
  ls -la visual-regression/reference-images/template-feed-post-45.png
  ls -la visual-regression/reference-images/template-a6-portrait.png
  ls -la visual-regression/reference-images/template-a6-landscape.png
  ```

  NOTE: Some tests may fail during regeneration if they have hardcoded color expectations or assertions beyond visual comparison. Fix any such failures by updating the expected values in the test code to match the new CI colors.
  </action>
  <verify>
  <automated>cd /root/workspace && test -f visual-regression/reference-images/template-feed-post-45.png && echo "feed-post ref exists" && test -f visual-regression/reference-images/template-a6-portrait.png && echo "a6 portrait ref exists" && ! test -f visual-regression/reference-images/template-a2-portrait.png && echo "a2 refs removed" && ! test -f visual-regression/reference-images/template-post-45-border.png && echo "old post refs removed"</automated>
  </verify>
  <done>
  - All old reference images for removed templates deleted
  - All reference images regenerated with new CI branding
  - New reference images created for feed_post_45, a6, a6_quer
  </done>
</task>

</tasks>

<verification>
After all tasks, run final checks:
- `cd /root/workspace && npm test` — Jest unit/integration tests pass
- `cd /root/workspace && npx playwright test --config=playwright.config.js --project=fast-tests --project=medium-tests --project=complex-tests` — Visual regression tests pass against new baselines
- `cd /root/workspace && npx playwright test --config=playwright.config.js --project=e2e-tests` — E2E tests pass
- `cd /root/workspace && npm run build` — Production build succeeds
</verification>

<success_criteria>
Measurable criteria proving the issue is complete:
- Template list shows exactly: Feed-Post 4:5, Story-Format, Facebook Header, Veranstaltungs-Header, A4 H/Q, A5 H/Q, A6 H/Q
- A2 and A3 templates are removed from both code and UI
- A6 Hochformat and A6 Querformat templates are added and functional
- New logo files (white bar, einzeilig/zweizeilig blanko) replace old logo files
- All templates have border: 0 (full-bleed)
- Social media logos render at 163px, print logos at per-template sizes (A4=374, A5=319, A6=224)
- Default background color is #257639 for all templates
- Font dropdown removed; only Gotham Narrow Ultra available
- Text colors: White (#FFFFFF), Black (#000000), Yellow (#FFED00)
- QR code color picker in wizard: Black + Dark Green (#257639)
- QR Generator standalone: #257639 (Dunkelgrün), #56AF31 (Hellgrün)
- "Häkchen" renamed to "Wahlkreuz" with cross icon and new symbol image
- All visual regression reference images regenerated
- All test suites pass (Jest, Playwright visual, Playwright e2e)
- Production build succeeds
</success_criteria>
