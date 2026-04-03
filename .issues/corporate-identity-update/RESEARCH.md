# Research: Corporate Identity Update

**Date:** 2026-04-03
**Confidence:** HIGH
**Sources:** Codebase analysis, ecosystem research, pitfalls analysis

---

## User Constraints (from CONTEXT.md — verbatim)

- **Post template consolidation:** Merge `post_45_border` and `post_45_no_border` into a single "Feed-Post 4:5" template with border=0
- **Logo variant selection:** Keep auto-select logic based on text length. Map einzeilig → SHORT, zweizeilig → LONG
- **Print logo sizing:** A4=374px, A5=319px, A6=224px; Social media=163px (all fixed)
- **Wahlkreuz symbol:** Convert EPS→PNG at `resources/images/Wahlkreuz.png`
- **Sub-org logos:** Use new base logo at canvas render time; sub-org PNGs on disk unchanged
- **Background color:** Single solid `#257639`, remove visual content rectangle
- **All borders removed:** Every template gets border=0

---

## Summary

This is a comprehensive branding overhaul touching **templates, logos, colors, fonts, QR codes, symbols, and tests** across the Bildgenerator. The codebase is well-structured with clear separation (constants.js for config, main.js for canvas logic, event-handlers.js for UI), making the changes tractable despite their breadth.

**Primary recommendation:** Execute in phases — (1) template/border/color infrastructure changes, (2) logo system overhaul, (3) UI changes (fonts, text colors, QR colors, symbol rename), (4) test updates. The most critical risk is the `contentRect` dependency chain: ~20 code references rely on this object existing even though borders are removed. Keep contentRect as a full-canvas invisible rect rather than deleting it.

**Second major risk:** `index-production.html` is a separate manual copy of `index.html`. Every HTML change must be duplicated in both files, or production breaks while development works.

---

## Codebase Analysis

### Templates (constants.js:116-265, index.html:598-622)

**Current state:** 15 templates defined. 5 must be REMOVED (`post_45_border`, `a2`, `a2_quer`, `a3`, `a3_quer`). All remaining 10 templates need `border: 0` and a new `logoWidth` property.

**New template key for merged post:** Use `feed_post_45` as the internal key (value attribute). Display name: "Feed-Post 4:5".

<interfaces>
// NEW template structure (add logoWidth to each)
TemplateConstants.TEMPLATES = {
    feed_post_45: { width: 1080, height: 1350, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163 },
    story:        { width: 1080, height: 1920, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163 },
    event:        { width: 1920, height: 1005, topBorderMultiplier: 1, border: 0, dpi: 200, logoWidth: 163 },
    facebook_header: { width: 820, height: 360, topBorderMultiplier: 1, border: 0, dpi: 150, logoWidth: 163 },
    a4:           { width: 2480, height: 3508, topBorderMultiplier: 1, border: 0, dpi: 250, logoWidth: 374 },
    a4_quer:      { width: 3508, height: 2480, topBorderMultiplier: 1, border: 0, dpi: 250, logoWidth: 374 },
    a5:           { width: 1748, height: 2480, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 319 },
    a5_quer:      { width: 2480, height: 1748, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 319 },
    a6:           { width: 1240, height: 1748, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 224 },
    a6_quer:      { width: 1748, height: 1240, topBorderMultiplier: 1, border: 0, dpi: 300, logoWidth: 224 },
};
</interfaces>

**HTML changes required in BOTH `index.html` AND `index-production.html`:**
- Remove: `post_45_border`, `post_45_no_border`, `a2`, `a2_quer`, `a3`, `a3_quer` options
- Add: `feed_post_45` option with label "Feed-Post 4:5"
- Rename labels: "Story-Format", "Veranstaltungs-Header", "Facebook Header", "A4 Hochformat/Querformat", etc.
- Reorder: Social Media first (Feed-Post, Story, Facebook Header, Veranstaltungs-Header), then Druck (A4, A5, A6)

### Logo System (main.js:131-261, constants.js:87-108)

**Current flow:** `addLogo()` → dynamic formula `(contentRect.w+h)/10` → `scaleToWidth(scaleTo)` → small variant fallback if `scaleTo < 121`

**New flow:** `addLogo()` → `template.logoWidth` (fixed per template) → `scaleToWidth(logoWidth)` → no small variant needed

**Logo files:**
- Move `Logo-einzeilig_blanko.png` (1200x1211) → `resources/images/logos/Logo-einzeilig_blanko.png`
- Move `Logo-zweizeilig_blanko.png` (1200x1284) → `resources/images/logos/Logo-zweizeilig_blanko.png`
- New logos are 1200px wide — sufficient for all templates (max logoWidth=374px, all downscaling)

**Constants changes (constants.js):**

<interfaces>
// OLD
LOGO: {
    SCALE_RATIO: 10,             // REMOVE — no longer dynamic
    FILES: {
        LONG: "Gruene_Logo_245_268.png",
        SHORT: "Gruene_Logo_245_248.png",
        SMALL_LONG: "Gruene_Logo_120_131.png",   // REMOVE — no small variants
        SMALL_SHORT: "Gruene_Logo_120_121.png"    // REMOVE — no small variants
    }
}

// NEW
LOGO: {
    FILES: {
        LONG: "Logo-zweizeilig_blanko.png",   // zweizeilig = LONG (multi-line org names)
        SHORT: "Logo-einzeilig_blanko.png"    // einzeilig = SHORT (single-line org names)
    },
    // Keep: TEXT_SCALE_LONG, TEXT_SCALE_SHORT, MAX_TEXT_LENGTH, LINE_HEIGHT, ANGLE, WIDTH_SCALE
    // Keep: BORDERLESS_MARGIN_PERCENT (0.02) — used for logo positioning
    // Rename: PINK_BAR_OFFSET_FROM_TOP → BAR_OFFSET_FROM_TOP (same value, recalibrate visually)
    // Remove: BORDER_CUT_RATIO (0.91) — only used in bordered path, now dead code
    // Remove: SCALE_RATIO — replaced by template.logoWidth
}
</interfaces>

**Small variant fallback (main.js:181-185):** REMOVE entirely. New logos are 1200px wide; `scaleToWidth()` handles downscaling cleanly. The string-replace hack (`"245"→"120"`) would be a no-op on new filenames anyway.

### Logo Text Overlay — WHITE ON WHITE RISK (main.js:217-248)

**CRITICAL PITFALL:** Current logo text color is `rgb(255,255,255)` (white). New logo has a WHITE bar. White text on white = invisible.

**Fix required:** Change `LOGO_TEXT` color constant. Recommended: dark green `#257639` to match the new branding, or black `#000000`. This needs visual verification with the new logo files.

**Positioning constants to recalibrate:**
- `PINK_BAR_OFFSET_FROM_TOP: 0.90` — may need adjustment for new logo proportions
- `ANGLE: -5.5` — verify against new logo design
- Aspect ratios are close (old SHORT 0.988 vs new einzeilig 0.991) so offset may be similar

### contentRect — KEEP AS INVISIBLE FULL-CANVAS RECT

**~20 code references** depend on `contentRect` existing:
- `canvas-utils.js`: `positionBackgroundImage()` clips to contentRect bounds
- `event-handlers.js`: Pink circle sizing, bring-to-front guard
- `main.js`: Logo scaling (being replaced), global export
- Visual regression tests: Object identity checks

**Recommendation:** Keep contentRect but set `fill: "#257639"` and full canvas dimensions. With `border=0` the math already produces a full-canvas rect. Just change the fill color to match `BACKGROUND_PRIMARY`. This is the lowest-risk approach.

### Color System

**AppConstants.COLORS changes (constants.js:63-72):**

| Constant | Old Value | New Value |
|---|---|---|
| `BACKGROUND_PRIMARY` | `rgba(138, 180, 20)` | `#257639` |
| `BACKGROUND_SECONDARY` | `rgba(83,132,48)` | `#257639` |
| `LOGO_TEXT` | `rgb(255,255,255)` | `#257639` or `#000000` (needs visual test) |
| `PINK_CIRCLE` | `rgb(225,0,120)` | Keep (not in scope) |

**Text color options (index.html:795-802, index-production.html):**

| Old | New |
|---|---|
| `rgb(255,240,0)` Gelb | `#FFED00` Gelb |
| `rgb(255,255,255)` Weiß | `#FFFFFF` Weiß |
| (none) | `#000000` Schwarz (NEW) |

**QR colors — 4 HTML locations + 2 JS constants:**

| System | File | Element | Change |
|---|---|---|---|
| Wizard QR | index.html:948 | `#qr-color` | `#538430` → `#257639` |
| Wizard QR | index-production.html | `#qr-color` | Same |
| Standalone QR | index.html:317 | `#qr-color-select` | `#538430`→`#257639`, `#82B624`→`#56AF31` |
| Standalone QR | index-production.html | `#qr-color-select` | Same |
| JS constant | qrcode-generator.js:6 | `QR_COLORS` | `#538430`→`#257639`, `#82B624`→`#56AF31` |
| JS constant | qrcode-helpers.js:225 | duplicate | `#538430`→`#257639`, `#82B624`→`#56AF31` |

**Tailwind theme (tailwind.config.js:9-13):**
- `gruene-primary`: `#8AB414` → `#257639`
- `gruene-secondary`: `#538430` → `#56AF31` (new Hellgrün)
- `gruene-dark`: `#2D5016` → review if still needed

**CSS hardcoded colors (style.css):** 7 instances of `#8ab414` (step indicators, focus states, button hover) — all must change to `#257639`.

### Font System (index.html:776-784, event-handlers.js:63-69)

**Remove:** `<select id="font-style-select">` from both HTML files and its label.

**JS cleanup:**
- `event-handlers.js:63-69`: Remove `#font-style-select` change handler (dead code)
- `event-handlers.js:150`: `jQuery("#font-style-select").val() || "Gotham Narrow Ultra"` — replace with hardcoded `"Gotham Narrow Ultra"` (remove jQuery call)
- `handlers.js:30`: Remove `jQuery('#font-style-select').val(...)` sync (dead code)

**Font loading:** Keep all 4 fonts in `PRELOAD_FONTS` — "Gotham Narrow Bold" is still used for logo text overlay.

### Symbol/Wahlkreuz (event-handlers.js:274-286, index.html:917-919)

**EPS conversion:** `convert -density 600 -background none "Wahl Kreuz im Kreis.eps" -trim +repage -resize 2000x2000 PNG32:resources/images/Wahlkreuz.png`

**Changes:**
1. Convert EPS → PNG (one-time, requires ImageMagick+Ghostscript)
2. `event-handlers.js:274`: Change path from `"resources/images/Ankreuzen.png"` to `"resources/images/Wahlkreuz.png"`
3. `index.html:917-919`: Change button label from "Häkchen" to "Wahlkreuz", icon from `fa-check` to `fa-xmark`
4. Same changes in `index-production.html`

---

## Standard Stack

| Tool | Version | Purpose |
|---|---|---|
| Fabric.js | 4.1.0 (in repo) | Canvas manipulation — `scaleToWidth()` for fixed logo sizes |
| ImageMagick | Latest (one-time use) | EPS→PNG conversion for Wahlkreuz symbol |
| Ghostscript | Latest (one-time use) | Backend for ImageMagick EPS rendering |
| pixelmatch | 5.3.0 (in repo) | Visual regression comparison |
| Playwright | In repo | Visual + e2e test runner |

---

## Don't Hand-Roll

- **EPS rendering** — Use ImageMagick, don't attempt browser-side EPS parsing
- **Logo downscaling** — Fabric.js `scaleToWidth()` handles this natively, no manual pixel math
- **Visual regression framework** — Use existing `GENERATE_REFERENCE=true` infrastructure, don't build custom diffing

---

## Architecture Patterns

1. **Add `logoWidth` property to template definitions** rather than passing sizes through a separate lookup table. Keeps template config self-contained.
2. **Keep contentRect as full-canvas rect** with matching background color. Preserves existing API surface for background image clipping, movement bounds, and test assertions.
3. **Update both HTML files** (index.html + index-production.html) for every UI change. Consider adding a comment at the top of each listing the sync requirement.

---

## Common Pitfalls (Priority Order)

| # | Pitfall | Severity | Mitigation |
|---|---|---|---|
| 1 | `test-utils.js:18` default template is `post_45_border` — breaks ALL visual tests | HIGH | Update default to `feed_post_45` FIRST |
| 2 | `index-production.html` is separate manual copy — production breaks if not synced | HIGH | Update in lockstep with `index.html` |
| 3 | Two QR systems × 2 HTML files = 4 locations + 2 JS constants for color updates | HIGH | Checklist: update all 6 locations |
| 4 | White logo text on white bar = invisible org names | HIGH | Change `LOGO_TEXT` color to `#257639` or `#000000` |
| 5 | Small logo fallback (`scaleTo < 121`) uses string replace on filenames — no-op on new names | HIGH | Remove small variant logic entirely |
| 6 | `contentRect` referenced in ~20 places — can't just delete it | HIGH | Keep as full-canvas rect with same fill color |
| 7 | 80 reference images will ALL break — must regenerate in single pass | HIGH | Regenerate AFTER all code changes complete |
| 8 | `PINK_BAR_OFFSET_FROM_TOP` tuned for old logo geometry | MEDIUM | Visual calibration needed with new logos |
| 9 | Font dropdown removal — dead JS handlers | MEDIUM | Clean up event-handlers.js and handlers.js |
| 10 | CSS has 7 hardcoded `#8ab414` references | MEDIUM | Global replace in style.css |
| 11 | Yellow color inconsistency: `rgb(255,240,0)` vs `#FFED00` | LOW | Standardize to `#FFED00` |

---

## Environment Availability

- **ImageMagick/Ghostscript:** NOT installed in dev environment. Install temporarily for one-time EPS conversion, or convert on any machine with these tools.
- **Node.js + npm:** Available (build system works)
- **Playwright + Chromium:** Available (visual tests run)
- **Docker dev environment:** Available via `make docker-dev`

---

## Project Constraints (from CLAUDE.md)

- Never use inline styles — always Tailwind; custom styles only in CSS files when absolutely necessary
- Visual regression tests must use pixelmatch for image comparison
- New visual test files MUST be added to `playwright.config.js` in the appropriate project category
- Both `index.html` (dev) and `index-production.html` (prod) must be kept in sync
- Vendor JS/CSS additions require updates to build scripts (`build-js.js`, `build-css.js`)

---

## Sources

| Finding | Confidence | Source |
|---|---|---|
| Template definitions and structure | HIGH | Direct codebase read (constants.js) |
| Logo system flow and constants | HIGH | Direct codebase read (main.js, constants.js) |
| contentRect dependency chain | HIGH | Grep across all JS files |
| QR color locations (6 total) | HIGH | Grep + manual HTML/JS verification |
| EPS→PNG conversion approach | HIGH | ImageMagick documentation + standard practice |
| Fabric.js `scaleToWidth()` behavior | HIGH | Vendor source code in repo (v4.1.0) |
| mm-to-pixel calculations | HIGH | Standard formula, verified mathematically |
| White-on-white logo text risk | HIGH | Constants analysis (LOGO_TEXT=white, new logo has white bar) |
| Production HTML sync requirement | HIGH | Diff of index.html vs index-production.html |
| Visual test default template impact | HIGH | Grep for `post_45_border` across test files |
