# Ecosystem Research: Corporate Identity Update

**Researched:** 2026-04-03
**Confidence:** HIGH (most findings verified against codebase + official docs)

---

## 1. EPS to PNG Conversion

### Recommendation: Use ImageMagick with Ghostscript backend

**Command for high-quality transparent PNG:**
```bash
convert -density 600 -background none "Wahl Kreuz im Kreis.eps" -trim +repage -resize 2000x2000 PNG32:"wahl-kreuz-im-kreis.png"
```

**Key flags explained:**
- `-density 600`: Rasterize EPS at 600 DPI (high quality source; the EPS is vector so higher density = more detail)
- `-background none`: Preserve transparency (no white fill)
- `-trim +repage`: Remove whitespace around the symbol
- `-resize 2000x2000`: Scale to a reasonable max size for the largest canvas (4961x7016 for A2). The symbol will be further scaled by Fabric.js `scaleToWidth()` so a 2000px source is more than sufficient
- `PNG32:` prefix: Force 32-bit RGBA output (ensures alpha channel)

**Alternative using Ghostscript directly:**
```bash
gs -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r600 -sOutputFile=wahl-kreuz-im-kreis.png "Wahl Kreuz im Kreis.eps"
```
The `pngalpha` device creates PNG with alpha channel. However, ImageMagick is preferred because it provides `-trim` and `-resize` in one pipeline.

**Environment note:** Neither ImageMagick nor Ghostscript are currently installed in the dev environment. The conversion should be done once as a pre-processing step (not at runtime) and the resulting PNG committed to the repository. Install temporarily with `apt-get install imagemagick ghostscript` or use any machine with these tools.

**Why not do this at runtime:** The app is purely client-side. EPS conversion requires server-side tools. The PNG must be pre-generated and stored in `resources/images/` alongside or replacing the existing logo files.

**Output resolution guidance:** For the symbol to look crisp on the largest template (A2 = 4961x7016, logo ~1200px wide based on dynamic formula), a source PNG of 2000x2000 is sufficient. Fabric.js `scaleToWidth()` handles downscaling well. For smaller templates, the same PNG works fine since downscaling preserves quality.

**Confidence:** HIGH - ImageMagick/Ghostscript EPS-to-PNG is a well-established workflow.

### Sources
- [ImageMagick transparent EPS discussion](https://imagemagick.org/discourse-server/viewtopic.php?t=15985)
- [Ghostscript pngalpha device documentation](https://ghostscript.readthedocs.io/en/latest/Devices.html)

---

## 2. Fabric.js Fixed Logo Sizing (v4.1.0)

### Current Behavior (from codebase analysis)

The project uses **Fabric.js 4.1.0**. The current logo sizing uses a dynamic formula:
```javascript
const scaleTo = (contentRect.width + contentRect.height) / AppConstants.LOGO.SCALE_RATIO; // SCALE_RATIO = 10
```

This produces different logo sizes per template. The issue requires switching to **fixed pixel sizes per template**.

### `scaleToWidth()` Behavior in Fabric.js 4.x

`scaleToWidth(value)` sets `scaleX` and `scaleY` uniformly so that the rendered width equals `value` pixels at zoom=1. Key details:

- **It does NOT modify the underlying image dimensions** - it only sets scale factors
- **Aspect ratio is always preserved** (both scaleX and scaleY set to the same value)
- **The value is in canvas logical pixels**, not screen pixels
- **No quality loss for downscaling** - the source image is kept at full resolution, only the display scale changes

### Retina/DPI Gotcha

**Critical:** On retina displays, Fabric.js multiplies the canvas backing store by `devicePixelRatio` by default. However, `scaleToWidth()` operates in **logical pixels**, not backing store pixels. So `scaleToWidth(374)` will always produce a 374-logical-pixel-wide logo regardless of retina scaling.

This means: the fixed pixel values from the mm-to-pixel conversion table work directly with `scaleToWidth()` without any retina adjustment needed.

### Export Quality

When exporting with `canvas.toDataURL()`, the exported image uses the canvas dimensions (which already account for retina if `enableRetinaScaling` is true). The logo will export at the correct pixel size.

**Important:** If the source PNG is smaller than the target `scaleToWidth` value, upscaling will cause blur. The pre-generated PNG must be large enough for the biggest template. With a 2000px source and maximum target of ~1200px (A2 template), this is fine.

### Positioning Without Borders

For borderless templates, the current code uses:
```javascript
BORDERLESS_MARGIN_PERCENT: 0.02 // 2% margin from canvas bottom
```

For the new CI, logo positioning changes from center-bottom to bottom-left or bottom-right. Use:
```javascript
image.set({
    left: marginPx,           // e.g., border width or a fixed margin
    top: canvasHeight - image.getScaledHeight() - marginPx,
    originX: 'left',
    originY: 'top'
});
```

**Do NOT use `canvas.centerObjectH(image)`** for the new layout since logos are no longer centered.

### Confidence: HIGH
Direct verification against Fabric.js 4.1.0 source in the repo and official API behavior.

### Sources
- [Fabric.js scaleToWidth tutorial](https://www.tutorialspoint.com/fabricjs-how-to-scale-an-image-object-to-a-given-width)
- [Fabric.js retina scaling issue #2554](https://github.com/fabricjs/fabric.js/issues/2554)
- [Fabric.js image quality issue #5073](https://github.com/fabricjs/fabric.js/issues/5073)
- Codebase: `/root/workspace/vendors/fabric-js/fabric.js` (v4.1.0)

---

## 3. Print Size Calculations (mm to pixels)

### Formula: `pixels = mm * dpi / 25.4`

This is the standard conversion. 25.4mm = 1 inch.

### Verified Calculations

| Template | DPI (from constants.js) | Size in mm | Pixels (exact) | Pixels (rounded) |
|----------|------------------------|------------|-----------------|-------------------|
| A4       | 250                    | 38mm       | 374.02          | **374**           |
| A5       | 300                    | 27mm       | 318.90          | **319**           |
| A6       | 300                    | 19mm       | 224.41          | **224**           |

### Rounding Impact on Print Quality

At 250-300 DPI, a 1-pixel difference equals 0.085-0.1mm. This is **imperceptible** in print. Use `Math.round()` for all conversions. The sub-pixel precision does not matter.

### Template DPI Values (from codebase)

| Template | Canvas px | DPI | Notes |
|----------|-----------|-----|-------|
| story    | 1080x1920 | 200 | Social media, DPI irrelevant for screen |
| post_45  | 1080x1350 | 200 | Social media |
| event    | 1920x1005 | 200 | Social media |
| fb_header| 820x360   | 150 | Social media |
| A2       | 4961x7016 | 150 | Print |
| A3       | 3508x4961 | 200 | Print |
| A4       | 2480x3508 | 250 | Print |
| A5       | 1748x2480 | 300 | Print |
| A6       | 1240x1748 | 300 | Print |

**Note:** For social media templates, DPI is meaningless (screens use pixels, not inches). The mm-to-pixel conversion only applies to print templates (A2-A6). For social media templates, the issue should specify logo sizes directly in pixels.

### Confidence: HIGH
Pure math, verified with Python.

---

## 4. Tailwind CSS Color Configuration

### Current Setup (from `tailwind.config.js`)

```javascript
colors: {
    'gruene-primary': '#8AB414',    // Light green (current)
    'gruene-secondary': '#538430',  // Dark green (current)
    'gruene-dark': '#2D5016',       // Darkest green (current)
}
```

### How to Update Colors

To add the new dark green `#257639`, update `tailwind.config.js`:
```javascript
colors: {
    'gruene-primary': '#8AB414',       // Keep or update based on new CI
    'gruene-secondary': '#257639',     // NEW dark green
    'gruene-dark': '#2D5016',          // Keep or update
}
```

After changing, rebuild CSS:
```bash
npm run build-css-prod
```

### Impact Analysis of Color Changes

Files referencing Tailwind color classes (`bg-gruene-*`, `text-gruene-*`, `border-gruene-*`, `focus:ring-gruene-*`):

| File | Usage | Impact |
|------|-------|--------|
| `index.html` | `bg-gruene-primary` on nav tabs | Visual change to tabs |
| `index-production.html` | Same as index.html | Must rebuild |
| `resources/css/input.css` | `.btn-primary`, form focus states, dropdowns, active states (~12 usages) | All buttons/inputs change |
| `resources/js/modal.js` | `bg-gruene-secondary` for active labels | Active state color changes |
| `resources/js/qrcode/qrcode-handlers.js` | `bg-gruene-primary` for QR type tabs | QR wizard tab colors change |
| `resources/js/qrcode/qrcode-wizard.js` | `bg-gruene-primary` for active QR type buttons | Same |

**Hardcoded hex values that are NOT Tailwind classes:**
- `#538430` appears as a QR code color option value in `index.html` (Dunkelgruen dropdown) and in tests
- `rgba(138, 180, 20)` and `rgba(83,132,48)` in `constants.js` COLORS for canvas backgrounds
- `rgb(225,0,120)` for the pink circle in `constants.js`

**Action required:** If the brand green changes, update BOTH:
1. Tailwind config (for UI elements)
2. `AppConstants.COLORS` in `constants.js` (for canvas-rendered elements)
3. Hardcoded `#538430` in HTML option values and test files

### Confidence: HIGH
Direct codebase analysis.

---

## 5. Visual Regression Test Updates

### Current Test Infrastructure

The project uses a **custom visual comparison system** (NOT Playwright's built-in `toMatchSnapshot`):
- `GENERATE_REFERENCE=true` environment variable triggers reference image generation
- Uses `pixelmatch` library (v5.3.0) for pixel-by-pixel comparison
- Reference images stored in `visual-regression/reference-images/`
- Comparison results in `visual-regression/comparison-results/`

### Bulk Update Strategy for CI Overhaul

**Step 1: Understand the scope.** There are 14 visual test files across 3 parallel projects (fast, medium, complex). A branding overhaul will invalidate virtually ALL reference images since colors, logos, and layouts change.

**Step 2: Regenerate all references at once.**
```bash
npm run build
GENERATE_REFERENCE=true npx playwright test visual-regression/tests/
```
Or use the script:
```bash
npm run generate-references
```

**Step 3: Verify visually.** After regeneration, manually inspect a sample of reference images to confirm they look correct with the new branding. There is no automated "does this look right" check - human review is essential after a branding change.

**Step 4: Run comparison tests to ensure zero diff.**
```bash
npm run test:visual
```
All tests should pass since references were just generated.

### Recommended Workflow for the Transition

1. **Implement all CI changes first** (colors, logos, sizes, positioning)
2. **Run tests to see which fail** (expect most/all to fail)
3. **Regenerate ALL reference images in one batch** using `GENERATE_REFERENCE=true`
4. **Visually inspect** a representative sample of generated references
5. **Commit new references** alongside the code changes
6. **Run full test suite** to verify zero regression

### Avoiding False Positives

- Do NOT regenerate references incrementally (one test at a time). Do it all at once after all branding changes are complete.
- The `pixelmatch` threshold is set in `test-utils.js`. If minor anti-aliasing differences cause failures after the overhaul, consider a small tolerance increase (0.01-0.05) temporarily.
- Playwright's chromium flags (`--font-render-hinting=none`, `--disable-lcd-text`, `--force-device-scale-factor=1`) in the config already minimize rendering inconsistencies.

### Test Files That Will Definitely Need New References

All 14 test files are potentially affected, but particularly:
- `core-functionality.spec.js` - Tests basic template rendering
- `templates.spec.js` - Tests all template types
- `elements.spec.js` - Tests visual elements including logos
- `logo-toggle.spec.js` - Tests logo on/off
- `logo-text-positioning.spec.js` - Tests logo placement
- `positioning.spec.js` - Tests element positioning

### New Test Considerations

Any new CI features (new logo type, new symbol, new positioning) should have NEW test cases. Per CLAUDE.md, new test files MUST be added to `playwright.config.js` in the appropriate project category.

### Confidence: HIGH
Verified against actual test infrastructure in the codebase.

---

## 6. Additional Findings

### Fabric.js toDataURL Export

The current codebase does not appear to use a `multiplier` option for `toDataURL()`. This means exports match the canvas logical size. For print templates, canvas dimensions are already at print resolution (e.g., A4 = 2480x3508 at 250 DPI), so no multiplier is needed. The fixed pixel logo sizes will export at the correct dimensions.

### Font Loading

The app preloads fonts via FontFaceObserver. If the new CI changes fonts, the `AppConstants.FONTS.PRELOAD_FONTS` array must be updated. If fonts stay the same (Gotham Narrow family), no changes needed.

### Build Pipeline

After all changes, the full build must be run:
```bash
npm run build
```
This generates `build/app.min.js`, `build/vendors.min.js`, and `build/app.min.css`. The `index-production.html` in the build directory uses these bundles.
